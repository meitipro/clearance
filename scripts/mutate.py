#!/usr/bin/env python3
"""
Break every defence in the contract, one at a time, and name the test that notices.

    python scripts/mutate.py                          # run, print the table
    python scripts/mutate.py --table docs/MUTATIONS.md

A passing count is a claim; a table of mutations, each named with the test that
killed it, is evidence. Each mutant is a copy of contracts/clearance.py with one
defence removed or weakened. The direct and static tests run against it through
CLEARANCE_CONTRACT, and the first failing test is recorded as the kill.

A kill is read from pytest's own report of which test failed, never from an
exit code alone: a runner that scores exit codes reports a perfect run while
testing nothing. The generated-files test is left out, because it fails for
ANY edit and would kill every mutant without testing its defence.

If anything escapes, the table is not written and the escapes are printed. An
escape means a missing test, or a defence strict enough elsewhere that this one
can no longer fail, and either is a finding.
"""

from __future__ import annotations

import os
import pathlib
import re
import subprocess
import sys
import tempfile

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = pathlib.Path(__file__).resolve().parent.parent
CONTRACT = ROOT / "contracts" / "clearance.py"

#: (what the mutant does, text in the contract, what replaces it). Each text
#: must occur exactly once, so a mutant always changes exactly one place.
MUTANTS = [
    # who may write
    ("amend: any account may amend", 'raise gl.vm.UserError(E + "only the creator may amend this license")', "pass"),
    ("answer: any account may answer", 'raise gl.vm.UserError(E + "only the creator may answer this request")', "pass"),
    ("buy: any account may buy someone else's answer", 'raise gl.vm.UserError(E + "only the requester may buy this answer")', "pass"),
    ("publish: the work is owned by a fixed address", "owner=gl.message.sender_address,", "owner=ZERO,"),
    ("ask: the request is not bound to the asker", "requester=gl.message.sender_address,", "requester=ZERO,"),
    ("withdraw: pays a fixed address", "_Payee(me).emit_transfer(value=u256(amount))", "_Payee(ZERO).emit_transfer(value=u256(amount))"),
    # money
    ("buy: any value is accepted", "if value != int(r.price):", "if value < 0:"),
    ("buy: the seven-day hold never ends", "if now > int(r.offer_at) + HOLD_S:", "if False:"),
    ("buy: the hold is a day short", "HOLD_S = 7 * DAY", "HOLD_S = 6 * DAY"),
    ("buy: a receipt can be bought twice", '''        if r.receipt:
            raise gl.vm.UserError(E + "this request already has a receipt")
        on_offer''', '''        on_offer'''),
    ("buy: denied and unclear answers are buyable", "if not on_offer or int(r.price) <= 0:", "if int(r.price) < 0:"),
    ("buy: the creator is not credited", "self.balances[w.owner] = u256(int(self.balances.get(w.owner, u256(0))) + value)", "pass"),
    ("buy: a creator price is marked as the judge's", "kind = BY_CREATOR if r.decision == PAID else BY_JUDGE", "kind = BY_JUDGE"),
    ("withdraw: the balance is not zeroed", "        self.balances[me] = u256(0)\n", ""),
    ("withdraw: an empty balance still sends", '''        if amount <= 0:
            raise gl.vm.UserError(E + "nothing to withdraw")''', '''        if amount < 0:
            raise gl.vm.UserError(E + "nothing to withdraw")'''),
    # the creator's word
    ("answer: a request is answered twice", '''        if r.decision != "":
            raise gl.vm.UserError(E + "this request already has the creator's answer")''', '''        if False:
            raise gl.vm.UserError(E + "this request already has the creator's answer")'''),
    ("answer: the judge's own yes can be overridden", "if r.verdict not in (UNCLEAR, DENIED):", "if False:"),
    ("answer: a denied request can be denied again", "if r.verdict == DENIED and choice == DENIED:", "if False:"),
    ("answer: a creator price is not held from the answer", "            r.offer_at = u64(now)\n", ""),
    ("answer: a creator FREE issues no receipt", "            self._issue(r, w, BY_CREATOR, 0, now)", "            pass"),
    ("answer: FREE may carry a tier", '''        elif wanted != "":
            raise gl.vm.UserError(E + "only a PAID answer names a tier")''', '''        elif False:
            raise gl.vm.UserError(E + "only a PAID answer names a tier")'''),
    # versions
    ("amend: the old version is overwritten", "        version = int(w.version) + 1\n", "        version = int(w.version)\n"),
    ("ask: judged against version one forever", "        version = int(w.version)\n        v = self._version(work_id, version)", "        version = 1\n        v = self._version(work_id, version)"),
    ("digest: the tiers are not hashed", 'canonical = json.dumps({"license": license_text, "tiers": tiers}', 'canonical = json.dumps({"license": license_text}'),
    # limits
    ("ask: the 600-character cap is gone", "text = _block(use, \"use\", MAX_USE)", "text = _block(use, \"use\", 10**6)"),
    ("publish: the 1,500-character license cap is gone", "        license_text = _block(license, \"license\", MAX_LICENSE)\n        terms = parse_terms(tiers_json)\n        now = self._now()\n        wid", "        license_text = _block(license, \"license\", 10**6)\n        terms = parse_terms(tiers_json)\n        now = self._now()\n        wid"),
    ("tiers: five tiers are accepted", "if len(rows) > MAX_TIERS:", "if len(rows) > 5:"),
    ("tiers: duplicate ids are accepted", "        if tier_id in seen:", "        if False:"),
    ("tiers: a free tier is accepted", "    if wei <= 0:", "    if wei < 0:"),
    ("links: any character is accepted", "        if char not in URL_CHARS:", "        if False:"),
    # the judge
    ("judge: the fence lets delimiters through", 'return str(raw).replace("<", "(").replace(">", ")")', "return str(raw)"),
    ("judge: validators agree with any answer", "return (mine[\"verdict\"], mine[\"tier\"]) == (theirs[\"verdict\"], theirs.get(\"tier\", \"\"))", "return True"),
    ("judge: validators compare the verdict only", "return (mine[\"verdict\"], mine[\"tier\"]) == (theirs[\"verdict\"], theirs.get(\"tier\", \"\"))", "return mine[\"verdict\"] == theirs[\"verdict\"]"),
    ("judge: an unreadable verdict defaults to FREE", '''    if verdict not in VERDICTS:
        raise gl.vm.UserError(L + "bad verdict")''', '''    if verdict not in VERDICTS:
        verdict = FREE'''),
    ("judge: PAID with an unknown tier is accepted", '''        if tier == "":
            raise gl.vm.UserError(L + "PAID without a tier of this license")''', '''        if False:
            raise gl.vm.UserError(L + "PAID without a tier of this license")'''),
    ("judge: the reason is not capped", 'reason = " ".join(str(parsed.get("reason") or "").split())[:MAX_REASON]', 'reason = " ".join(str(parsed.get("reason") or "").split())'),
    ("judge: a FREE answer issues no receipt", "            self._issue(r, w, BY_JUDGE, 0, now)", "            pass"),
    ("judge: denied answers keep their conditions", '''    if verdict in (DENIED, UNCLEAR):
        conditions = ""''', '''    if False:
        conditions = ""'''),
]

