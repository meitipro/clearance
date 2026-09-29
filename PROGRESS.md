# Progress

One line per step, in order, 2026-09-26. Every figure is read from a file in this repository or from the chain.

- Read the build spec and the rules (parts one and two); network is Studio Next (chain 61997), as the spec names it.
- `contracts/clearance.py`: the eleven methods, v0.3 header copied from the Keepalive Studio Next port, judge prompt word for word.
- genvm-lint clean (11 methods, 6 writes, 5 views); validated against the live runtime with `gen_getContractSchemaForCode`.
- `tests/test_direct.py` and `tests/test_static.py` with a per-node test double: 141 passed at first, 143 with the parity tests added later.
- `scripts/mutate.py`: 38 of 38 mutants killed after the first run exposed two weak tests (fixed) and one redundant check (documented).
- Deployed to Studio Next at `0x0336dB3c42C1ee09504664d7eCa63ae90A606bDf`; `scripts/verify.py` finds the deployed bytes identical.
- Golden set hashed and timestamped before the first run.
- Golden cases through real consensus: 9 of 9; held-out once: 2 of 3 (H1 answered DENIED, expected UNCLEAR). Published as they came out.
- Site: landing, work, receipt, studio, publish, explore, receipts; wallet gate; faucet and refresh routes; the write path shared with `web/scripts/send-as.mjs`.
- Refusal path proven live through the site's code: `withdraw` with nothing owed came back ACCEPTED with execution ERROR and the contract's sentence, and the site reports it as refused.
- /docs with Fumadocs: fifteen pages, generated contract reference, errors, judge prompt, evaluation and addresses; examples run against the live contract; link checker in the build.
- Seed pass 1: five works, fifteen requests, five purchases, a creator exception and a withdrawal (130 GEN owed, wallet up 130 GEN less the fee after finality). No UNCLEAR came back, and the mugs came back DENIED where the spec expected UNCLEAR.
- Seed pass 2: two requests where the licenses are silent (both came back UNCLEAR), the creators' answers (one FREE, one DENIED), and Fox in the Reeds amended to v2 with a large-run tier, offered to the mugs request as a priced exception and bought. Totals: 17 requests, FREE 5, PAID 5, DENIED 5, UNCLEAR 2; 6 purchases; 4 creator answers; no failed step.
- Pushed to https://github.com/meitipro1/clearance (public).
- Deployed to Vercel: https://clearance-genlayer-sooty.vercel.app (project `clearance-genlayer`); every main route answers 200.
- Reviewer path on the live site from two fresh accounts: faucet, publish, ask and buy, a FREE ask, an UNCLEAR ask with the creator's answer, withdraw, live pages. Balances reconciled after finality: the user exact to the wei; the creator exact once the External message fee the chain lists as consumed, but did not charge, is left out.
- Portal text, X post, demo script and logo in `submission/`, counted and every link opened.
- Moved the public home to https://github.com/meitipro/clearance (full history, unchanged); the first home, meitipro1/clearance, made private. Links recorded on chain by the seed and golden runs still name meitipro1, as sent.
- The site's production address is now https://useclearance.vercel.app; the first address, clearance-genlayer-sooty.vercel.app, redirects to it with the path kept. The test records keep the address they ran against.
