# Tasks

The build order of section 11 of the spec. A fresh session can resume from this list and the repository alone.

- [x] 1. Contract and `tests/test_direct.py` covering every method and every rule in section 2, nondet mocked; lint and validate against the `5jycge4q` runtime
- [x] 2. Deploy to Studio Next with genlayer-py 0.19.0rc2 and the SDK fee estimate; record in `contracts/FROZEN.json`; `scripts/verify.py` clean
- [x] 3. `eval/`: nine golden cases through real consensus, held-out cases once, verdicts and hashes in `eval/results.md`, never tuned
- [x] 4. `web/`: landing, work, receipt, studio, publish, explore (and receipts), with genlayer-js 2.0.0-rc.1
- [x] 5. `/docs`: every page of section 7, built like official docs, plus `/llms.txt` and `/llms-full.txt`
- [x] 6. `scripts/seed.py`, README, and `submission/` (portal text, X post, silent demo script, 512 px logo), from real results
- [x] Public repository: https://github.com/meitipro/clearance
- [x] Site on Vercel: https://clearance-genlayer-sooty.vercel.app
- [x] The reviewer's path from fresh accounts, through the site's own signing code, on the deployed site, to finality (`docs/reviewer-path.studio-next.md`)

## Stretch goals, not started

- [ ] Verified creators through a file on the creator's domain
- [ ] Embeddable "Clear to use, ask here" badge
- [ ] Bundles: one license over a collection
