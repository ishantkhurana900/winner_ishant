/* One Vision — analytics model. Pure functions over window.OV (built by pipeline/build.py).
   Everything is computed from additive sums, so any peer group can be rolled up the same way. */
(function (G) {
  "use strict";
  const OV = G.OV;
  const sum = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x), 0);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ------------------------------------------------------------------ vocab
  const FAM = { HOU: "Housing", LAP: "Loan against property", PL: "Personal loan", BL: "Business loan", UCL: "Used-car loan",
                MIC: "Microfinance", GS: "Gold & securities", EF: "Embedded finance", OTH: "Other" };
  const FAM_SHORT = { HOU: "Housing", LAP: "LAP", PL: "Personal", BL: "Business", UCL: "Used car", MIC: "Micro", GS: "Gold/Sec", EF: "Embedded", OTH: "Other" };
  const CORE = ["HOU", "LAP", "PL", "BL", "UCL", "MIC"];
  const CHANNELS = OV.meta.channels;
  const PILLARS = [
    { id: "growth", name: "Growth", src: "Sales · Credit", w: 0.25 },
    { id: "credit", name: "Credit quality", src: "Credit", w: 0.20 },
    { id: "ops", name: "Operations", src: "Operations", w: 0.15 },
    { id: "xsell", name: "Cross-sell", src: "Insurance", w: 0.15 },
    { id: "risk", name: "Portfolio health", src: "Risk", w: 0.25 },
    { id: "market", name: "Local market", src: "Collections", w: 0 },
  ];
  const MONTHS = OV.meta.credit_months;                 // 2025-10 … 2026-10
  const FULL = MONTHS.filter(m => m >= "2025-11" && m <= "2026-09");   // first and last months are partial
  const Q_NOW = ["2026-07", "2026-08", "2026-09"], Q_PREV = ["2026-04", "2026-05", "2026-06"];

  // ------------------------------------------------------------------ branches
  const cols = OV.branches.cols;
  const B = OV.branches.rows.map(r => { const o = {}; cols.forEach((c, i) => (o[c] = r[i])); return o; });
  const NUM = cols.filter(c => typeof OV.branches.rows[0][cols.indexOf(c)] === "number" && !["lat", "lon"].includes(c));

  // local market: Collections at district level, by month (Sep 2026 = latest full month, Oct partial)
  const MKM = { "08": {}, "09": {}, "10": {} };
  for (const [st, d, m, bk, acc, pos, bacc, rpos, racc] of OV.market.rows) {
    if (!MKM[m]) continue;
    for (const key of [st + "|" + d, st + "|*", "*|*"]) {
      const o = (MKM[m][key] = MKM[m][key] || { b1acc: 0, b1bacc: 0, b1pos: 0, b1rpos: 0, npapos: 0, pos: 0, acc: 0, B1: 0, B2: 0, B3: 0, NPA: 0, d: d });
      o.pos += pos; o.acc += acc; o[bk] += pos;
      if (bk === "B1") { o.b1acc += acc; o.b1bacc += bacc; o.b1pos += pos; o.b1rpos += rpos; }
      if (bk === "NPA") o.npapos += pos;
    }
  }
  const MK = MKM["09"];
  // a branch's market key: its district if the book there is meaningful, else its state
  function mkKey(b) { const dk = b.mstate + "|" + b.district; return b.district && MK[dk] && MK[dk].pos >= 150 ? dk : (b.mstate || b.state) + "|*"; }
  function market(key, m) { return (MKM[m] || {})[key] || null; }

  const MKT = ["b1acc", "b1bacc", "b1pos", "b1rpos", "npapos", "pos"];
  for (const b of B) {
    b.core_da = b.s_da - b.sf_da_GS - b.sf_da_EF;
    b.core_dn = b.s_dn - b.sf_dn_GS - b.sf_dn_EF;
    b.core_la = b.s_la - b.sf_la_GS - b.sf_la_EF;
    b.san_now = sum(Q_NOW, m => b["cm_sa_" + m] || 0);
    b.san_prev = sum(Q_PREV, m => b["cm_sa_" + m] || 0);
    for (const f of CORE) {
      b["fnow_" + f] = sum(Q_NOW, m => b["cfm_" + f + "|" + m] || 0);
      b["fprev_" + f] = sum(Q_PREV, m => b["cfm_" + f + "|" + m] || 0);
    }
    // a district with a thin book (< ₹150 Cr POS) says little, so fall back to the state
    b.mk_key = mkKey(b);
    const mk = MK[b.mk_key] || null, dk = mk && !b.mk_key.endsWith("|*");
    b.mk_level = dk ? "district" : mk ? "state" : "none";
    b.mk_name = b.mk_level === "district" ? title(b.district) : (b.mstate || b.state);
    for (const k of MKT) b["m_" + k] = mk ? mk[k] : 0;
    b.eligible = b.core_da >= 0.25 || b.c_dec >= 100;
    b.label = b.name;
  }
  const DERIVED = ["core_da", "core_dn", "core_la", "san_now", "san_prev", ...CORE.flatMap(f => ["fnow_" + f, "fprev_" + f])];
  const FIELDS = [...NUM, ...DERIVED];
  const E = B.filter(b => b.eligible);
  const byId = Object.fromEntries(B.map(b => [b.id, b]));

  function title(s) { return String(s).toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase()); }

  // roll any list of branches up into one pseudo-branch of sums
  function agg(list) {
    const o = { n: list.length };
    for (const f of FIELDS) o[f] = sum(list, b => b[f] || 0);
    // market: count each local market once
    const seen = new Set();
    for (const k of MKT) o["m_" + k] = 0;
    for (const b of list) {
      const key = b.mk_name;
      if (seen.has(key)) continue; seen.add(key);
      for (const k of MKT) o["m_" + k] += b["m_" + k];
    }
    return o;
  }
  const NAT = agg(E);

  // ------------------------------------------------------------------ metrics
  // rate metrics are shrunk toward the national rate: (num + k·prior)/(den + k), so tiny branches can't top a table on luck
  const M = [
    { id: "scale", short: "Disbursal", p: "growth", label: "Core disbursal", sub: "Aug–Sep, excl. gold & securities", fmt: "cr", dir: 1, level: b => b.core_da },
    { id: "mom", short: "Momentum", p: "growth", label: "Sanction momentum", sub: "Jul–Sep vs Apr–Jun", fmt: "chg", dir: 1, num: "san_now", den: "san_prev", k: 2, growth: true, minDen: 0.5 },
    { id: "conv", short: "Login yield", p: "growth", label: "Login-to-disbursal yield", sub: "₹ disbursed per ₹ logged in", fmt: "pct", dir: 1, num: "core_da", den: "core_la", k: 4, minDen: 0.5 },
    { id: "appr", short: "Approval", p: "credit", label: "Approval rate", sub: "sanctioned ÷ decided, 13 months", fmt: "pct", dir: 1, num: "c_san", den: "c_dec", k: 60, minDen: 40 },
    { id: "pull", short: "Booking", p: "credit", label: "Sanction-to-booking", sub: "sanctions that became loans", fmt: "pct", dir: 1, num: "c_booked", den: "c_san", k: 40, minDen: 20 },
    { id: "gate", short: "Auto-reject ↓", p: "credit", label: "Auto-rejected by system", sub: "share of decisions", fmt: "pct", dir: -1, num: "c_gated", den: "c_dec", k: 60, minDen: 40 },
    { id: "ftr", short: "Docket FTR", p: "ops", label: "Docket first-time-right", sub: "HL & MSME dockets", fmt: "pct", dir: 1, num: "o_ftr", den: "o_loans", k: 20, minDen: 8 },
    { id: "tat", short: "LAN ≤ 3 days", p: "ops", label: "Loan no. within 3 days", sub: "login → LAN", fmt: "pct", dir: 1, num: "o_tat3", den: "o_tatn", k: 20, minDen: 8 },
    { id: "esign", short: "e-Sign", p: "ops", label: "Digital e-sign", sub: "share of signed dockets", fmt: "pct", dir: 1, num: "o_esd", den: "o_esn", k: 20, minDen: 8 },
    { id: "overdue", short: "Docs overdue ↓", p: "ops", label: "Post-disbursal docs overdue", sub: "as of 14 Oct 2026", fmt: "pct", dir: -1, num: "o_doco", den: "o_docs", k: 30, minDen: 8 },
    { id: "attach", short: "Attach", p: "xsell", label: "Insurance attach rate", sub: "insured ÷ loans disbursed, Aug–Sep", fmt: "pct", dir: 1, num: "i_loans_as", den: "core_dn", k: 40, minDen: 15, cap: 1 },
    { id: "prem", short: "Premium/₹100", p: "xsell", label: "Premium per ₹100 lent", sub: "Aug–Sep", fmt: "rs", dir: 1, num: "i_prem_as", den: "core_da", k: 2, minDen: 0.25, mult: 100 },
    { id: "ppl", short: "Policies/loan", p: "xsell", label: "Policies per insured loan", sub: "depth of cover", fmt: "x", dir: 1, num: "i_pol", den: "i_loans", k: 20, minDen: 8 },
    { id: "bounce", short: "Bounce ↓", p: "risk", label: "EMI bounce rate", sub: "new loans, Sep 2026", fmt: "pct", dir: -1, num: "r_bn_09", den: "r_du_09", k: 80, minDen: 15 },
    { id: "dpd", short: "Any DPD ↓", p: "risk", label: "Book in any DPD", sub: "share of AUM, Sep 2026", fmt: "pct", dir: -1, num: "r_p1_09", den: "r_aum_09", k: 3, minDen: 0.3 },
    { id: "cibil", short: "CIBIL > 730", p: "risk", label: "Book with CIBIL above 730", sub: "share of AUM", fmt: "pct", dir: 1, num: "r_caum_09", den: "r_aum_09", k: 3, minDen: 0.3 },
    { id: "mb1", short: "Local bounce", p: "market", label: "Local B1 bounce", sub: "accounts bouncing, Sep", fmt: "pct", dir: -1, num: "m_b1bacc", den: "m_b1acc", k: 200, minDen: 50 },
    { id: "mres", short: "Local resolution", p: "market", label: "Local B1 resolution", sub: "₹ of B1 resolved, Sep", fmt: "pct", dir: 1, num: "m_b1rpos", den: "m_b1pos", k: 5, minDen: 1 },
    { id: "mnpa", short: "Local NPA", p: "market", label: "Local NPA share", sub: "of loan book, Sep", fmt: "pct", dir: -1, num: "m_npapos", den: "m_pos", k: 20, minDen: 5 },
    { id: "msize", short: "Local book", p: "market", label: "Local loan book", sub: "POS in the district", fmt: "crk", dir: 1, level: b => b.m_pos },
  ];
  const MID = Object.fromEntries(M.map(m => [m.id, m]));

  function prior(m) { return m.level ? null : NAT[m.num] / NAT[m.den]; }
  for (const m of M) m.prior = prior(m);

  // raw value for any branch or aggregate (null when there isn't enough volume to say)
  function value(m, b, shrink = true) {
    if (m.level) { const v = m.level(b); return v > 0 ? v : null; }
    const n = b[m.num] || 0, d = b[m.den] || 0;
    if (d < m.minDen) return null;
    if (m.growth) return (n + m.k) / (d + m.k) - 1;
    let v = shrink ? (n + m.k * m.prior) / (d + m.k) : n / d;
    if (m.cap) v = Math.min(v, m.cap);
    return m.mult ? v * m.mult : v;
  }
  // percentiles against all eligible branches (100 = best)
  const DIST = {};
  for (const m of M) {
    const vals = E.map(b => value(m, b)).filter(v => v !== null).sort((a, b) => a - b);
    DIST[m.id] = vals;
  }
  function pctOf(m, v) {
    if (v === null || v === undefined) return null;
    const a = DIST[m.id]; if (!a.length) return null;
    let lo = 0, hi = a.length; while (lo < hi) { const mid = (lo + hi) >> 1; a[mid] < v ? (lo = mid + 1) : (hi = mid); }
    let eq = lo; while (eq < a.length && a[eq] === v) eq++;
    const p = ((lo + (eq - lo) / 2) / a.length) * 100;
    return m.dir > 0 ? p : 100 - p;
  }
  function quantile(m, q) {  // value at the q-th percentile of "goodness"
    const a = DIST[m.id]; if (!a.length) return null;
    const qq = m.dir > 0 ? q : 1 - q; return a[Math.min(a.length - 1, Math.max(0, Math.round(qq * (a.length - 1))))];
  }

  // ------------------------------------------------------------------ scoring
  for (const b of B) {
    b.v = {}; b.pct = {}; b.pill = {};
    for (const m of M) { b.v[m.id] = value(m, b); b.pct[m.id] = pctOf(m, b.v[m.id]); }
    for (const P of PILLARS) {
      const ps = M.filter(m => m.p === P.id).map(m => b.pct[m.id]).filter(x => x !== null);
      b.pill[P.id] = ps.length ? sum(ps) / ps.length : null;
    }
    const ws = PILLARS.filter(P => P.w && b.pill[P.id] !== null);
    b.composite = ws.length ? sum(ws, P => P.w * b.pill[P.id]) / sum(ws, P => P.w) : null;
  }
  // health score = percentile rank of the weighted composite, so 80 reads "healthier than 80% of branches"
  const ranked = E.filter(b => b.composite !== null).sort((a, b) => b.composite - a.composite);
  ranked.forEach((b, i) => { b.rank = i + 1; b.health = ranked.length > 1 ? (100 * (ranked.length - 1 - i)) / (ranked.length - 1) : 50; });
  for (const b of B) if (b.health === undefined) b.health = null;
  const NRANK = ranked.length;
  const CUT = { lo: 100 / 3, hi: 200 / 3 };
  function band(h) {
    if (h === null || h === undefined) return { id: "na", name: "Not rated", icon: "·" };
    if (h >= CUT.hi) return { id: "lead", name: "Leader", icon: "▲" };
    if (h >= CUT.lo) return { id: "steady", name: "Steady", icon: "■" };
    return { id: "lag", name: "Lagging", icon: "▼" };
  }
  for (const b of B) b.band = band(b.health);

  // ------------------------------------------------------------------ peers
  const PEER_MODES = [
    { id: "state", name: "State" }, { id: "zone", name: "Zone" }, { id: "size", name: "Similar size" }, { id: "all", name: "All India" }];
  const SIZE_Q = (() => { const a = E.map(b => b.core_da).sort((x, y) => x - y); return [0.2, 0.4, 0.6, 0.8].map(q => a[Math.floor(q * a.length)]); })();
  const sizeBand = b => SIZE_Q.filter(t => b.core_da >= t).length;
  function peers(b, mode) {
    let list, name;
    if (mode === "state") { list = E.filter(x => x.state === b.state); name = b.state + " branches"; if (list.length < 6) { list = E.filter(x => x.zone === b.zone); name = b.zone + " zone branches"; } }
    else if (mode === "zone") { list = E.filter(x => x.zone === b.zone); name = b.zone + " zone branches"; }
    else if (mode === "size") { const s = sizeBand(b); list = E.filter(x => sizeBand(x) === s); name = "similar-size branches"; }
    else { list = E; name = "all branches"; }
    const others = list.filter(x => x.id !== b.id);
    return { list, others, name, agg: agg(others), n: list.length };
  }
  function rankIn(b, list) { const r = list.filter(x => x.health !== null).sort((a, c) => c.health - a.health); return { r: r.indexOf(b) + 1, n: r.length }; }

  // ------------------------------------------------------------------ formatting
  const f1 = d3n(1), f0 = d3n(0);
  function d3n(d) { return v => (+v).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function fmt(m, v) {
    if (v === null || v === undefined || !isFinite(v)) return "–";
    switch (m.fmt) {
      case "pct": return (v * 100).toFixed(v < 0.1 ? 1 : 0) + "%";
      case "chg": return (v >= 0 ? "+" : "−") + Math.abs(v * 100).toFixed(0) + "%";
      case "cr": return "₹" + (v >= 100 ? f0(v) : f1(v)) + " Cr";
      case "crk": return v >= 1000 ? "₹" + f1(v / 1000) + "K Cr" : "₹" + f0(v) + " Cr";
      case "rs": return "₹" + v.toFixed(2);
      case "x": return v.toFixed(2) + "×";
    }
    return String(v);
  }
  const cr = v => (Math.abs(v) >= 100 ? "₹" + f0(v) + " Cr" : Math.abs(v) >= 1 ? "₹" + f1(v) + " Cr" : "₹" + f0(v * 100) + " L");
  const ordinal = n => n + (["th", "st", "nd", "rd"][((n % 100) - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
  const topPct = p => (p >= 50 ? "top " + Math.max(1, Math.round(100 - p)) + "%" : "bottom " + Math.max(1, Math.round(p)) + "%");

  // ------------------------------------------------------------------ BCG, GE, Ansoff, SWOT
  function famGrowth(x, f) { return (x["fnow_" + f] + 0.2) / (x["fprev_" + f] + 0.2) - 1; }
  const NAT_FG = Object.fromEntries(CORE.map(f => [f, NAT["fnow_" + f] / NAT["fprev_" + f] - 1]));
  const NAT_G = NAT.san_now / NAT.san_prev - 1;   // one growth line for the whole matrix: the network's own sanction growth
  function bcg(b) {
    const st = E.filter(x => x.state === b.state && x.id !== b.id);
    const out = [];
    for (const f of CORE) {
      const mine = b["cf_sa_" + f] || 0; if (mine < 0.3) continue;
      const rival = st.reduce((best, x) => ((x["cf_sa_" + f] || 0) > (best ? best["cf_sa_" + f] : 0) ? x : best), null);
      const rv = rival ? rival["cf_sa_" + f] : 0;
      const rel = rv > 0 ? mine / rv : 10;
      const g = famGrowth(b, f), gm = NAT_G;
      const q = rel >= 1 ? (g >= gm ? "Star" : "Cash cow") : (g >= gm ? "Question mark" : "Dog");
      out.push({ f, name: FAM[f], short: FAM_SHORT[f], sa: mine, rel: clamp(rel, 0.03, 10), relRaw: rel, g: clamp(g, -0.9, 3), gRaw: g, gm, q, rival: rival ? rival.name : null, rivalSa: rv });
    }
    return out;
  }
  // market attractiveness: size, collection health and the state's momentum, as percentiles
  const STATE_G = {};
  for (const s of new Set(E.map(b => b.state))) { const a = agg(E.filter(b => b.state === s)); STATE_G[s] = a.san_prev > 0 ? a.san_now / a.san_prev - 1 : 0; }
  const SG = E.map(b => STATE_G[b.state]).sort((a, b) => a - b);
  for (const b of B) {
    const parts = [b.pct.msize, b.pct.mres, b.pct.mb1, b.pct.mnpa].filter(x => x !== null);
    const g = STATE_G[b.state]; const gp = g === undefined ? null : (SG.filter(x => x < g).length / SG.length) * 100;
    if (gp !== null) parts.push(gp);
    b.attractRaw = parts.length ? sum(parts) / parts.length : null; b.stateGrowth = g;
  }
  { const r = E.filter(b => b.attractRaw !== null).sort((a, b) => a.attractRaw - b.attractRaw);
    r.forEach((b, i) => (b.attract = (100 * i) / Math.max(1, r.length - 1)));
    for (const b of B) if (b.attract === undefined) b.attract = null; }
  function geCell(b) {
    const t = v => (v === null ? 1 : v >= 200 / 3 ? 2 : v >= 100 / 3 ? 1 : 0);
    const x = t(b.health), y = t(b.attract);
    const s = x + y;
    const verdict = s >= 3 ? "Invest & grow" : s === 2 ? "Selective — hold & fix" : "Harvest / restructure";
    return { x, y, verdict, tone: s >= 3 ? "lead" : s === 2 ? "steady" : "lag" };
  }

  // what the peer group looks like on a metric: pooled rate, or the average branch for level metrics
  function peerValue(m, P) { return m.level ? (P.others.length ? sum(P.others, x => m.level(x) || 0) / P.others.length : null) : value(m, P.agg, false); }
  function rate(o, num, den) { return o[den] > 0 ? o[num] / o[den] : null; }
  function shares(o, prefix, keys, den) { const t = den !== undefined ? den : sum(keys, k => o[prefix + k] || 0); return Object.fromEntries(keys.map(k => [k, t > 0 ? (o[prefix + k] || 0) / t : 0])); }

  function opportunities(b, P) {
    const A = P.agg, out = [];
    // 1 · conversion of logins
    const cb = rate(b, "core_da", "core_la"), cp = rate(A, "core_da", "core_la");
    if (cb !== null && cp !== null && cp > cb && b.core_la > 1) {
      const gain = b.core_la * (cp - cb) / 2;
      out.push({ lens: "Market penetration", title: "Convert more of the logins it already has", val: gain, unit: "/month",
        text: `Only ${(cb * 100).toFixed(0)}% of ₹ logged in turns into disbursal, against ${(cp * 100).toFixed(0)}% for ${P.name}. Matching them would add about ${cr(gain)} a month from the same pipeline.` });
    }
    // 2 · insurance attach
    const ab = value(MID.attach, b, false), ap = value(MID.attach, A, false);
    if (ab !== null && ap !== null && ap > ab && b.core_dn > 20) {
      const per = A.i_loans_as > 0 ? A.i_prem_as / A.i_loans_as : 0;
      const loans = b.core_dn * (ap - ab), gain = (loans * per) / 2;
      out.push({ lens: "Product development", title: "Attach insurance to more loans", val: gain, unit: "/month",
        text: `${(ab * 100).toFixed(0)}% of its new loans carry insurance; ${P.name} manage ${(ap * 100).toFixed(0)}%. Closing the gap is ~${f0(loans / 2)} more insured loans and ${cr(gain)} of premium a month.` });
    }
    // 3 · product white space
    const sb = shares(b, "sf_da_", CORE, b.core_da), sp = shares(A, "sf_da_", CORE, A.core_da);
    for (const f of CORE) {
      if (sp[f] >= 0.08 && sb[f] < sp[f] * 0.4 && b.core_da > 0.5) {
        const gain = (b.core_da * (sp[f] - sb[f])) / 2;
        out.push({ lens: sb[f] < 0.005 ? "Diversification" : "Product development", title: `${sb[f] < 0.005 ? "Launch" : "Scale up"} ${FAM[f].toLowerCase()}`, val: gain, unit: "/month",
          text: `${FAM[f]} is ${(sp[f] * 100).toFixed(0)}% of what ${P.name} disburse but ${(sb[f] * 100).toFixed(sb[f] < 0.1 ? 1 : 0)}% here. At their mix, that is about ${cr(gain)} a month of extra lending.` });
      }
    }
    // 4 · channel white space (logins)
    const cbs = shares(b, "sch_la_", CHANNELS), cps = shares(A, "sch_la_", CHANNELS);
    for (const c of ["Connector", "Self", "Digital", "CSC", "Direct sales", "Cross-sell"]) {
      if (cps[c] >= 0.06 && cbs[c] < cps[c] * 0.4 && b.core_la > 2) {
        const gain = (b.core_da * (cps[c] - cbs[c])) / 2;
        out.push({ lens: "Market development", title: `Open the ${c === "Self" ? "walk-in / self" : c.toLowerCase()} channel`, val: gain, unit: "/month",
          text: `${c} brings ${(cps[c] * 100).toFixed(0)}% of logins for ${P.name}, only ${(cbs[c] * 100).toFixed(0)}% here. If it added that share on top of today's business, that is roughly ${cr(gain)} a month, and less reliance on one channel.` });
      }
    }
    // 5 · approval / sourcing quality
    const apb = value(MID.appr, b, false), app = value(MID.appr, A, false);
    if (apb !== null && app !== null && app - apb > 0.04) {
      const extra = (b.c_dec / 13) * (app - apb), tk = b.c_san > 0 ? b.c_sa / b.c_san : 0;
      out.push({ lens: "Market penetration", title: "Source cleaner files", val: extra * tk, unit: "/month",
        text: `${(apb * 100).toFixed(0)}% of its applications are approved vs ${(app * 100).toFixed(0)}% for ${P.name}. At its volume, that gap is ~${f0(extra)} sanctions (${cr(extra * tk)}) a month lost to rejections.` });
    }
    // 6 · stars to double down on
    for (const x of bcg(b).filter(x => x.q === "Star")) {
      out.push({ lens: "Market penetration", title: `Double down on ${x.name.toLowerCase()}`, val: x.sa / 13, unit: "/month now",
        text: `It already out-sanctions every other ${b.state} branch in ${x.name.toLowerCase()} and is growing ${x.gRaw >= 0 ? "+" : ""}${(x.gRaw * 100).toFixed(0)}% quarter on quarter (network ${x.gm >= 0 ? "+" : ""}${(x.gm * 100).toFixed(0)}%). Protect DSA capacity and TAT here.` });
    }
    return out.sort((a, c) => c.val - a.val);
  }

  function threats(b, P) {
    const A = P.agg, out = [];
    const bj = b.r_du_07 >= 40 ? b.r_bn_07 / b.r_du_07 : null, bs = b.r_du_09 >= 60 ? b.r_bn_09 / b.r_du_09 : null;
    const nj = NAT.r_bn_07 / NAT.r_du_07, ns = NAT.r_bn_09 / NAT.r_du_09;
    if (bj !== null && bs !== null && bs - bj > (ns - nj) + 0.01)
      out.push({ sev: (bs - bj) * 100, title: "Early delinquency is climbing", text: `EMI bounce on its new loans went ${(bj * 100).toFixed(1)}% → ${(bs * 100).toFixed(1)}% from July to September, faster than the network (${(nj * 100).toFixed(1)}% → ${(ns * 100).toFixed(1)}%).` });
    if (b.pct.mb1 !== null && b.pct.mb1 <= 30)
      out.push({ sev: 30 - b.pct.mb1 + 5, title: "Stressed local market", text: `In ${b.mk_name}, ${(b.v.mb1 * 100).toFixed(0)}% of B1 accounts bounced in September (network ${(MID.mb1.prior * 100).toFixed(0)}%). New loans here start in a tougher repayment climate.` });
    if (b.pct.mnpa !== null && b.pct.mnpa <= 25)
      out.push({ sev: 25 - b.pct.mnpa + 4, title: "High NPA neighbourhood", text: `${(b.v.mnpa * 100).toFixed(1)}% of the local book (${b.mk_name}) is NPA, among the worst ${Math.round(b.pct.mnpa)}% of markets.` });
    const cs = shares(b, "sch_la_", CHANNELS), top = Object.entries(cs).sort((a, c) => c[1] - a[1])[0];
    if (top && top[1] >= 0.7 && b.core_la > 1)
      out.push({ sev: (top[1] - 0.6) * 60, title: `Hostage to one channel`, text: `${(top[1] * 100).toFixed(0)}% of logins come through ${top[0] === "Self" ? "walk-ins" : top[0]}. Losing a few large partners would hit volume directly.` });
    const ps = shares(b, "sf_da_", CORE, b.core_da), tp = Object.entries(ps).sort((a, c) => c[1] - a[1])[0];
    if (tp && tp[1] >= 0.6 && b.core_da > 0.5)
      out.push({ sev: (tp[1] - 0.5) * 40, title: "One-product branch", text: `${FAM[tp[0]]} is ${(tp[1] * 100).toFixed(0)}% of its core disbursal, so a slowdown or policy change in that product would hit the whole branch.` });
    const mb = b.v.mom, mp = A.san_prev > 0 ? A.san_now / A.san_prev - 1 : null;
    if (mb !== null && mb < -0.12)
      out.push({ sev: -mb * 40, title: "Sanctions are shrinking", text: `Sanctioned ₹ fell ${(Math.abs(mb) * 100).toFixed(0)}% in Jul–Sep vs Apr–Jun${mp !== null ? `, while ${P.name} moved ${mp >= 0 ? "+" : "−"}${Math.abs(mp * 100).toFixed(0)}%` : ""}.` });
    else if (mb !== null && mp !== null && mp - mb > 0.15)
      out.push({ sev: (mp - mb) * 30, title: "Peers are pulling away", text: `${P.name} grew sanctions ${(mp * 100).toFixed(0)}% quarter on quarter; this branch ${mb >= 0 ? "+" : "−"}${Math.abs(mb * 100).toFixed(0)}%. Share is being lost locally.` });
    const ub = b.r_aum_09 > 0.3 ? 1 - b.r_saum_09 / b.r_aum_09 : null, up = A.r_aum_09 > 0 ? 1 - A.r_saum_09 / A.r_aum_09 : null;
    if (ub !== null && up !== null && ub - up > 0.2 && b.pct.dpd !== null && b.pct.dpd < 50)
      out.push({ sev: (ub - up) * 20, title: "Unsecured-heavy new book", text: `${(ub * 100).toFixed(0)}% of its new book is unsecured (peers ${(up * 100).toFixed(0)}%), and its DPD is already worse than average. Unsecured losses arrive faster.` });
    return out.sort((a, c) => c.sev - a.sev);
  }

  function swot(b, P) {
    const internal = M.filter(m => m.p !== "market" && b.pct[m.id] !== null);
    const pv = m => peerValue(m, P);
    const better = m => { const v = pv(m); return v === null || (b.v[m.id] - v) * m.dir > 0; };
    const S = internal.filter(m => b.pct[m.id] >= 70 && better(m)).sort((x, y) => b.pct[y.id] - b.pct[x.id]).slice(0, 4);
    const W = internal.filter(m => b.pct[m.id] <= 30 && !better(m)).sort((x, y) => b.pct[x.id] - b.pct[y.id]).slice(0, 4);
    const line = m => ({ m, title: m.label, text: `${fmt(m, b.v[m.id])} vs ${fmt(m, pv(m))} for ${P.name}`, pct: b.pct[m.id] });
    return { S: S.map(line), W: W.map(line), O: opportunities(b, P).slice(0, 4), T: threats(b, P).slice(0, 4) };
  }

  function ansoff(b, P) {
    const ops = opportunities(b, P), q = {};
    for (const k of ["Market penetration", "Product development", "Market development", "Diversification"]) q[k] = ops.filter(o => o.lens === k).slice(0, 2);
    // diversification: products nobody in the branch sells but the state market does — always show something
    if (!q["Diversification"].length) {
      const sb = shares(b, "sf_da_", CORE, b.core_da), sp = shares(P.agg, "sf_da_", CORE, P.agg.core_da);
      const cand = CORE.filter(f => sb[f] < 0.01 && sp[f] > 0.01).sort((x, y) => sp[y] - sp[x])[0];
      if (cand) q["Diversification"].push({ lens: "Diversification", title: `Pilot ${FAM[cand].toLowerCase()}`, val: (b.core_da * sp[cand]) / 2, unit: "/month",
        text: `Not sold here today; ${(sp[cand] * 100).toFixed(1)}% of peer lending. A small pilot with a new sourcing partner tests demand at low risk.` });
    }
    return q;
  }


  // ------------------------------------------------------------------ what-if: re-score a branch with some metrics overridden
  const COMP = ranked.map(b => b.composite);   // descending
  function simulate(b, over) {
    const pct = { ...b.pct }, pill = {};
    for (const k in over) if (MID[k] && over[k] !== null && over[k] !== undefined) pct[k] = pctOf(MID[k], over[k]);
    for (const P of PILLARS) { const ps = M.filter(m => m.p === P.id).map(m => pct[m.id]).filter(x => x !== null); pill[P.id] = ps.length ? sum(ps) / ps.length : null; }
    const ws = PILLARS.filter(P => P.w && pill[P.id] !== null);
    const composite = ws.length ? sum(ws, P => P.w * pill[P.id]) / sum(ws, P => P.w) : null;
    if (composite === null) return { pct, pill, composite, rank: null, health: null, band: band(null) };
    let above = 0; for (const c of COMP) if (c > composite) above++; else break;
    const selfAbove = b.composite !== null && b.composite > composite ? 1 : 0;   // don't race against your old self
    const rank = above - selfAbove + 1, health = NRANK > 1 ? (100 * (NRANK - rank)) / (NRANK - 1) : 50;
    return { pct, pill, composite, rank, health, band: band(health) };
  }
  // ₹ / volume consequence of moving one metric from `from` to `to` (rates as fractions)
  const LEVERS = [
    { id: "conv", unit: "cr", what: "more disbursal a month", f: (b, d) => d * (b.core_la || 0) / 2 },
    { id: "appr", unit: "cr", what: "more sanctioned a month", f: (b, d) => d * ((b.c_dec || 0) / 13) * (b.c_san > 0 ? b.c_sa / b.c_san : NAT.c_sa / NAT.c_san) },
    { id: "pull", unit: "cr", what: "more sanctions booked a month", f: (b, d) => d * (b.c_sa || 0) / 13 },
    { id: "attach", unit: "cr", what: "more premium a month", f: (b, d) => d * ((b.core_dn || 0) / 2) * (NAT.i_loans_as > 0 ? NAT.i_prem_as / NAT.i_loans_as : 0) },
    { id: "ftr", unit: "n", what: "more dockets right first time", f: (b, d) => d * (b.o_loans || 0) },
    { id: "tat", unit: "n", what: "more loans numbered within 3 days", f: (b, d) => d * (b.o_tatn || 0) },
    { id: "bounce", unit: "n", what: "fewer bounced EMIs a month", f: (b, d) => -d * (b.r_du_09 || 0) },
    { id: "dpd", unit: "crb", what: "of book moved out of DPD", f: (b, d) => -d * (b.r_aum_09 || 0) },
  ];

  // ------------------------------------------------------------------ twins: branches that look alike on size, mix and market
  const TW_F = [
    { id: "size", name: "Size", w: 1.4, f: b => Math.log10(Math.max(0.05, b.core_da || 0)) },
    ...CORE.map(f => ({ id: "mix_" + f, name: FAM_SHORT[f] + " share", grp: "mix", w: 0.55, f: b => (b.core_da > 0 ? (b["sf_da_" + f] || 0) / b.core_da : 0) })),
    { id: "mkt", name: "Local market", w: 0.8, f: b => (b.attract === null ? 50 : b.attract) },
    { id: "mb1", name: "Local bounce", w: 0.5, f: b => (b.pct.mb1 === null ? 50 : b.pct.mb1) },
  ];
  const TW_SD = {};
  for (const t of TW_F) { const v = E.map(t.f), mu = sum(v) / v.length; TW_SD[t.id] = Math.sqrt(sum(v, x => (x - mu) ** 2) / v.length) || 1; }
  function twinDist(a, b) {
    const parts = {}; let d = 0;
    for (const t of TW_F) { const z = (t.f(a) - t.f(b)) / TW_SD[t.id], c = t.w * z * z; d += c; const g = t.grp || t.id; parts[g] = (parts[g] || 0) + c; }
    return { d: Math.sqrt(d), parts };
  }
  function twins(b, n = 40) {
    const all = E.filter(x => x.id !== b.id && x.health !== null).map(x => ({ x, ...twinDist(b, x) })).sort((p, q) => p.d - q.d);
    const d90 = all[Math.floor(all.length * 0.9)].d || 1;
    for (const t of all) { t.sim = Math.max(0, 100 * (1 - t.d / d90)); for (const k in t.parts) t.parts[k] = Math.max(0, 100 * (1 - Math.sqrt(t.parts[k]) / (d90 * 0.6))); }
    const near = all.slice(0, n);
    const better = near.filter(t => t.x.health >= (b.health || 0) + 8).sort((p, q) => (q.sim + 0.6 * q.x.health) - (p.sim + 0.6 * p.x.health));
    return { near, better };
  }
  // the metrics that explain most of the health gap to another branch (weighted percentile gap)
  function gapDrivers(b, t) {
    const wsum = sum(PILLARS.filter(P => P.w), P => P.w);
    return M.filter(m => m.p !== "market" && b.pct[m.id] !== null && t.pct[m.id] !== null).map(m => {
      const P = PILLARS.find(x => x.id === m.p), n = M.filter(z => z.p === m.p).length;
      return { m, gap: t.pct[m.id] - b.pct[m.id], pts: ((t.pct[m.id] - b.pct[m.id]) * P.w) / wsum / n };
    }).sort((p, q) => q.pts - p.pts);
  }

  // ------------------------------------------------------------------ verdict
  function verdict(b, P) {
    const pill = PILLARS.filter(x => x.w && b.pill[x.id] !== null).sort((x, y) => b.pill[y.id] - b.pill[x.id]);
    const best = pill[0], worst = pill[pill.length - 1];
    const ge = geCell(b);
    return { best, worst, ge, text: `${b.band.name} branch, ${ordinal(b.rank || 0)} of ${NRANK}. Strongest on ${best ? best.name.toLowerCase() : "–"}, weakest on ${worst ? worst.name.toLowerCase() : "–"}. Verdict: ${ge.verdict.toLowerCase()}.` };
  }

  G.OVM = { OV, B, E, byId, M, MID, PILLARS, FAM, FAM_SHORT, CORE, CHANNELS, FULL, NAT, NRANK, CUT, PEER_MODES,
    agg, value, pctOf, peerValue, quantile, peers, rankIn, fmt, cr, ordinal, topPct, bcg, geCell, swot, opportunities, threats, ansoff, verdict,
    shares, rate, title, band, STATE_G, NAT_G, NAT_FG, market, MKM, simulate, LEVERS, twins, twinDist, gapDrivers, TW_F, DIST, ranked };
})(typeof window !== "undefined" ? window : globalThis);
