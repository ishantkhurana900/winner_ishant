#!/usr/bin/env python3
"""Rebuild data.js from the six CSVs in Data/ with one command.

    python3 pipeline/rebuild_all.py           # reuse cached work in .work/ where it exists
    python3 pipeline/rebuild_all.py --fresh   # wipe .work/ first (use this whenever the CSVs change)

It runs build.py's steps in order (split → sales credit ops ins risk coll → assemble), repeating the
middle step until no piece is left 'pending', then checks that data.js was written.
"""
import os, re, shutil, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
BUILD = os.path.join(HERE, "build.py")
NEED = ["Sales", "Credit", "Operations", "Insurance", "Risk", "Collections"]


def step(*args):
    print(f"\n$ python {os.path.relpath(BUILD, ROOT)} {' '.join(args)}", flush=True)
    p = subprocess.run([sys.executable, BUILD, *args], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    print(p.stdout, end="", flush=True)
    if p.returncode != 0:
        sys.exit(f"\nStep '{' '.join(args)}' failed (exit {p.returncode}). See the error above.")
    return p.stdout


def main():
    missing = [f"Data/{n}_data_new.csv" for n in NEED if not os.path.exists(os.path.join(ROOT, "Data", f"{n}_data_new.csv"))]
    if missing:
        sys.exit("Missing input files:\n  " + "\n  ".join(missing) + "\nPut the six CSVs in the Data/ folder (exact names) and run again.")
    if "--fresh" in sys.argv and os.path.isdir(os.path.join(ROOT, ".work")):
        print("Removing old .work/ cache…")
        shutil.rmtree(os.path.join(ROOT, ".work"))
    t0 = time.time()
    step("split")
    for rnd in range(1, 200):
        out = step("sales", "credit", "ops", "ins", "risk", "coll")
        if not re.search(r"\b[1-9]\d* pending", out):
            break
        print(f"(round {rnd}: pieces still pending, continuing…)")
    step("assemble")
    js = os.path.join(ROOT, "data.js")
    if not os.path.exists(js) or os.path.getmtime(js) < t0:
        sys.exit("data.js was not written — check the output above.")
    print(f"\nDone in {time.time() - t0:.0f}s · data.js is {os.path.getsize(js) / 1e6:.1f} MB. Start the app with:  python3 ai_server.py")


if __name__ == "__main__":
    main()
