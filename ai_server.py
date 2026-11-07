#!/usr/bin/env python3
"""Local server for One Vision (App 2).

Serves the dashboard files and relays AI chat requests to any provider that
speaks the OpenAI "chat completions" format (OpenAI, Google Gemini, Groq,
OpenRouter, Anthropic's OpenAI-compatible endpoint...). The API key is read
from .env and never sent to the browser.

    python3 ai_server.py            # uses .env; AI hidden if no key
    python3 ai_server.py --mock     # scripted AI replies, for testing without a key
    python3 ai_server.py --port 8788
"""
import json, os, re, sys, time, urllib.error, urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
MAX_BODY = 200_000
BLOCKED = re.compile(r"^/(\.|Data/|pipeline/|checkpoints/|ai_server\.py)", re.I)


def load_env(path):
    env = {}
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


ENV = {**load_env(os.path.join(HERE, ".env")), **{k: v for k, v in os.environ.items() if k.startswith("AI_")}}
MOCK = "--mock" in sys.argv
BASE = ENV.get("AI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
KEY = ENV.get("AI_API_KEY", "")
MODEL = ENV.get("AI_MODEL", "gpt-4o-mini")
FALLBACK = ENV.get("AI_FALLBACK_MODEL", "")  # tried once when the main model is overloaded (429/5xx)
ENABLED = MOCK or bool(KEY)


# ------------------------------------------------------------------ mock provider
def _call(name, args, i=0):
    return {"id": f"call_{name}_{i}", "type": "function", "function": {"name": name, "arguments": json.dumps(args)}}


def _reply(content=None, tool_calls=None):
    msg = {"role": "assistant", "content": content}
    if tool_calls:
        msg["tool_calls"] = tool_calls
    return {"id": "mock", "object": "chat.completion", "model": "mock",
            "choices": [{"index": 0, "message": msg, "finish_reason": "tool_calls" if tool_calls else "stop"}]}


def mock_completion(body):
    msgs = body.get("messages", [])
    if not body.get("tools"):   # One Vision memo: plain completion, no tools
        facts = json.loads(msgs[-1]["content"]) if msgs and msgs[-1].get("content", "").startswith("{") else {}
        return _reply(f"### Headline\n**{facts.get('branch', 'This branch')}** scores {facts.get('health_score', '?')}/100 ({facts.get('band', '')}).\n\n"
                      "### Priority moves\n1. Mock move one\n2. Mock move two\n3. Mock move three\n\n_Scripted reply — add an API key to `.env` for a real memo._")
    last = msgs[-1] if msgs else {}
    if last.get("role") == "user":
        text = str(last.get("content", ""))
        m = re.search(r"chart_id=([a-z_]+)", text)
        if m:
            return _reply(tool_calls=[_call("get_chart_data", {"chart_id": m.group(1)})])
        return _reply(tool_calls=[_call("query_data", {"dataset": "sales", "group_by": ["month"], "measures": ["disbursed_cr", "sanctioned_cr"]})])
    # after tool results: look at what the previous assistant turn asked for
    prev = next((x for x in reversed(msgs) if x.get("role") == "assistant"), {})
    names = [c["function"]["name"] for c in prev.get("tool_calls", [])]
    results = [x for x in msgs if x.get("role") == "tool"]
    lastres = json.loads(results[-1]["content"]) if results else {}
    if "get_chart_data" in names:
        rows = lastres.get("rows", [])[:3]
        head = lastres.get("columns", [])
        lines = [f"- {' · '.join(f'{h}: {v}' for h, v in zip(head, r))}" for r in rows]
        return _reply(f"**Mock explanation of “{lastres.get('title', '')}”.** The chart currently shows {lastres.get('row_count', 0)} rows. The first few:\n" + "\n".join(lines) + "\n\n_This is a scripted reply — add an API key to `.env` for real answers._")
    if "query_data" in names:
        rows = [{"label": r.get("month"), "value": r.get("disbursed_cr")} for r in lastres.get("rows", [])]
        return _reply(tool_calls=[_call("make_chart", {"type": "bar", "title": "Disbursed by month (₹ Cr)", "rows": rows, "format": "cr"}, 1),
                                  _call("set_filters", {"zone": "South"}, 2),
                                  _call("go_to_chart", {"chart_id": "funnel"}, 3)])
    if "make_chart" in names:
        q = next((json.loads(x["content"]) for x in results if '"dataset"' in x["content"]), {})
        rows = q.get("rows", [])
        best = max(rows, key=lambda r: r.get("disbursed_cr", 0)) if rows else {}
        return _reply(f"**Mock answer.** Disbursals peaked in **{best.get('month', '?')}** at **₹{best.get('disbursed_cr', 0):,.0f} Cr**. "
                      "I drew the monthly trend below, set the page to the **South** zone and scrolled to the pipeline chart.\n\n"
                      "- Tools ran: query_data → make_chart, set_filters, go_to_chart\n\n_Scripted reply — add an API key to `.env` for real answers._")
    return _reply("Mock mode: nothing more to do.")


# ------------------------------------------------------------------ real provider
def provider_completion(body):
    # A multi-round tool conversation must stay on one model (Gemini signs its tool calls per model),
    # so the page sends back the model that answered the previous round.
    sticky = body.get("model")
    if sticky in (MODEL, FALLBACK) and sticky:
        return _call_with_retry(body, sticky)
    code, out = _call_with_retry(body, MODEL, tries=2)
    if FALLBACK and FALLBACK != MODEL and code in (429, 500, 502, 503, 504):
        code2, out2 = _provider_call(body, FALLBACK)
        if code2 == 200:
            out2["model"] = FALLBACK
            return code2, out2
    if code == 200:
        out["model"] = MODEL
    return code, out


def _call_with_retry(body, model, tries=3):
    """Busy/overloaded replies (429/5xx) are retried a couple of times with a short pause."""
    code, out = _provider_call(body, model)
    for pause in (1.5, 3.0)[: tries - 1]:
        if code not in (429, 500, 502, 503, 504):
            break
        time.sleep(pause)
        code, out = _provider_call(body, model)
    return code, out


def _provider_call(body, model):
    payload = {"model": model, "messages": body.get("messages", [])}
    if body.get("tools"):
        payload["tools"] = body["tools"]
        payload["tool_choice"] = body.get("tool_choice", "auto")
    req = urllib.request.Request(BASE + "/chat/completions", data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {KEY}"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            return 200, json.loads(r.read())
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")[:600]
        return e.code, {"error": {"status": e.code, "message": detail}}
    except Exception as e:  # network, timeout
        return 502, {"error": {"status": 502, "message": str(e)[:300]}}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=HERE, **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, code, obj):
        data = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/ai-status":
            return self._json(200, {"enabled": ENABLED, "model": "mock" if MOCK else MODEL if ENABLED else None})
        if BLOCKED.match(path):
            return self.send_error(404)
        return super().do_GET()

    def do_POST(self):
        if self.path.split("?")[0] != "/api/chat":
            return self.send_error(404)
        if not ENABLED:
            return self._json(503, {"error": {"status": 503, "code": "not_configured", "message": "AI is not configured (no AI_API_KEY in .env)."}})
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > MAX_BODY:
            return self._json(413, {"error": {"status": 413, "message": "Request too large."}})
        try:
            body = json.loads(self.rfile.read(n))
        except ValueError:
            return self._json(400, {"error": {"status": 400, "message": "Bad JSON."}})
        if MOCK:
            return self._json(200, mock_completion(body))
        code, out = provider_completion(body)
        return self._json(code, out)

    def log_message(self, fmt, *args):
        if args and "/api/" in str(args[0]):
            sys.stderr.write("%s\n" % (fmt % args))


if __name__ == "__main__":
    port = 8788
    if "--port" in sys.argv:
        port = int(sys.argv[sys.argv.index("--port") + 1])
    mode = "MOCK" if MOCK else f"{MODEL}{' (fallback ' + FALLBACK + ')' if FALLBACK else ''} via {BASE}" if KEY else "OFF (no AI_API_KEY in .env)"
    print(f"One Vision on http://localhost:{port}  ·  AI: {mode}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
