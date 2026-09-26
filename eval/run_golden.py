#!/usr/bin/env python3
"""
Run the golden cases through the deployed Clearance contract on Studio Next,
through real consensus, and publish what came out.

    python eval/run_golden.py              # the nine golden cases not yet decided
    python eval/run_golden.py H1 H2 H3     # the held-out cases, once
    python eval/run_golden.py --report     # rewrite results.md from results.json

eval/golden.json was written, hashed and timestamped (eval/golden.lock.json)
before the first run, and this script refuses to run if it has changed since.
Each case publishes its license as a work of its own (cases 1 and 2 share one)
from the "golden_creator" account, then asks about its use from "golden_asker",
so every verdict below is the real judge on the real contract.

H1 to H3 are held out: run once, reported as they came out, never used to tune
the prompt. A case whose round produced no verdict (the committee timed out or
could not agree) may be sent again, and every attempt stays in the record. A
case that produced a verdict is never sent again, whatever the verdict was.
"""

from __future__ import annotations

import datetime
import hashlib
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "scripts"))

import chain as C  # noqa: E402

# A model's reason can carry any character; the Windows console codepage cannot.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = pathlib.Path(__file__).resolve().parent
GOLDEN = HERE / "golden.json"
LOCK = HERE / "golden.lock.json"
RESULTS = HERE / "results.json"
REPORT = HERE / "results.md"


def judge_sha() -> str:
    import ast

    tree = ast.parse(C.CONTRACT_FILE.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign) and ast.unparse(node.targets[0]) == "JUDGE":
            return hashlib.sha256(ast.literal_eval(node.value).encode("utf-8")).hexdigest()
    raise SystemExit("no JUDGE constant")


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_results() -> dict:
    if RESULTS.exists():
        return json.loads(RESULTS.read_text(encoding="utf-8"))
    return {"attempts": [], "works": {}}


def save(results: dict) -> None:
    RESULTS.write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def decided(results: dict, case_id: str) -> bool:
    return any(a["case"] == case_id and a.get("verdict") for a in results["attempts"])


def publish(chain: C.Chain, address: str, golden: dict, case: dict, results: dict) -> int:
    source = case.get("same_license_as", case["id"])
    known = results["works"].get(source)
    if known:
        return int(known["work_id"])
    terms = {"creator": golden["creator"], "kind": "other", "tiers": case["tiers"]}
    before = C.retry("list_works", chain.read_json, address, "list_works", [0, 1])["total"]
    outcome = chain.send(address, "publish_work", [case["title"], golden["link"], case["license"], json.dumps(terms)])
    if not outcome["ok"]:
        raise SystemExit(f"publish for case {case['id']} failed: {outcome['detail']}")
    work_id = outcome["result"] if isinstance(outcome["result"], int) else None
    if not work_id:
        latest = chain.read_json(address, "list_works", [0, 1])
        work_id = int(latest["items"][0]["id"]) if latest["total"] > before else None
    if not work_id:
        raise SystemExit(f"publish for case {case['id']} returned no work id")
    results["works"][source] = {"work_id": int(work_id), "tx": outcome["hash"], "published_at": now_iso()}
    save(results)
    print(f"  published work {work_id}  {C.EXPLORER}/tx/{outcome['hash']}")
    return int(work_id)


def run(ids: list[str]) -> None:
    lock = json.loads(LOCK.read_text(encoding="utf-8"))
    if C.sha256_file(GOLDEN) != lock["sha256"]:
        raise SystemExit("eval/golden.json changed after it was locked; the golden set is not edited after the first run")
    golden = json.loads(GOLDEN.read_text(encoding="utf-8"))
    address = C.address()
    people = C.accounts("golden_creator", "golden_asker")
    creator = C.Chain(people["golden_creator"])
    asker = C.Chain(people["golden_asker"])
    creator.ensure(people["golden_creator"].address, minimum_gen=20)
    asker.ensure(people["golden_asker"].address, minimum_gen=20)
    results = load_results()
    results.update(
        {
            "contract": address,
            "contract_sha256": C.deployment().get("clearance_sha256"),
            "golden_sha256": lock["sha256"],
            "golden_locked_at": lock["locked_at"],
            "judge_sha256": judge_sha(),
            "network": C.NETWORK,
            "explorer": C.EXPLORER,
            "creator": people["golden_creator"].address,
            "asker": people["golden_asker"].address,
        }
    )
    save(results)
    wanted = ids or [c["id"] for c in golden["cases"] if not c.get("held_out")]
    for case in golden["cases"]:
        cid = case["id"]
        if cid not in wanted:
            continue
        if decided(results, cid):
            print(f"{cid}: already decided, never sent again")
            continue
        print(f"\n{cid} {case['title']} (expected {case['expected']['verdict']} {case['expected']['tier']})")
        work_id = publish(creator, address, golden, case, results)
        tries = sum(1 for a in results["attempts"] if a["case"] == cid)
        outcome = asker.send(address, "ask", [work_id, case["use"]])
        attempt = {
            "case": cid,
            "attempt": tries + 1,
            "held_out": bool(case.get("held_out")),
            "work_id": work_id,
            "expected": case["expected"],
            "tx": outcome["hash"],
            "sent_at": now_iso(),
            "consensus": "decided" if outcome["ok"] else outcome["detail"],
        }
        if outcome["ok"]:
            request_id = outcome["result"] if isinstance(outcome["result"], int) else None
            if request_id:
                stored = C.retry("get_request", asker.read_json, address, "get_request", [request_id])
                attempt.update(
                    {
                        "request_id": request_id,
                        "verdict": stored["verdict"],
                        "tier": stored["tier"],
                        "conditions": stored["conditions"],
                        "reason": stored["reason"],
                        "version": stored["version"],
                        "status": stored["status"],
                    }
                )
            else:
                attempt["consensus"] = "decided, but the receipt carried no request id: " + str(outcome["result"])[:120]
        # Saved before anything is printed: a result that exists on chain must
        # never be lost to a failure on this side of the wire.
        results["attempts"].append(attempt)
        save(results)
        if attempt.get("verdict"):
            got = (attempt["verdict"], attempt["tier"])
            want = (case["expected"]["verdict"], case["expected"]["tier"])
            print(f"  {'MATCH' if got == want else 'MISS '} {got[0]} {got[1]}  {attempt['reason']}")
        else:
            print(f"  no verdict: {attempt['consensus']}")
        print(f"  {C.EXPLORER}/tx/{attempt['tx']}")
    report()


