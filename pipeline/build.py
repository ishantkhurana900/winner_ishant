#!/usr/bin/env python3
"""One Vision — branch-level pipeline.

Turns the six *_new.csv files into one record per branch (additive sums, so the browser can
roll any peer group up and compute ratios itself) plus a district/state 'local market' table
from Collections (which has no branch column).

Each part caches to .work/; big files are processed piece-by-piece (see chunks.py) so every
call stays short.  Usage:
    python3 pipeline/build.py split            # once: split big CSVs into pieces
    python3 pipeline/build.py sales credit ops ins risk coll   # repeat until no 'pending'
    python3 pipeline/build.py assemble         # -> data.js
"""
import sys, os, re, json, time, subprocess
import numpy as np, pandas as pd
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chunks import ROOT, SPLIT, OUTD, pieces, read_piece, run, gather

D = os.path.join(ROOT, "Data"); W = os.path.join(ROOT, ".work"); OUT = os.path.join(ROOT, "data.js")
FAMS = ["HOU", "LAP", "PL", "BL", "UCL", "MIC", "GS", "EF", "OTH"]

# ------------------------------------------------------------------ shared helpers (same mappings as App 1)
def key(s):
    return s.astype(str).str.upper().str.replace(r"[\s\-_/&.,]+", " ", regex=True).str.strip()
BAD = {"", "NAN", "NA", "DNA", "HO", "NONE", "OTHERS"}
def num(s): return pd.to_numeric(s, errors="coerce").fillna(0.0)

def zone(z):
    z = (str(z) if z is not None else "").strip()
    if z in ("North", "North 1", "North 2", "North & East"): return "North"
    if z in ("South", "South 1", "South 2"): return "South"
    if z in ("West", "Maharashtra", "Central"): return "West"
    if z == "East": return "East"
    return "Other"

def fam_fin(ft):
    ft = str(ft)
    if ft in ("AF", "BH", "MA", "MA_GOLD", "HLSA"): return "HOU"
    if ft in ("SBL", "LAP", "MLAP", "LAP_PLUS") or "LAP+" in ft or "LAP_PLUS" in ft: return "LAP"
    if ft in ("PL", "PLES", "ZMPL"): return "PL"
    if ft.startswith("UBL"): return "BL"
    if ft.startswith("UCL") or ft == "SCUCL": return "UCL"
    if ft in ("NOCPL", "KMFPL", "SUBKI"): return "MIC"
    if ft in ("MFSA", "LADSSA"): return "GS"
    if ft in ("ESBNPL1", "ESBNPL2", "BNPLCV", "ESCHL", "ZMCD"): return "EF"
    return "OTH"
CAT_FAM = {"HL": "HOU", "MSME": "LAP", "PL": "PL", "UBL": "BL", "UCL": "UCL", "EF": "EF",
           "SHAKTI": "MIC", "MFI": "MIC", "GL": "GS", "LAS": "GS"}
CRED_FAM = {"AF": "HOU", "BH": "HOU", "MA": "HOU", "SBL": "LAP", "LAP": "LAP", "MLAP": "LAP",
            "PL": "PL", "UBL": "BL", "UBL_Plus": "BL", "UCL": "UCL"}
CHANNELS = ["DSA", "Connector", "CSC", "Self", "Direct sales", "Dealer", "Digital", "Cross-sell", "Other"]
def channel(s):
    u = re.sub(r"[\s\-]+", "_", str(s).strip().upper()) if isinstance(s, str) else ""
    if u == "DSA": return "DSA"
    if u == "CONNECTOR": return "Connector"
    if u == "CSC": return "CSC"
    if u == "SELF": return "Self"
    if u == "DIRECT_BY_SALES_TEAM": return "Direct sales"
    if u == "DEALER": return "Dealer"
    if u in ("DIGITAL_DSA", "WEBSITE", "DIGITALLY_SOURCED", "S2S", "EXTERNAL_LEAD_AGGREGATOR", "MEDIA"): return "Digital"
    if "XSELL" in u or "X_SELL" in u or u in ("UBL_PARALLEL_LOAN", "UBL_ADDITIONAL_LOAN", "CIBIL_WATCH", "PFSS_PRE_APPROVED"): return "Cross-sell"
    return "Other"

