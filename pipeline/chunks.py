"""Resumable piece-wise processing: big CSVs are pre-split into .work/split/<File>_NNN pieces (header kept separately).
Each call processes pending pieces until a time budget is spent, writing one pickle per piece."""
import os, glob, time, io, pandas as pd
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
SPLIT=os.path.join(ROOT,".work","split"); OUTD=os.path.join(ROOT,".work","parts")
os.makedirs(OUTD,exist_ok=True)
def pieces(f): return sorted(glob.glob(os.path.join(SPLIT,f+"_[0-9]*")))
def read_piece(f,p,usecols=None,**kw):
    hdr=open(os.path.join(SPLIT,f+".header"),encoding="utf-8-sig").read()
    with open(p,encoding="utf-8",errors="replace") as fh: body=fh.read()
    return pd.read_csv(io.StringIO(hdr+body),usecols=usecols,low_memory=False,**kw).dropna(how="all")  # skip blank padding rows
def run(job,f,fn,budget=30):
    t=time.time(); done=0; todo=0
    for p in pieces(f):
        out=os.path.join(OUTD,f"{job}__{os.path.basename(p)}.pkl")
        if os.path.exists(out): done+=1; continue
        if time.time()-t>budget: todo+=1; continue
        fn(p).to_pickle(out); done+=1
    print(f"{job}: {done} done, {todo} pending, {time.time()-t:.0f}s",flush=True); return todo==0
def gather(job): return pd.concat([pd.read_pickle(x) for x in sorted(glob.glob(os.path.join(OUTD,job+"__*.pkl")))])
