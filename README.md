# One Vision — Branch 360 Dashboard

A branch-level consulting dashboard for a lending network. It joins six datasets (Sales, Credit,
Operations, Insurance, Risk and Collections) at branch level and gives every branch one honest
scorecard: a health score, balanced scorecard, SWOT, BCG, GE–McKinsey nine-box, Ansoff, strategy
canvas, Pareto analysis, momentum, peer benchmarks, a what-if lab and a consultant's memo.
Every chart can be filtered.

It is a plain HTML/JavaScript site plus a small Python server. **No database, no Node, no build tools.**
Python is the only thing you need to install.

---

## Contents

1. [Quick start (new laptop)](#1-quick-start-new-laptop)
2. [Detailed setup, step by step](#2-detailed-setup-step-by-step)
3. [Optional: turn on the AI features](#3-optional-turn-on-the-ai-features)
4. [Using the dashboard](#4-using-the-dashboard)
5. [Filters](#5-filters)
6. [Updating the data](#6-updating-the-data)
7. [Project structure](#7-project-structure)
8. [How it works](#8-how-it-works)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Quick start (new laptop)

You need **Python 3.9 or newer** and the **six CSV files**.

**macOS / Linux** (Terminal, inside the project folder):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 pipeline/rebuild_all.py --fresh
python3 ai_server.py
```

**Windows** (Command Prompt or PowerShell, inside the project folder):

```bat
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python pipeline\rebuild_all.py --fresh
python ai_server.py
```

Then open **http://localhost:8788** in your browser.
Before running the rebuild, put the six CSVs in the `Data/` folder ([details below](#step-3--put-the-data-files-in-data)).

---

## 2. Detailed setup, step by step

### Step 1 — Get the code onto the laptop

**Option A: ZIP (no Git needed)**
1. Open https://github.com/ishantkhurana900/winner_ishant
2. Click the green **Code** button → **Download ZIP**.
3. Unzip it anywhere, e.g. `Documents/winner_ishant`.
   (GitHub names the folder `winner_ishant-main`. You can rename it.)

**Option B: Git**

```bash
git clone https://github.com/ishantkhurana900/winner_ishant.git
cd winner_ishant
```

### Step 2 — Install Python (only if it is not there)

Check first:

```bash
python3 --version     # macOS / Linux
py --version          # Windows
```

You need 3.9 or newer. If it is missing:
- **Windows:** install from https://www.python.org/downloads/ and **tick "Add python.exe to PATH"** in the installer.
- **macOS:** install from https://www.python.org/downloads/ or run `brew install python`.

### Step 3 — Put the data files in `Data/`

Copy the six CSVs into the `Data/` folder of the project. The names must match exactly:

```
Data/
├── Sales_data_new.csv
├── Credit_data_new.csv
├── Operations_data_new.csv
├── Insurance_data_new.csv
├── Risk_data_new.csv
└── Collections_data_new.csv
```

The CSVs are **not** in the GitHub repository on purpose: they are large (Risk alone is over 100 MB,
GitHub's limit) and they are business data. `Data/README.md` describes what each file holds.

The pipeline expects the same column names as the contest files. Extra columns are ignored.
Blank padding rows (common in Excel exports) are skipped.

### Step 4 — Open a terminal in the project folder

- **Windows:** open the folder in File Explorer, click the address bar, type `cmd` and press Enter.
- **macOS:** right-click the folder → **New Terminal at Folder**, or run `cd` followed by a space,
  drag the folder into Terminal and press Enter.

### Step 5 — Create a virtual environment and install the two libraries

The pipeline needs **pandas** and **numpy**. A virtual environment keeps them separate from the rest of the laptop.

macOS / Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Windows:

```bat
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

You will see `(.venv)` at the start of the prompt. Whenever you open a new terminal later,
run the `activate` line again before using the pipeline.

> On an office laptop without internet for pip, ask IT to install `pandas` and `numpy`.
> Then skip the venv and run the commands below with the system Python.

### Step 6 — Build the dashboard data (`data.js`)

```bash
python3 pipeline/rebuild_all.py --fresh        # Windows: python pipeline\rebuild_all.py --fresh
```

This reads the six CSVs and writes **`data.js`**, the single file the dashboard loads.
It prints progress for each dataset and finishes with something like:

```
Done in 95s · data.js is 1.3 MB. Start the app with:  python3 ai_server.py
```

It takes a few minutes on the full data. If it stops with an error, the message names the step
and the missing column or file (see [Troubleshooting](#9-troubleshooting)).

### Step 7 — Start the dashboard

```bash
python3 ai_server.py                           # Windows: python ai_server.py
```

You should see:

```
One Vision on http://localhost:8788  ·  AI: OFF (no AI_API_KEY in .env)
```

Open **http://localhost:8788** in Chrome, Edge or Safari. Leave the terminal open while you use it;
press **Ctrl + C** in the terminal to stop the server.

Other options:

```bash
python3 ai_server.py --port 9000    # use another port if 8788 is taken
python3 ai_server.py --mock         # scripted AI replies, to demo the AI screens without a key
```

> You can also just double-click `index.html` once `data.js` exists. Everything works except the AI memo,
> which needs the server.

### Next time

Only Step 7 is needed: open a terminal in the folder and run `python3 ai_server.py`.
Rebuild (Step 6) only when the CSVs change.

---

## 3. Optional: turn on the AI features

The **Consultant memo** and **Ask One Vision** can use an AI model. Without a key the rest of the
dashboard works normally.

1. Copy `.env.example` to a new file named `.env` in the project folder.
2. Fill in `AI_API_KEY`. Change `AI_BASE_URL` and `AI_MODEL` if you are not using OpenAI.
   Any provider with an OpenAI-compatible endpoint works; the file lists Gemini, Groq and OpenRouter examples.
3. Restart `python3 ai_server.py`. The start line now shows the model instead of `AI: OFF`.

The key stays on the server and is never sent to the browser. `.env` is in `.gitignore`, so it is never committed.

---

## 4. Using the dashboard

The left rail has two groups.

**Network**
- **Network home:** the whole network at a glance. KPIs, disbursal by zone, an India hex map, the
  healthiest / fastest-growing / weakest branches, and a states heat table. It has a **Filter the network** bar.
- **Choose a branch:** filter by zone and state, sort by health or disbursal, search by name, and see the
  branches on the map.
- **Compare two:** two branches side by side (summary, business, service, risk, strategy, memo).
- **Opportunity map:** the rupee upside if each branch matched its state peers.
- **Ask One Vision:** type a question such as "UP branches with high bounce but good approval" and get a
  map and a list back.

**Branch 360** (after you pick a branch)
Overview · Scorecard · Sales & sourcing · Credit decisions · Operations · Insurance · Portfolio risk ·
Local market · Strategy lenses · Peer benchmark · Twin finder · What-if lab · Consultant memo.

Useful controls:
- **Compare with** (top bar): State, Zone, Similar size or All India. This sets the peer group behind
  every "vs peers" number.
- **ⓘ** buttons explain how a score is calculated; **⤢** expands a chart to full screen.
- **Presentation** (top right): dark mode for projecting.
- **Print / save PDF** on the last section prints a branch report.
- Hover over (or tap) any chart mark for exact values.

---

## 5. Filters

**Network filter (home page).** Filter by **zone**, **state**, **health band** (leaders, steady,
lagging) and **product** (housing, LAP, personal loan, business loan, used-car loan, micro). The KPIs,
zone bar, India map, leaderboards, opportunity total and state heat table all follow it, and the
heading says what is selected. Insurance can't be split by product in the data, so that KPI stays at
all products and says so.

**Chart filters (funnel button in a chart's header).** What you get depends on the chart:

| Chart type | Filter options |
|---|---|
| Month-by-month bars, lines, product-mix stream, sanctions clock | From / to month range, **Last 3**, **Last 6**, **All**; show or hide series |
| Category bars, donuts | Tick boxes for each category or slice |
| 100% stacked bars | Show or hide rows and segments (shares re-base to what you keep) |
| Branch vs peers dumbbells | Show or hide rows; order by highest, lowest or biggest gap |
| Rejection / query reasons (Pareto) | Tick boxes per reason; show Top 3 / 5 / 8 |
| Heat tables (states, peers) | Show or hide rows; sort by any column; Top 5 / 10 / 15 |
| Nightingale rose, pillar violins | Show or hide pillars; violins can be drawn from all branches, the zone, the state or the peer group |
| Waterfalls | Show or hide individual steps |

A number on the funnel shows how many filters are on, and **Reset** clears them. Filters stay while you
move between branches and clear when the page is reloaded.

---

## 6. Updating the data

When you get new CSVs:

1. Replace the files in `Data/` (same names).
2. Run `python3 pipeline/rebuild_all.py --fresh`. **`--fresh` matters:** it clears the `.work/` cache,
   which would otherwise reuse pieces from the old files.
3. Refresh the browser. There's no need to restart the server.

The data windows shown in the app (for example "Sales Aug–Sep 2026") come from the pipeline. If the new files
cover different months, the labels in `pipeline/build.py` (`meta.windows`) and some text in `app.js` may need
updating too.

**Advanced: run the pipeline steps by hand.** `rebuild_all.py` runs these for you:

```bash
python3 pipeline/build.py split                                   # cut the 3 big CSVs into pieces (.work/split)
python3 pipeline/build.py sales credit ops ins risk coll          # repeat until no "pending" is printed
python3 pipeline/build.py assemble                                # write data.js
```

---

## 7. Project structure

```
winner_ishant/
├── index.html            Page shell: sidebar, top bar, loads the scripts below
├── app.js                All views and charts (D3), routing, chart filters
├── model.js              Metrics, percentiles, health score, peers, SWOT/BCG/GE logic
├── style.css             Styles (light + presentation/dark mode)
├── data.js               GENERATED by the pipeline (not in Git) — one record per branch
├── ai_server.py          Local web server + optional AI relay (standard library only)
├── requirements.txt      pandas + numpy, for the pipeline
├── .env.example          Template for the optional AI key
├── logo.svg, brand/      Logo files
├── pipeline/
│   ├── rebuild_all.py    One-command rebuild: CSVs → data.js
│   ├── build.py          The pipeline steps (sales, credit, ops, ins, risk, coll, assemble)
│   ├── chunks.py         Piece-by-piece processing for the big CSVs
│   └── geo.json          District coordinates used to place branches on the map
└── Data/
    └── README.md         Which CSVs go here (the CSVs themselves are not in Git)
```

Generated or local-only (ignored by Git): `data.js`, `.work/` (pipeline cache), `.env`, `.venv/`, `Data/*.csv`.

---

## 8. How it works

1. **Pipeline (Python, pandas).** Each CSV is reduced to additive sums per branch: amounts, counts and
   per-month, per-product and per-channel splits. Collections has no branch column, so it becomes a
   district/state "local market" table. Branch names are matched across files after normalising
   spelling. The output is `data.js` (`window.OV = {...}`).
2. **Model (`model.js`, in the browser).** Rolls branches up into any peer group, computes rates
   (shrunk toward the national rate so tiny branches can't top a table on luck), converts each metric to a
   percentile, blends five weighted pillars (growth, credit, operations, cross-sell, risk) into a health
   score, and derives SWOT, BCG, GE–McKinsey, Ansoff and sized opportunities.
3. **Views (`app.js`, D3 v7 from a CDN).** Every page and chart, plus the filters.
4. **Server (`ai_server.py`).** Serves the folder on `localhost:8788` and blocks `Data/`, `pipeline/` and dot
   files. It forwards AI requests to your provider using the key in `.env`.

The page loads D3 and a Google font from the internet. On a fully offline laptop the charts will not
draw (see Troubleshooting).

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `python3: command not found` (Windows) | Use `py` or `python` instead of `python3`, or reinstall Python with "Add to PATH" ticked. |
| `No module named 'pandas'` | Activate the venv (`source .venv/bin/activate` or `.venv\Scripts\activate`), then `pip install -r requirements.txt`. |
| `Missing input files: Data/...` | A CSV is missing or misnamed. Names are case-sensitive: `Risk_data_new.csv`, not `risk_data.csv`. |
| `KeyError: 'SOME_COLUMN'` during rebuild | The CSV is missing a column the pipeline uses. Check the header row matches the contest file. |
| Rebuild seems to use old numbers | Run with `--fresh` to clear the `.work/` cache. |
| Rebuild runs out of memory | Close other programs. The big files are processed in pieces, but Credit and Insurance are read whole. |
| Page is blank or says it can't find data | `data.js` doesn't exist yet: run Step 6. Then hard-refresh with Ctrl+Shift+R (Cmd+Shift+R on Mac). |
| Charts don't draw, page has no styling | The laptop can't reach `cdn.jsdelivr.net` (D3) — needs internet, or ask IT to allow it. |
| `Address already in use` | Something else uses port 8788: `python3 ai_server.py --port 9000` and open http://localhost:9000. |
| AI memo says not configured | No `.env` key. See [section 3](#3-optional-turn-on-the-ai-features), or run with `--mock` for a demo. |
| PowerShell blocks `activate` | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use Command Prompt instead. |