REJ_GROUP = [
    ("Score cut-off", ["ventile", "scorecard", "early risk decision"]),
    ("System hard-stop", ["hardstop", "early gating", "auto rejected", "saral"]),
    ("Income & eligibility", ["financial", "eligibility", "income inconsistent", "banking"]),
    ("Policy norms", ["policy norms", "vulnerable", "collateral"]),
    ("Bureau record", ["bureau", "cibil"]),
    ("Fraud & verification", ["fraud", "verification", "hunter", "dedupe", "fi/fcu", "incorrect data"]),
    ("Personal discussion", ["pd reject"]),
    ("Customer dropped out", ["not interested", "cancelled"]),
]
REJS = [g for g, _ in REJ_GROUP] + ["Other"]
def rej_group(r):
    r = str(r).lower()
    for g, keys in REJ_GROUP:
        if any(k in r for k in keys): return g
    return "Other"

def wide(df, idx, col, val, prefix, cats=None):
    """long -> wide sums: one column per category, named prefix+category."""
    p = df.pivot_table(index=idx, columns=col, values=val, aggfunc="sum", fill_value=0.0, observed=True)
    if cats is not None: p = p.reindex(columns=cats, fill_value=0.0)
    p.columns = [f"{prefix}{c}" for c in p.columns]
    return p

def save(name, df): df.to_pickle(os.path.join(W, f"b_{name}.pkl")); print(f"  saved {name}: {df.shape}", flush=True)
def load(name): return pd.read_pickle(os.path.join(W, f"b_{name}.pkl"))

# ================================================================== split (once)
def part_split():
    os.makedirs(SPLIT, exist_ok=True)
    for f in ["Risk", "Collections", "Sales"]:
        if pieces(f): print(f, "already split"); continue
        src = os.path.join(D, f"{f}_data_new.csv")
        # header line kept apart, body cut into 120,000-line pieces Risk_000, Risk_001 … (pure Python: works on Windows too)
        with open(src, "rb") as fh:
            with open(os.path.join(SPLIT, f + ".header"), "wb") as h: h.write(fh.readline())
            n, out = 0, None
            for i, line in enumerate(fh):
                if i % 120000 == 0:
                    if out: out.close()
                    out = open(os.path.join(SPLIT, f"{f}_{n:03d}"), "wb"); n += 1
                out.write(line)
            if out: out.close()
        print(f, len(pieces(f)), "pieces")

# ================================================================== SALES (Aug–Sep 2026)
SCOLS = ["MONTH", "FIN_TYPE", "BRANCH", "LEAD_SOURCE", "ZONE", "LOGIN_AMOUNT", "LOGIN_COUNT", "DECISION_COUNT",
         "SANCTIONED_AMOUNT", "SANCTION_COUNT", "DISB_AMOUNT", "DISB_COUNT", "LI_AMOUNT", "GI_AMOUNT", "PF_AMOUNT"]
def sales_piece(p):
    s = read_piece("Sales", p, SCOLS)
    for c in SCOLS[5:]: s[c] = num(s[c])
    s["k"] = key(s.BRANCH)
    s = s[~s.k.isin(BAD) & pd.to_numeric(s.MONTH, errors="coerce").notna()].copy()   # skip blank / padding rows
    s["m"] = pd.to_numeric(s.MONTH).astype(int)
    s["f"] = s.FIN_TYPE.map(fam_fin); s["ch"] = s.LEAD_SOURCE.map(channel); s["z"] = s.ZONE.map(zone)
    s["la"] = s.LOGIN_AMOUNT / 1e7; s["sa"] = s.SANCTIONED_AMOUNT / 1e7; s["da"] = s.DISB_AMOUNT / 1e7
    s["ins"] = (s.LI_AMOUNT + s.GI_AMOUNT) / 1e7; s["pf"] = s.PF_AMOUNT / 1e7
    s = s.rename(columns={"LOGIN_COUNT": "lc", "DECISION_COUNT": "dc", "SANCTION_COUNT": "sc", "DISB_COUNT": "dn", "BRANCH": "raw"})
    return s.groupby(["k", "raw", "m", "f", "ch", "z"], dropna=False)[["la", "lc", "dc", "sa", "sc", "da", "dn", "ins", "pf"]].sum().reset_index()

