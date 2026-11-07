# Data folder

Put the six source CSV files here, with exactly these names:

| File | What it holds |
|---|---|
| `Sales_data_new.csv` | Logins, sanctions, disbursals by branch, product and channel (Aug–Sep 2026) |
| `Credit_data_new.csv` | Credit decisions: approvals, rejections and reasons (Oct 2025 – Oct 2026) |
| `Operations_data_new.csv` | Docket first-time-right, queries, e-NACH / e-sign, PDD and OTC (HL & MSME) |
| `Insurance_data_new.csv` | Insurance policies and premium on disbursed loans |
| `Risk_data_new.csv` | Portfolio snapshots: AUM, bounce, DPD buckets, CIBIL mix |
| `Collections_data_new.csv` | Collections buckets by district (used for the "local market" view) |

The CSVs are not stored in Git (see `.gitignore`). After copying them in, run
`python3 pipeline/rebuild_all.py --fresh` from the project folder to build `data.js`.