EXCLUDED = [
    "tests/test_static.py::test_generated_files_are_what_the_generator_writes",
    "tests/test_static.py::test_no_private_key_in_the_repository",
]


def first_failure(output: str) -> str | None:
    for line in output.splitlines():
        match = re.match(r"FAILED (\S+)", line.strip())
        if match:
            return match.group(1).split(" - ")[0]
    return None


def main() -> int:
    source = CONTRACT.read_text(encoding="utf-8")
    rows: list[tuple[int, str, str]] = []
    escapes: list[str] = []
    with tempfile.TemporaryDirectory() as folder:
        mutant = pathlib.Path(folder) / "clearance.py"
        for index, (what, old, new) in enumerate(MUTANTS, 1):
            count = source.count(old)
            if count != 1:
                raise SystemExit(f"mutant {index} ({what}) matches {count} places; it must match exactly one")
            mutant.write_text(source.replace(old, new), encoding="utf-8")
            env = dict(os.environ, CLEARANCE_CONTRACT=str(mutant))
            command = [
                sys.executable, "-m", "pytest", "tests/test_direct.py", "tests/test_static.py",
                "-x", "-q", "--tb=no", "-rf", "-p", "no:cacheprovider",
            ] + [arg for test in EXCLUDED for arg in ("--deselect", test)]
            result = subprocess.run(command, cwd=ROOT, env=env, capture_output=True, text=True, encoding="utf-8")
            killer = first_failure(result.stdout)
            if result.returncode == 0 or killer is None:
                escapes.append(what)
                print(f"  {index:2} ESCAPED  {what}")
            else:
                rows.append((index, what, killer))
                print(f"  {index:2} killed   {what}  <- {killer}")
    if escapes:
        print(f"\n{len(escapes)} mutant(s) escaped; no table written:")
        for what in escapes:
            print(f"  - {what}")
        return 1
    if "--table" in sys.argv:
        target = ROOT / sys.argv[sys.argv.index("--table") + 1]
        lines = [
            "# Mutations",
            "",
            f"Written by `python scripts/mutate.py --table docs/MUTATIONS.md`. {len(rows)} defences in",
            "`contracts/clearance.py` were each broken on their own, and every mutant was caught. Each row",
            "names the first test that failed against it, read from pytest's report rather than an exit code.",
            "The generated-files test is excluded, because it fails for any edit at all.",
            "",
            "One check is deliberately not mutated: the validator's test that the leader's payload is a dict",
            "with a verdict from the closed set. The verdict-and-tier comparison right below it already",
            "refuses anything else, so no test can tell the two apart; it stays so the validator never",
            "depends on how the runtime treats an exception raised inside it. A first run listed it as an",
            "escape, together with two real gaps (an unreadable verdict defaulting to FREE, and PAID with an",
            "unknown tier), which the tests then closed by asserting the round is a disagreement, not a refusal.",
            "",
            "| # | defence broken | caught by |",
            "|---|---|---|",
        ] + [f"| {i} | {what} | `{killer}` |" for i, what, killer in rows]
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
        print(f"\nwrote {target.relative_to(ROOT).as_posix()}")
    print(f"\n{len(rows)} of {len(MUTANTS)} killed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