def part_sales():
    if not run("sales", "Sales", sales_piece): return
    s = gather("sales")
    tot = s.groupby("k")[["la", "lc", "dc", "sa", "sc", "da", "dn", "ins", "pf"]].sum()
    tot.columns = ["s_" + c for c in tot.columns]
    bym = s.groupby(["k", "m"])[["la", "lc", "sa", "sc", "da", "dn"]].sum().unstack("m", fill_value=0)
    bym.columns = [f"s_{v}_{m}" for v, m in bym.columns]
    out = tot.join(bym)
    out = out.join(wide(s, "k", "f", "da", "sf_da_", FAMS)).join(wide(s, "k", "f", "dn", "sf_dn_", FAMS)).join(wide(s, "k", "f", "la", "sf_la_", FAMS))
    out = out.join(wide(s, "k", "ch", "da", "sch_da_", CHANNELS)).join(wide(s, "k", "ch", "la", "sch_la_", CHANNELS))
    # display name = most common raw spelling; zone = where most disbursal (then logins) is booked
    nm = s.groupby(["k", "raw"]).la.sum().reset_index().sort_values("la").drop_duplicates("k", keep="last").set_index("k").raw
    zz = s[s.z != "Other"].groupby(["k", "z"])[["da", "la"]].sum().reset_index().sort_values(["da", "la"]).drop_duplicates("k", keep="last").set_index("k").z
    out["s_name"] = nm; out["s_zone"] = zz
    out = out[(out.s_la > 0) | (out.s_da > 0) | (out.s_lc > 0)]
    print(f"sales: {len(out)} branches, disb ₹{out.s_da.sum():,.1f} Cr, logins ₹{out.s_la.sum():,.1f} Cr")
    save("sales", out)

# ================================================================== CREDIT (Oct 2025 – Oct 2026)
def part_credit():
    c = pd.read_csv(os.path.join(D, "Credit_data_new.csv"), low_memory=False).dropna(how="all")
    for k in ["SANCTIONED_AMOUNT", "TOTAL_LEAD_COUNT"]: c[k] = num(c[k])
    c["k"] = key(c.BRANCH_NAME); c = c[~c.k.isin(BAD)].copy()
    c["m"] = pd.to_datetime(c.DECISION_MONTH, format="%b-%y", errors="coerce").dt.strftime("%Y-%m"); c = c[c.m.notna()].copy()
    c["f"] = c.PRODUCT.map(CRED_FAM).fillna("OTH")
    c["z"] = c.ZONE.map(zone)
    st = c.STATUS.astype(str).str.upper(); rs = c.REAL_STATUS.astype(str).str.upper()
    sysu = c.PROCESSING_UNIT.eq("System")
    c["o"] = np.select([st.eq("SANCTIONED"), st.eq("REJECTED") & sysu, st.eq("REJECTED"), st.isin(["CANCELLED", "CANCELED"])],
                       ["san", "gated", "declined", "cancelled"], "pending")
    booked = rs.isin(["DISBURSED", "LOAN_CREATED", "LOAN_CREATION_REQUESTED", "LOAN_CREATION_VERIFIED"])
    lapsed = rs.isin(["SANCTIONED_EXPIRED", "CANCELLED", "CANCELED", "REJECTED"])
    c["n"] = c.TOTAL_LEAD_COUNT
    c["dec"] = np.where(c.o.isin(["san", "gated", "declined"]), c.n, 0.0)
    c["san"] = np.where(c.o == "san", c.n, 0.0)
    c["gated"] = np.where(c.o == "gated", c.n, 0.0); c["declined"] = np.where(c.o == "declined", c.n, 0.0)
    c["cancelled"] = np.where(c.o == "cancelled", c.n, 0.0)
    c["booked"] = np.where((c.o == "san") & booked, c.n, 0.0); c["lapsed"] = np.where((c.o == "san") & lapsed, c.n, 0.0)
    c["sa"] = np.where(c.o == "san", c.SANCTIONED_AMOUNT, 0.0) / 1e7
    c["rg"] = np.where(c.o.isin(["gated", "declined"]), c.MAJOR_REJECTION_REASON.map(rej_group), "")
    c["src"] = c.LEAD_SOURCE_NEW.fillna("Others").replace({"XSELL_ETP_PQ_HL_TOPUP": "Others"})
    c["occ"] = c.OCCUPATION_NEW.fillna("Unknown").map(lambda x: "Sal" if x == "Salaried" else ("SE" if x == "Self-Employed" else "Unk"))
    out = c.groupby("k")[["dec", "san", "gated", "declined", "cancelled", "booked", "lapsed", "sa"]].sum()
    out.columns = ["c_" + x for x in out.columns]
    months = sorted(c.m.unique())
    for v in ["dec", "san", "sa"]: out = out.join(wide(c, "k", "m", v, f"cm_{v}_", months))
    for v in ["dec", "san", "sa"]: out = out.join(wide(c, "k", "f", v, f"cf_{v}_", FAMS))
    # product family x month sanctioned amount for BCG growth
    c["fm"] = c.f + "|" + c.m
    out = out.join(wide(c, "k", "fm", "sa", "cfm_"))
    out = out.join(wide(c[c.rg != ""], "k", "rg", "n", "cr_", REJS))
    for v in ["dec", "san"]: out = out.join(wide(c, "k", "src", v, f"cs_{v}_", ["DSA", "Connector", "CSC", "Others"]))
    for v in ["dec", "san"]: out = out.join(wide(c, "k", "occ", v, f"co_{v}_", ["Sal", "SE", "Unk"]))
    nm = c.groupby(["k", "BRANCH_NAME"]).n.sum().reset_index().sort_values("n").drop_duplicates("k", keep="last").set_index("k").BRANCH_NAME
    zz = c[c.z != "Other"].groupby(["k", "z"]).n.sum().reset_index().sort_values("n").drop_duplicates("k", keep="last").set_index("k").z
    out["c_name"] = nm; out["c_zone"] = zz
    out = out.fillna({x: 0.0 for x in out.columns if x not in ("c_name", "c_zone")})
    print(f"credit: {len(out)} branches, months {months[0]}..{months[-1]}, approval {out.c_san.sum()/out.c_dec.sum():.1%}")
    save("credit", out); json.dump(months, open(os.path.join(W, "credit_months.json"), "w"))

