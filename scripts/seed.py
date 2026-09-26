#!/usr/bin/env python3
"""
Seed the deployed contract with demo works and real requests, and keep the record.

    python scripts/seed.py            # run every step not yet done
    python scripts/seed.py --report   # rewrite docs/seed.studio-next.md from the record

Five works with five license styles, published by five creator accounts, then
seventeen requests from three requester accounts across all four answers (the
last two were added after the first pass came back with no UNCLEAR). Every
verdict comes from the deployed judge through real consensus; nothing here
decides one. After each ask the script reads the verdict back and acts on what
the judge said: a PAID answer is bought, one UNCLEAR request gets the creator's
priced answer after the license is amended to add a tier for it, one DENIED
request gets a creator's exception, and a creator withdraws.

The works are demo works written for this seed. The creators are fictional, and
each work links to docs/seed.md, which says so.

Every step is written to docs/seed.studio-next.json before anything is printed,
so a crash never loses a transaction that exists on chain, and a rerun resumes
where the last one stopped. Accounts live in ~/.clearance/accounts.json; only
addresses are printed.
"""

from __future__ import annotations

import datetime
import json
import pathlib
import sys

import chain as C

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RECORD = C.ROOT / "docs" / "seed.studio-next.json"
LINK = "https://github.com/meitipro1/clearance/blob/main/docs/seed.md"

WORKS = [
    {
        "key": "fox",
        "creator_account": "seed_nara",
        "title": "Fox in the Reeds",
        "anchor": "fox-in-the-reeds",
        "terms": {"creator": "Nara Ito", "kind": "illustration"},
        "license": (
            "Free for personal use, with credit to Nara Ito. Any commercial use, including monetised videos and client "
            "work, needs the commercial tier. Printed merch needs the merch tier, up to 500 units, larger runs by "
            "request. No AI training, in any form."
        ),
        "tiers": [
            {"id": "commercial", "name": "Commercial", "scope": "Commercial use online, videos, client work", "price": "40"},
            {"id": "merch", "name": "Merch", "scope": "Printed goods up to 500 units", "price": "90"},
        ],
    },
    {
        "key": "dune",
        "creator_account": "seed_sami",
        "title": "Dune Sketches",
        "anchor": "dune-sketches",
        "terms": {"creator": "Sami Rahal", "kind": "photo"},
        "license": (
            "Free for any non-commercial use, including wallpapers, school projects and personal blogs, with credit to "
            "Sami Rahal. News and editorial use is also free with credit. Advertising and any other commercial use "
            "needs the commercial tier."
        ),
        "tiers": [
            {"id": "commercial", "name": "Commercial", "scope": "Advertising, product pages and other commercial use", "price": "25"},
        ],
    },
    {
        "key": "tidepool",
        "creator_account": "seed_ilse",
        "title": "Tidepool Loops",
        "anchor": "tidepool-loops",
        "terms": {"creator": "Ilse Varga", "kind": "music"},
        "license": (
            "Free to use in your own videos, podcasts and streams, monetised or not, with credit in the description. "
            "You may not resell the loops themselves or put them in a sample pack. No AI training. Ads, films and games "
            "made for a paying client need the sync tier."
        ),
        "tiers": [
            {"id": "sync", "name": "Sync", "scope": "Ads, films and games made for a paying client", "price": "60"},
        ],
    },
    {
        "key": "kestrel",
        "creator_account": "seed_oren",
        "title": "Kestrel Type",
        "anchor": "kestrel-type",
        "terms": {"creator": "Oren Dahl", "kind": "font"},
        "license": (
            "Free for personal projects. Commercial web and print use needs the commercial tier. Embedding the font "
            "files in an app or a game needs the app tier."
        ),
        "tiers": [
            {"id": "commercial", "name": "Commercial", "scope": "Commercial web and print use by one business", "price": "30"},
            {"id": "app", "name": "App", "scope": "Embedding the font files in one app or game", "price": "80"},
        ],
    },
    {
        "key": "harbor",
        "creator_account": "seed_lena",
        "title": "Harbor Transit Dataset",
        "anchor": "harbor-transit-dataset",
        "terms": {"creator": "Lena Okafor", "kind": "dataset"},
        "license": (
            "Free for research and teaching, with a citation. Commercial analytics needs the commercial tier. "
            "Redistributing the raw files is not allowed in any form."
        ),
        "tiers": [
            {"id": "commercial", "name": "Commercial", "scope": "Commercial analytics and reports for one organisation", "price": "150"},
        ],
    },
]

