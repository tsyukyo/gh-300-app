#!/usr/bin/env python3
"""practice/detailed/*.md を questions.en.json に変換する。
使い方: parse_questions.py <detailed ディレクトリ> <出力JSON>
問題データはライセンス未確認のためリポジトリにコミットしない。"""
import json, re, sys, glob, os

def parse(path, test):
    t = open(path, encoding="utf-8").read()
    out = []
    for blk in re.split(r"\*\*Question:\*\*\s*\[", t)[1:]:
        m = re.match(r"(\d+)\]\s*\n(.*?)\n\s*\*\*Options:\*\*\s*\n(.*?)\*\*Correct Answer\(s\):\*\*\s*([A-J, ]+)\s*\n(.*)", blk, re.S)
        if not m:
            print("skip", path, blk[:40], file=sys.stderr); continue
        num, stem, opts, ans, rest = m.groups()
        options = [re.sub(r"^[A-J]\.\s*", "", l).strip() for l in opts.strip().splitlines() if re.match(r"^[A-J]\.", l.strip())]
        exp = re.search(r"\*\*Explanation:\*\*\s*\n(.*?)(?=\n\*\*Tips and Tricks:|\n\*\*Source:|\Z)", rest, re.S)
        tips = re.search(r"\*\*Tips and Tricks:\*\*\s*\n(.*?)(?=\n>|\n\*\*Source:|\Z)", rest, re.S)
        out.append({
            "id": f"T{test:02d}_{int(num):03d}", "test": test,
            "q": stem.strip(), "options": options,
            "answer": [ord(a.strip()) - 65 for a in ans.split(",") if a.strip()],
            "explanation": exp.group(1).strip() if exp else "",
            "tips": tips.group(1).strip() if tips else "",
        })
    return out

qs = []
for p in sorted(glob.glob(os.path.join(sys.argv[1], "*-practice-test.detailed.md"))):
    qs += parse(p, int(os.path.basename(p)[:2]))
json.dump(qs, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(qs), "questions;", sum(len(q["answer"]) > 1 for q in qs), "multi-answer")