# ================================================================== OPERATIONS (HL + MSME, LAN Apr–Oct 2026)
QREASONS = ["Sanction Letter", "Insurance", "Application Form", "KYC", "Loan Agreement Kit", "NACH", "Title Documents", "SPDC",
            "Verification Reports", "Technical Condition", "Processing Fee", "LRD Docs", "OCR", "MODT/MOE", "Posidex/Dedupe Query"]
def part_ops():
    o = pd.read_csv(os.path.join(D, "Operations_data_new.csv"), dtype=str).dropna(how="all")
    asof = pd.Timestamp("2026-10-14")
    for c in ["DOCKET_LOGGED_IN_DATE", "LAN_GENERATED_DATE", "RECEIVABLE_DATE", "DOCUMENT_RECEIVED_DATE"]:
        o[c] = pd.to_datetime(o[c], format="%d/%m/%Y", errors="coerce")
    o["k"] = key(o.LOAN_BRANCH); o = o[~o.k.isin(BAD)].copy()
    L = o.groupby("LOAN_NUMBER").agg(k=("k", "first"), ftr=("DOCKET_FTR", "first"), es=("ESIGN_STATUS", "first"),
        en=("ENACH_STATUS", "first"), ena=("ENACH_APPLICABLE_FLAG", "first"), login=("DOCKET_LOGGED_IN_DATE", "first"),
        lan=("LAN_GENERATED_DATE", "first"), q=("DOCKET_QUERY", "first"), pdd=("IS_PDD_PENDING", "first")).reset_index()
    L["o_loans"] = 1.0
    L["o_ftr"] = L.ftr.eq("TRUE").astype(float)
    L["o_esd"] = L.es.eq("Digital").astype(float); L["o_esn"] = L.es.isin(["Digital", "Physical"]).astype(float)
    L["o_ena"] = L.ena.ne("No").astype(float); L["o_enr"] = (L.ena.ne("No") & L.en.eq("SUCCESS")).astype(float)
    L["o_pdd"] = L.pdd.eq("TRUE").astype(float)
    d = (L.lan - L.login).dt.days
    L["o_tatn"] = d.between(0, 365).astype(float); L["o_tat"] = d.where(d.between(0, 365), 0).astype(float)
    L["o_tat3"] = d.between(0, 3).astype(float)          # LAN within 3 days of login
    out = L.groupby("k")[["o_loans", "o_ftr", "o_esd", "o_esn", "o_ena", "o_enr", "o_pdd", "o_tat", "o_tatn", "o_tat3"]].sum()
    L["lm"] = L.lan.dt.strftime("%Y-%m").fillna("NA")
    OM = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]
    out = out.join(wide(L, "k", "lm", "o_loans", "om_n_", OM)).join(wide(L, "k", "lm", "o_ftr", "om_f_", OM))
    Q = L[L.q.notna()][["LOAN_NUMBER", "k", "q"]].copy()
    Q["q"] = Q.q.str.split(","); Q = Q.explode("q"); Q["q"] = Q.q.str.strip()
    Q = Q[Q.q != ""].drop_duplicates(["LOAN_NUMBER", "q"]); Q["q"] = np.where(Q.q.isin(QREASONS), Q.q, "Other"); Q["n"] = 1.0
    out = out.join(wide(Q, "k", "q", "n", "oq_", QREASONS + ["Other"]))
    P = o[o.DOCUMENT_NAME.notna()].copy()
    P["pend"] = P.DOCUMENT_RECEIVED_DATE.isna()
    P["od"] = P.pend & P.RECEIVABLE_DATE.notna() & (P.RECEIVABLE_DATE < asof)
    P["od90"] = P.od & ((asof - P.RECEIVABLE_DATE).dt.days > 90)
    pd_ = P.groupby("k").agg(o_docs=("pend", "size"), o_docp=("pend", "sum"), o_doco=("od", "sum"), o_doc90=("od90", "sum")).astype(float)
    out = out.join(pd_).fillna(0.0)
    print(f"ops: {len(out)} branches, {int(out.o_loans.sum()):,} loans, FTR {out.o_ftr.sum()/out.o_loans.sum():.1%}")
    save("ops", out)