def report() -> None:
    results = load_results()
    golden = json.loads(GOLDEN.read_text(encoding="utf-8"))
    by_case = {c["id"]: c for c in golden["cases"]}
    final: dict[str, dict] = {}
    for attempt in results["attempts"]:
        if attempt.get("verdict"):
            final[attempt["case"]] = attempt

    def score(held: bool) -> tuple[int, int]:
        rows = [a for cid, a in final.items() if bool(by_case[cid].get("held_out")) == held]
        hits = sum(1 for a in rows if (a["verdict"], a["tier"]) == (a["expected"]["verdict"], a["expected"]["tier"]))
        return hits, len(rows)

    g_hit, g_n = score(False)
    h_hit, h_n = score(True)
    explorer = results.get("explorer", C.EXPLORER)
    lines = [
        "# Golden cases, through real consensus",
        "",
        f"Contract [`{results.get('contract', '')}`]({explorer}/address/{results.get('contract', '')}) on Studio Next "
        f"(chain 61997). Every row is one `ask` transaction on the deployed contract, and the verdict is read back "
        "from the contract with `get_request`, not from the script's memory.",
        "",
        f"- Golden set: **{g_hit} of {g_n}** matched.",
        f"- Held-out cases: **{h_hit} of {h_n}** matched.",
        f"- `eval/golden.json` sha256 `{results.get('golden_sha256', '')}`, locked at {results.get('golden_locked_at', '')}, before the first run.",
        f"- Judge prompt sha256 `{results.get('judge_sha256', '')}`.",
        "",
        "Nothing here was tuned. The prompt is the spec's, word for word, and no case was edited after the lock. "
        "H1 and H3 are borderline on purpose, so their results are reported as they came out.",
        "",
        "| Case | Use | Expected | Got | Reason (the leader's, display only) | Transaction |",
        "|---|---|---|---|---|---|",
    ]
    for case in golden["cases"]:
        cid = case["id"]
        exp = case["expected"]["verdict"] + (" · " + case["expected"]["tier"] if case["expected"]["tier"] else "")
        a = final.get(cid)
        if not a:
            lines.append(f"| {cid} | {case['use']} | {exp} | not run | | |")
            continue
        got = a["verdict"] + (" · " + a["tier"] if a["tier"] else "")
        mark = "✓" if (a["verdict"], a["tier"]) == (a["expected"]["verdict"], a["expected"]["tier"]) else "✗ miss"
        reason = a["reason"].replace("|", "/")
        tx = a["tx"]
        lines.append(f"| {cid}{' (held out)' if case.get('held_out') else ''} | {case['use']} | {exp} | {got} {mark} | {reason} | [{tx[:10]}…]({explorer}/tx/{tx}) |")
    others = [a for a in results["attempts"] if not a.get("verdict")]
    lines += ["", "## Every attempt", ""]
    if others:
        lines.append("Attempts whose round produced no verdict, each sent again as the next attempt:")
        lines.append("")
        for a in others:
            lines.append(f"- case {a['case']} attempt {a['attempt']}: {a['consensus']} ([tx]({explorer}/tx/{a['tx']}))")
    else:
        lines.append("Every case produced a verdict on its first attempt; nothing was sent twice.")
    lines += ["", "## The works the cases were published as", ""]
    for source, work in sorted(results.get("works", {}).items()):
        lines.append(f"- case {source}: work {work['work_id']}, published in [{work['tx'][:10]}…]({explorer}/tx/{work['tx']})")
    lines.append("")
    REPORT.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    print(f"\nwrote {REPORT.relative_to(C.ROOT).as_posix()}: golden {g_hit}/{g_n}, held out {h_hit}/{h_n}")


if __name__ == "__main__":
    if "--report" in sys.argv:
        report()
    else:
        run([a for a in sys.argv[1:] if not a.startswith("--")])