#: (step key, work key, requester, use). What happens next depends on the verdict read back.
ASKS = [
    ("fox-thumbnail", "fox", "seed_alice", "Thumbnail for a monetised YouTube video about wetland birds on my channel."),
    ("fox-shirts", "fox", "seed_bob", "Print the fox on 200 T-shirts for my band's autumn tour, sold at our shows."),
    ("fox-wallpaper", "fox", "seed_carol", "Wallpaper on my own phone, for myself only."),
    ("fox-training", "fox", "seed_bob", "Train a style model on the fox so it can draw new pictures in the same style."),
    ("fox-mugs", "fox", "seed_alice", "2,000 printed mugs with the fox for a cafe chain's holiday campaign."),
    ("dune-laptop", "dune", "seed_carol", "Wallpaper on my laptop, with credit to Sami Rahal."),
    ("dune-news", "dune", "seed_alice", "Photo for a local newspaper's story about the dunes, credited to Sami Rahal."),
    ("dune-ad", "dune", "seed_bob", "Background of a paid Instagram ad for our surf shop."),
    ("tidepool-stream", "tidepool", "seed_carol", "Background music for my monetised Twitch streams, credited in the description."),
    ("tidepool-pack", "tidepool", "seed_bob", "Put the loops in a sample pack that I sell on my website."),
    ("tidepool-training", "tidepool", "seed_alice", "Train a music generation model on the loops."),
    ("kestrel-campaign", "kestrel", "seed_carol", "Headline font on the posters for a city council candidate's election campaign."),
    ("kestrel-game", "kestrel", "seed_bob", "Embed the font files in my indie mobile game, sold on the app stores."),
    ("harbor-course", "harbor", "seed_alice", "Use the dataset in a university course on urban planning, cited in the slides."),
    ("harbor-mirror", "harbor", "seed_carol", "Publish a full mirror of the raw files on my own website."),
    # Added after the first pass returned no UNCLEAR: two uses these licenses are silent on.
    ("tidepool-cafe", "tidepool", "seed_alice", "Play the loops as background music in my cafe during opening hours."),
    ("harbor-app", "harbor", "seed_bob", "Build a free public app that shows our town's bus arrivals, using the dataset."),
]

#: How each creator answers a request that reached them, by step key. Anything
#: not listed is answered FREE.
CREATOR_ANSWERS = {"harbor-app": "DENIED", "kestrel-campaign": "DENIED"}

CREATORS = [w["creator_account"] for w in WORKS]
REQUESTERS = ["seed_alice", "seed_bob", "seed_carol"]


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load() -> dict:
    if RECORD.exists():
        return json.loads(RECORD.read_text(encoding="utf-8"))
    return {"contract": C.address(), "network": C.NETWORK, "explorer": C.EXPLORER, "accounts": {}, "steps": []}


def save(record: dict) -> None:
    RECORD.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def done(record: dict, key: str) -> dict | None:
    for step in record["steps"]:
        if step["key"] == key and step.get("ok"):
            return step
    return None


def step(record: dict, key: str, chain: C.Chain, method: str, args: list, value: int = 0, **extra) -> dict:
    """One write, recorded before it is printed. Returns the stored step."""
    prior = done(record, key)
    if prior:
        return prior
    outcome = chain.send(C.address(), method, args, value)
    row = {
        "key": key,
        "method": method,
        "from": chain.account.address,
        "args": args,
        "value": str(value),
        "tx": outcome["hash"],
        "ok": outcome["ok"],
        "status": outcome.get("status", ""),
        "refusal": outcome.get("refusal", ""),
        "returned": outcome.get("result"),
        "at": now_iso(),
        **extra,
    }
    record["steps"].append(row)
    save(record)
    print(f"  {key}: {method} {'ok' if row['ok'] else 'NOT OK ' + str(outcome.get('detail'))}  {C.EXPLORER}/tx/{row['tx']}")
    return row