# ================================================================== INSURANCE (loans first disbursed Apr–Oct 2026)
ITYPES = {"LIFE_INSURANCE": "Life", "HEALTH_INSURANCE": "Health", "GENERAL_INSURANCE": "General", "PERSONAL_ACCIDENT": "PA",
          "MOTOR_INSURANCE": "Motor", "EXTENDED_WARRANTY": "Other", "EMI_PROTECTION": "Other", "BUY_BACK": "Other"}
def part_ins():
    i = pd.read_csv(os.path.join(D, "Insurance_data_new.csv"), dtype=str,
                    usecols=["LOAN_NUMBER", "INSURANCE_TYPE", "PREMIUM_AMOUNT", "FIRST_DISB_MONTH", "SUM(T3.DISB_AMOUNT)", "CURRENT_MASTER_NAME"]).dropna(how="all")
    i["k"] = key(i.CURRENT_MASTER_NAME); i = i[~i.k.isin(BAD)].copy()
    i["prem"] = num(i.PREMIUM_AMOUNT) / 1e7; i["disb"] = num(i["SUM(T3.DISB_AMOUNT)"]) / 1e7
    i["dm"] = pd.to_datetime(i.FIRST_DISB_MONTH, errors="coerce").dt.strftime("%Y-%m").fillna("NA")
    i["it"] = i.INSURANCE_TYPE.map(ITYPES).fillna("Other")
    i["aug_sep"] = i.dm.isin(["2026-08", "2026-09"])
    L = i.groupby("LOAN_NUMBER").agg(k=("k", "first"), dm=("dm", "first"), a=("aug_sep", "first"), disb=("disb", "first"),
                                    prem=("prem", "sum"), npol=("it", "size")).reset_index()
    out = L.groupby("k").agg(i_loans=("LOAN_NUMBER", "size"), i_pol=("npol", "sum"), i_prem=("prem", "sum"), i_disb=("disb", "sum"))
    a = L[L.a].groupby("k").agg(i_loans_as=("LOAN_NUMBER", "size"), i_prem_as=("prem", "sum"), i_disb_as=("disb", "sum"))
    out = out.join(a).join(wide(i, "k", "it", "prem", "ip_", ["Life", "Health", "General", "PA", "Motor", "Other"]))
    out = out.join(wide(i.assign(n=1.0), "k", "it", "n", "in_", ["Life", "Health", "General", "PA", "Motor", "Other"])).fillna(0.0).astype(float)
    IM = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]
    out = out.join(wide(L.assign(n=1.0), "k", "dm", "n", "im_n_", IM)).join(wide(L, "k", "dm", "prem", "im_p_", IM)).fillna(0.0)
    print(f"insurance: {len(out)} branches, {int(out.i_loans.sum()):,} insured loans, premium ₹{out.i_prem.sum():,.1f} Cr")
    save("ins", out)

# ================================================================== RISK (cohorts May–Sep 2026; snapshots Jul–Sep 2026)
RCOLS = ["CAL", "MONTH", "PRODUCT_CATEGORY_ORD", "STATE", "ZONE", "SECURED_FLAG", "CIBIL_BIN", "BRANCH_NAME", "FLAG", "TOTAL_DISB",
         "EVER30", "AUM", "P1", "P30", "ACTIVE_LAN", "BOUNCE", "DUE"]
