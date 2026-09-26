# Clearance

**Plain-language licenses that answer for themselves.** A creator writes their terms once in plain words and prices
up to four uses. Anyone describes how they want to use the work and asks. GenLayer validators read the license against
the use and answer **FREE**, **PAID** with a tier, **DENIED** or **UNCLEAR**. A free yes issues a receipt at once, a
paid yes is bought on the spot, unclear ones go to the creator, and every receipt is pinned to the exact license
version it was issued under.

- **Site:** https://clearance-genlayer.vercel.app
- **Docs:** https://clearance-genlayer.vercel.app/docs
- **Contract:** [`0x0336dB3c42C1ee09504664d7eCa63ae90A606bDf`](https://explorer-studio-dev.genlayer.com/address/0x0336dB3c42C1ee09504664d7eCa63ae90A606bDf) on GenLayer **Studio Next** (chain 61997)
- **Deploy transaction:** [`0xc0065821…4cd28`](https://explorer-studio-dev.genlayer.com/tx/0xc0065821db56ec5029c3c46c00669d3766fecc1c3c0017a0d567853f24e4cd28), source sha256 `3e7ef432f2391f49c99b8d8ae4d107de8798f9ca30902c5ecac3fb10149d872a`

Clearance applies the creator's own words. It is not legal advice, it does not decide what copyright law allows, and
it cannot prove who made a work. Every receipt says so.

## Results, read from the chain

| | |
|---|---|
| Golden cases through real consensus | **9 of 9** matched ([eval/results.md](eval/results.md)) |
| Held-out cases, run once | **2 of 3** matched. H1, a newspaper's election explainer under a "no political use" license, came back DENIED where UNCLEAR was expected. Published as it came out. |
| Golden set locked | sha256 `c4ea4f69…af7c`, 2026-09-26T01:07:37Z, before the first run ([eval/golden.lock.json](eval/golden.lock.json)) |
| Demo seed | 5 works, 17 requests (FREE 5, PAID 5, DENIED 5, UNCLEAR 2), 6 purchases, 4 creator answers, 1 amended license, 1 withdrawal, no failed step ([docs/seed.studio-next.md](docs/seed.studio-next.md)) |
| Withdrawal after finality | owed 130 GEN; the creator's wallet went from 999.999921361499997177 to 1129.999795056249994354 GEN, 130 GEN less the transaction's fee |
| Tests | 143 passed offline, 4 live-network tests gated by `CLEARANCE_INTEGRATION=1` (all 4 pass) |
| Mutations | 38 of 38 defences broken one at a time, each caught by a named test ([docs/MUTATIONS.md](docs/MUTATIONS.md)) |
| Deployed bytes | identical to `contracts/clearance.py`, lint clean on the bytes read back (`python scripts/verify.py`) |

The seed's works and creators are fictional ([docs/seed.md](docs/seed.md)); their answers are real transactions.

## How it works

| Method | Kind | What it does |
|---|---|---|
| `publish_work(title, link, license, tiers_json)` | write | Creates a work with license version 1 and up to four tiers |
| `amend_license(work_id, license, tiers_json)` | write | Creator only; adds a version, older receipts keep theirs |
| `ask(work_id, use)` | write, nondet | Stores the request and judges it in the same transaction |
| `buy(request_id)` | payable | The requester pays the stored price of a PAID answer within seven days; issues the receipt |
| `answer(request_id, decision, tier_id)` | write | Creator answers an UNCLEAR request or grants an exception to a DENIED one |
| `withdraw()` | write, pays | The only payout: a top-level transfer of the caller's creator balance |
| `get_work`, `get_license`, `get_request`, `list_requests`, `list_works` | views | JSON; unknown ids read as `{"found": false}` |

- **The judge** is section 3 of the spec, word for word. The license, tiers and use are fenced (`<` and `>` become `(`
  and `)`) at the prompt boundary; storage keeps what was written.
- **Validators compare the verdict and, for PAID, the tier id.** Conditions and the reason are the leader's, for
  display only. An unreadable answer is retried once and then fails the round; nothing defaults to a verdict.
- **The judge never moves money.** `buy` only receives value; `withdraw` is the only payout, sent at the root of its
  own transaction with an External fee allocation for the caller.
- **Time** is `gl.message.raw["datetime"]`, so the seven-day price hold is identical on every validator and enforced
  by the contract, never by the model.
- **Versions are never overwritten**, and each carries a SHA3-256 digest of the license and its tiers.

## Repository

```
contracts/clearance.py        the contract; FROZEN.json records what was deployed
tests/                        direct tests with a per-node test double, static tests, gated live tests
eval/                         golden.json (locked), run_golden.py, results.json / results.md
scripts/                      chain.py, deploy.py, verify.py, seed.py, mutate.py, gen_docs.py
docs/                         seed record, mutation table, logs, the brand mark
web/                          Next.js site and Fumadocs docs; lib/genlayer-core.mjs is the one write path
web/scripts/send-as.mjs       one write through the site's signing code, from a test account
web/scripts/reviewer-path.mjs the reviewer's whole path from fresh accounts, to finality
submission/                   portal text, X post, silent demo script, 512 px logo
```

## Run it

```bash
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt   # genlayer-py 0.19.0rc2
.venv/Scripts/python -m pytest                    # offline: 143 tests
CLEARANCE_INTEGRATION=1 .venv/Scripts/python -m pytest tests/test_integration.py
.venv/Scripts/python scripts/verify.py            # the deployed bytes are this file
.venv/Scripts/python scripts/mutate.py            # every defence, broken one at a time
.venv/Scripts/python scripts/gen_docs.py --check  # docs pages generated from the contract are current
cd web && npm install && npm run dev              # http://localhost:3210
```

Test keys live in `~/.clearance/accounts.json`, outside the repository, and scripts print only addresses.

## Rules this build follows

Built from the Clearance build spec and the rulebook "Rules for an Intelligent Contract", parts one and two. The
ones that shaped the code: one coarse label across consensus with no tolerance (rules 01 to 03); every write bound to
an address and classified by a static test (05, 06); provenance on every row (07); the fence at the prompt boundary,
counted by delimiter (09, 10); the deployed bytes diffed and linted (15); every defence mutated (17); per-node worlds
in the test double (18); generated docs with a `--check` (20); the runtime pinned and validated with
`gen_getContractSchemaForCode` before deploy (21); success is ACCEPTED **and** a returned execution (22); the RPC
treated as a budget, with cached reads dropped after each write (28); addresses checksummed before the faucet (30);
every number read back before it was written (31); the reviewer's path walked from fresh accounts to finality (32);
every attempt persisted before it was printed (33); and the score published as it came (34).

## Limits

No ask fee against spam (a refund would move money inside judging). A creator's priced answer uses a tier of the
current license. The judge can miss, as H1 shows. Studio Next is a test network. See
[Limitations](https://clearance-genlayer.vercel.app/docs/more/limitations).