def main() -> int:
    record = load()
    people = C.accounts(*CREATORS, *REQUESTERS)
    record["accounts"] = {name: account.address for name, account in people.items()}
    save(record)
    chains = {name: C.Chain(account) for name, account in people.items()}
    for name, account in people.items():
        chains[name].ensure(account.address, minimum_gen=150, top_up_gen=1000)

    work_ids: dict[str, int] = record.setdefault("work_ids", {})
    for w in WORKS:
        terms = dict(w["terms"], tiers=w["tiers"])
        row = step(record, "publish-" + w["key"], chains[w["creator_account"]], "publish_work",
                   [w["title"], LINK + "#" + w["anchor"], w["license"], json.dumps(terms)])
        if not row["ok"]:
            raise SystemExit(f"publish {w['key']} failed: {row['refusal']}")
        work_ids[w["key"]] = int(row["returned"])
        save(record)

    requests: dict[str, dict] = record.setdefault("requests", {})
    for key, work_key, who, use in ASKS:
        row = step(record, "ask-" + key, chains[who], "ask", [work_ids[work_key], use], requester=who, work=work_key)
        if not row["ok"]:
            print(f"  {key}: the round produced no verdict ({row['refusal'] or row['status']}); rerun to try again")
            continue
        rid = int(row["returned"])
        stored = chains[who].read_json(C.address(), "get_request", [rid])
        requests[key] = {"request_id": rid, "verdict": stored["verdict"], "tier": stored["tier"], "reason": stored["reason"],
                         "conditions": stored["conditions"], "price": stored["price"], "requester": who}
        save(record)
        print(f"    -> {stored['verdict']} {stored['tier']}  {stored['reason']}")

    # Every PAID answer is bought by its requester, at the stored price.
    for key, r in requests.items():
        if r["verdict"] == "PAID" and not done(record, "buy-" + key):
            step(record, "buy-" + key, chains[r["requester"]], "buy", [r["request_id"]], int(r["price"]), request=key)

    # The creator's word on the 2,000 mugs: whether the judge sent it to the creator
    # (UNCLEAR) or refused it (DENIED), Nara amends the license to add a tier for
    # large runs, then offers that tier, as an answer or as an exception.
    unclear = [k for k, r in requests.items() if r["verdict"] == "UNCLEAR"]
    fox_unclear = ["fox-mugs"] if requests.get("fox-mugs", {}).get("verdict") in ("UNCLEAR", "DENIED") else []
    if fox_unclear:
        key = fox_unclear[0]
        fox = WORKS[0]
        tiers_v2 = fox["tiers"] + [{"id": "large-run", "name": "Large run", "scope": "Printed goods over 500 units, up to 5,000", "price": "300"}]
        license_v2 = fox["license"].replace("larger runs by request", "larger runs need the large-run tier, up to 5,000 units")
        step(record, "amend-fox", chains[fox["creator_account"]], "amend_license", [work_ids["fox"], license_v2, json.dumps(tiers_v2)])
        answered = step(record, "answer-" + key, chains[fox["creator_account"]], "answer", [requests[key]["request_id"], "PAID", "large-run"], request=key)
        if answered["ok"]:
            fresh = chains[fox["creator_account"]].read_json(C.address(), "get_request", [requests[key]["request_id"]])
            step(record, "buy-" + key, chains[requests[key]["requester"]], "buy", [requests[key]["request_id"]], int(fresh["price"]), request=key)
    # Any other UNCLEAR request is answered no or free by its creator, so both kinds of answer are on chain.
    for key in unclear:
        if key in fox_unclear[:1]:
            continue
        work = next(w for w in WORKS if key.startswith(w["key"] + "-"))
        decision = CREATOR_ANSWERS.get(key, "FREE")
        step(record, "answer-" + key, chains[work["creator_account"]], "answer", [requests[key]["request_id"], decision, ""], request=key)
    # One exception to a DENIED answer: Harbor's creator lets a mirror go, free. Only if the judge denied it.
    if requests.get("harbor-mirror", {}).get("verdict") == "DENIED":
        step(record, "answer-harbor-mirror", chains["seed_lena"], "answer", [requests["harbor-mirror"]["request_id"], "FREE", ""], request="harbor-mirror")

    # Nara withdraws. The payout settles at finality, so the balance is read after it.
    nara = chains["seed_nara"]
    if not done(record, "withdraw-nara"):
        before = nara.balance(people["seed_nara"].address)
        owed = int(nara.read_json(C.address(), "get_work", [work_ids["fox"]])["balance"])
        row = step(record, "withdraw-nara", nara, "withdraw", [], balance_before=str(before), owed=str(owed))
        if row["ok"]:
            final = nara.wait(row["tx"], "finalized", retries=200)
            after = nara.balance(people["seed_nara"].address)
            row.update({"final_status": C.check(final)["status"], "balance_after_final": str(after)})
            save(record)
            print(f"  withdraw: owed {owed / C.GEN} GEN; wallet {before / C.GEN} -> {after / C.GEN} GEN after finality (fees paid from it)")

    record["finished_at"] = now_iso()
    save(record)
    report()
    return 0


def report() -> None:
    record = load()
    explorer = record.get("explorer", C.EXPLORER)
    counts: dict[str, int] = {}
    for r in record.get("requests", {}).values():
        counts[r["verdict"]] = counts.get(r["verdict"], 0) + 1
    lines = [
        "# Seed run on Studio Next",
        "",
        "Written by `python scripts/seed.py` from `docs/seed.studio-next.json`. Every verdict below came from the deployed",
        "judge through real consensus and was read back from the contract. The works are demo works written for the seed;",
        "the creators are fictional and each work links to [docs/seed.md](seed.md), which says so.",
        "",
        f"Contract `{record['contract']}`. Verdicts: "
        + ", ".join(f"{v} {counts.get(v, 0)}" for v in ("FREE", "PAID", "DENIED", "UNCLEAR"))
        + ".",
        "",
        "| Step | Method | From | Outcome | Transaction |",
        "|---|---|---|---|---|",
    ]
    names = {v: k for k, v in record.get("accounts", {}).items()}
    for s in record["steps"]:
        outcome = "ok" if s["ok"] else f"refused: {s['refusal']}"
        if s["method"] == "ask" and s["ok"]:
            r = record["requests"].get(s["key"][4:], {})
            outcome = f"{r.get('verdict', '')} {r.get('tier', '')}".strip()
        lines.append(f"| {s['key']} | `{s['method']}` | {names.get(s['from'], s['from'])} | {outcome} | [{s['tx'][:10]}…]({explorer}/tx/{s['tx']}) |")
    lines.append("")
    (C.ROOT / "docs" / "seed.studio-next.md").write_text("\n".join(lines), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    if "--report" in sys.argv:
        report()
    else:
        raise SystemExit(main())