def risk_piece(p):
    ch = read_piece("Risk", p, RCOLS)
    for k in ["FLAG", "TOTAL_DISB", "EVER30", "AUM", "P1", "P30", "ACTIVE_LAN", "BOUNCE", "DUE"]: ch[k] = num(ch[k])
    ch["k"] = key(ch.BRANCH_NAME); ch = ch[~ch.k.isin(BAD)].copy()
    ch["mon"] = ch.MONTH.astype(str).map({"Jul'26": "07", "Aug'26": "08", "Sep'26": "09"}).fillna("xx")
    ch["f"] = ch.PRODUCT_CATEGORY_ORD.map(CAT_FAM).fillna("OTH")
    ch["sec"] = ch.SECURED_FLAG.astype(str).str.startswith("SECURED").astype(float)
    ch["cib"] = ch.CIBIL_BIN.isin(["731-770", "771-790", ">=791"]).astype(float); ch["ntc"] = ch.CIBIL_BIN.eq("NTC").astype(float)
    ch["n"] = ch.FLAG; ch["disb"] = ch.TOTAL_DISB; ch["aum"] = ch.AUM
    ch["e30"] = ch.TOTAL_DISB * ch.EVER30; ch["p1"] = ch.AUM * ch.P1; ch["p30"] = ch.AUM * ch.P30
    ch["al"] = ch.ACTIVE_LAN; ch["bn"] = ch.ACTIVE_LAN * ch.BOUNCE; ch["du"] = ch.ACTIVE_LAN * ch.DUE
    ch["saum"] = ch.aum * ch.sec; ch["caum"] = ch.aum * ch.cib; ch["naum"] = ch.aum * ch.ntc
    M = ["n", "disb", "e30", "aum", "p1", "p30", "al", "bn", "du", "saum", "caum", "naum"]
    a = ch.groupby(["k", "mon", "f"])[M].sum().reset_index()
    st = ch.groupby(["k", "STATE"]).aum.sum().reset_index(); st["mon"] = "state"
    sep = ch[ch.mon == "09"]
    cb = sep.groupby(["k", "CIBIL_BIN"]).aum.sum().reset_index().rename(columns={"CIBIL_BIN": "f"}); cb["mon"] = "cib"
    return pd.concat([a, st.rename(columns={"STATE": "f"}), cb])

def part_risk():
    if not run("risk", "Risk", risk_piece): return
    r = gather("risk")
    st = r[r.mon == "state"].groupby(["k", "f"]).aum.sum().reset_index().sort_values("aum").drop_duplicates("k", keep="last").set_index("k").f
    cib = r[r.mon == "cib"].groupby(["k", "f"]).aum.sum().unstack("f", fill_value=0.0)
    CB = {"300-680": "lt680", "681-730": "681_730", "731-770": "731_770", "771-790": "771_790", ">=791": "ge791", "NTC": "ntc"}
    cib = cib.reindex(columns=list(CB), fill_value=0.0); cib.columns = ["rc_" + CB[c] for c in cib.columns]
    r = r[r.mon.isin(["07", "08", "09"])]
    M = ["n", "disb", "e30", "aum", "p1", "p30", "al", "bn", "du", "saum", "caum", "naum"]
    bym = r.groupby(["k", "mon"])[M].sum().unstack("mon", fill_value=0)
    bym.columns = [f"r_{v}_{m}" for v, m in bym.columns]
    lat = r[r.mon == "09"]
    out = bym.join(wide(lat, "k", "f", "aum", "rf_aum_", FAMS)).join(wide(lat, "k", "f", "bn", "rf_bn_", FAMS)).join(wide(lat, "k", "f", "du", "rf_du_", FAMS))
    out = out.join(cib).fillna(0.0); out["r_state"] = st
    print(f"risk: {len(out)} branches, Sep AUM ₹{out.r_aum_09.sum():,.0f} Cr, bounce {out.r_bn_09.sum()/out.r_du_09.sum():.2%}")
    save("risk", out)

# ================================================================== COLLECTIONS -> local market (district & state)
CCOLS = ["BUCKET", "MONTH_NAME", "PCHFL_RESOLUTIONSTATUS", "BOUNCE_FLAG", "DISTRICT", "STATE", "NO_ACCOUNTS", "POS_CRS", "CITY_TIER"]
def coll_piece(p):
    ch = read_piece("Collections", p, CCOLS)
    ch = ch[ch.MONTH_NAME.isin(["Aug-26", "Sep-26", "Oct-26"])].copy()
    ch["bk"] = ch.BUCKET.map({"1.B1": "B1", "2.B2": "B2", "3.B3": "B3", "4.NPA": "NPA", "4.Risk_NPA": "NPA", "4.Opening_NPA": "NPA"})
    ch = ch[ch.bk.notna()]
    ch["m"] = ch.MONTH_NAME.map({"Aug-26": "08", "Sep-26": "09", "Oct-26": "10"})
    ch["acc"] = num(ch.NO_ACCOUNTS); ch["pos"] = num(ch.POS_CRS)
    ch["bacc"] = ch.acc * num(ch.BOUNCE_FLAG)
    res = ch.PCHFL_RESOLUTIONSTATUS.astype(str).str.lower().eq("true")
    ch["rpos"] = np.where(res, ch.pos, 0.0); ch["racc"] = np.where(res, ch.acc, 0.0)
    ch["d"] = key(ch.DISTRICT); ch["st"] = ch.STATE.fillna("").astype(str).str.strip()
    ch["tier"] = ch.CITY_TIER.fillna("")
    return ch.groupby(["st", "d", "tier", "m", "bk"])[["acc", "pos", "bacc", "rpos", "racc"]].sum().reset_index()

def part_coll():
    if not run("coll", "Collections", coll_piece): return
    k = gather("coll").groupby(["st", "d", "tier", "m", "bk"])[["acc", "pos", "bacc", "rpos", "racc"]].sum().reset_index()
    print(f"collections: {k.d.nunique()} districts, {k.st.nunique()} states, POS ₹{k.pos.sum():,.0f} Cr")
    save("coll", k)

# ================================================================== assemble
ALIAS = {"BENGALURU": "BANGALORE", "GURUGRAM": "GURGAON", "MYSURU": "MYSORE", "BELAGAVI": "BELGAUM", "KALABURAGI": "GULBARGA",
         "VIJAYAWADA": "KRISHNA", "TIRUPATI": "CHITTOOR", "NOIDA": "GAUTAM BUDDHA NAGAR", "THANE": "THANE", "VADODARA": "VADODARA",
         "PRAYAGRAJ": "ALLAHABAD", "HUBLI": "DHARWAD", "MANGALURU": "DAKSHINA KANNADA", "MANGALORE": "DAKSHINA KANNADA",
         "SHIVAMOGGA": "SHIMOGA", "TUMAKURU": "TUMKUR", "VIZAG": "VISAKHAPATNAM", "VISAKHAPATNAM": "VISAKHAPATNAM",
         "TRIVANDRUM": "THIRUVANANTHAPURAM", "COCHIN": "ERNAKULAM", "KOCHI": "ERNAKULAM", "CALICUT": "KOZHIKODE",
         "PONDICHERRY": "PUDUCHERRY", "BARODA": "VADODARA", "NAVI": "THANE", "MUMBAI": "MUMBAI SUBURBAN", "KOLKATA": "KOLKATA",
         "DELHI": "NEW DELHI", "NEW": "NEW DELHI", "GHAZIABAD": "GHAZIABAD", "FARIDABAD": "FARIDABAD"}
def r4(x):
    if isinstance(x, float):
        if not np.isfinite(x): return 0
        x = round(x, 4); return int(x) if x == int(x) else x
    return x

def assemble():
    S, C, O, I, R, K = (load(n) for n in ["sales", "credit", "ops", "ins", "risk", "coll"])
    ids = sorted(set(S.index) | set(C.index))
    B = pd.DataFrame(index=pd.Index(ids, name="k")).join(S).join(C).join(O).join(I).join(R)
    # keep branches with real business in the window
    B = B[(B.s_da.fillna(0) > 0) | (B.c_dec.fillna(0) >= 50)]
    def title(s):
        s = str(s)
        return s if any(ch.islower() for ch in s) else s.title()
    B["name"] = B.c_name.where(B.c_name.notna(), B.s_name).map(title)
    B["zone"] = B.c_zone.where(B.c_zone.notna(), B.s_zone).fillna("Other")
    FIXST = {"BENGALURU MUSEUM ROAD": "Karnataka", "HYDERABAD SOMAJIGUDA": "Telangana", "KURLA": "Maharashtra", "MUMBAI DAHISAR": "Maharashtra",
             "MUMBAI VASAI WEST": "Maharashtra", "NASHIK COLLEGE ROAD": "Maharashtra", "RAIGAD MAHAD": "Maharashtra", "NOIDA WTT": "Uttar Pradesh"}
    B["state"] = [FIXST.get(k, s) for k, s in zip(B.index, B.r_state.fillna("Unknown").replace({"Chattisgarh": "Chhattisgarh"}))]
    B.loc[B.zone == "Other", "zone"] = "West"
    # local market = nearest Collections district (geocoded in pipeline/geo.json), else the branch's state
    geo = json.load(open(os.path.join(ROOT, "pipeline", "geo.json")))
    G = geo["b"]
    B["lat"] = [G.get(k, [None])[0] for k in B.index]; B["lon"] = [G.get(k, [None, None])[1] for k in B.index]
    B["mstate"] = [G[k][2] if k in G and G[k][2] else "" for k in B.index]
    B["district"] = [G[k][3] if k in G else "" for k in B.index]
    num_cols = [c for c in B.columns if c not in ("name", "zone", "state", "district", "mstate", "lat", "lon", "s_name", "c_name", "s_zone", "c_zone", "r_state")]
    B[num_cols] = B[num_cols].astype(float).fillna(0.0)
    cols = ["id", "name", "zone", "state", "mstate", "district", "lat", "lon"] + num_cols
    rows = [[k, r["name"], r.zone, r.state, r.mstate, r.district, r.lat if r.lat == r.lat else None, r.lon if r.lon == r.lon else None] + [r4(float(v)) for v in r[num_cols].values] for k, r in B.iterrows()]
    # market table: per state and per district, month x bucket sums
    canon = {}
    for st in sorted(K.st.unique(), key=lambda x: x == x.upper()):   # prefer 'Gujarat' over 'GUJARAT'
        canon.setdefault(st.upper(), st)
    K = K.assign(st=K.st.map(lambda x: canon.get(x.upper(), x))).query("st != '' and d != 'NAN'")
    K = K.groupby(["st", "d", "tier", "m", "bk"])[["acc", "pos", "bacc", "rpos", "racc"]].sum().reset_index()
    M = []
    for (st, d, m, bk), g in K.groupby(["st", "d", "m", "bk"]):
        M.append([st, d, m, bk] + [r4(float(x)) for x in g[["acc", "pos", "bacc", "rpos", "racc"]].sum().values])
    tiers = K.groupby("d").apply(lambda g: g.groupby("tier").acc.sum().idxmax(), include_groups=False).to_dict()
    meta = {"built": time.strftime("%Y-%m-%d %H:%M"), "credit_months": json.load(open(os.path.join(W, "credit_months.json"))),
            "fams": FAMS, "channels": CHANNELS, "rej": REJS, "qreasons": QREASONS + ["Other"],
            "windows": {"sales": "Aug–Sep 2026", "credit": "Oct 2025 – Oct 2026", "ops": "HL & MSME loans, Apr–Oct 2026",
                        "ins": "loans disbursed Apr–Oct 2026", "risk": "loans booked May–Sep 2026, snapshots Jul–Sep 2026",
                        "coll": "Aug–Oct 2026 (Oct partial), district level"}}
    geo = {"S": geo["S"], "runs": geo["runs"]}
    data = {"meta": meta, "branches": {"cols": cols, "rows": rows},
            "market": {"cols": ["state", "district", "m", "bk", "acc", "pos", "bacc", "rpos", "racc"], "rows": M},
            "tiers": tiers, "geo": geo}
    with open(OUT, "w") as fh: fh.write("window.OV=" + json.dumps(data, separators=(",", ":"), ensure_ascii=False) + ";")
    print(f"wrote data.js {os.path.getsize(OUT)/1024:.0f} KB: {len(rows)} branches x {len(cols)} cols, {len(M)} market rows")
    print("matched district:", (B.district != "").mean().round(3), "| no coords:", B.lat.isna().sum(), "| state unknown:", (B.state == "Unknown").sum(),
          "| zones:", B.zone.value_counts().to_dict())
    print("check: disb", round(B.s_da.sum(), 1), "decisions", int(B.c_dec.sum()), "ops loans", int(B.o_loans.sum()), "premium", round(B.i_prem.sum(), 1))

FN = {"split": part_split, "sales": part_sales, "credit": part_credit, "ops": part_ops, "ins": part_ins,
      "risk": part_risk, "coll": part_coll, "assemble": assemble}
if __name__ == "__main__":
    for a in sys.argv[1:]:
        t0 = time.time(); FN[a](); print(f"[{a}] {time.time()-t0:.0f}s", flush=True)
