# The reviewer's path, walked on the live site

Run `rp1` against https://clearance-genlayer-sooty.vercel.app, contract `0x0336dB3c42C1ee09504664d7eCa63ae90A606bDf` on Studio Next. Two accounts made for the run, with nonce 0 and 0 at the start, so neither had touched the contract. Every write went through `web/lib/genlayer-core.mjs`, the code the browser runs, with a stand-in wallet (`web/scripts/standin-wallet.mjs`).

- Creator: [`0xD066B1D5e7f8Cd5BFe2d98402Eaf11408CB2C619`](https://explorer-studio-dev.genlayer.com/address/0xD066B1D5e7f8Cd5BFe2d98402Eaf11408CB2C619)
- User: [`0x43Be35a11C498Fd85Dcb957078f24544D9Af875D`](https://explorer-studio-dev.genlayer.com/address/0x43Be35a11C498Fd85Dcb957078f24544D9Af875D)

| Step | What happened | Transaction |
|---|---|---|
| faucet-creator | the site's `/api/faucet`, sent the address in lower case: HTTP 200, 0 GEN → 20 GEN |  |
| faucet-user | the site's `/api/faucet`, sent the address in lower case: HTTP 200, 0 GEN → 20 GEN |  |
| publish | `publish_work` accepted, returned 17, decided in 20 s | [0x72b1fb7d…](https://explorer-studio-dev.genlayer.com/tx/0x72b1fb7dd46dcebeaada7081a6ee54d2f6190224e824563d61226c02c2c80759) |
| ask-commercial | `ask` accepted, returned 30, decided in 14 s | [0xec83dc6a…](https://explorer-studio-dev.genlayer.com/tx/0xec83dc6acc03d4b4ef18edc1232631205f31ac9d12dc95b9dfe3b6acb1a5c17b) |
| read-commercial | read back: request 30 is PAID commercial. Reason: The proposed use is a hero image on a company website selling services, which is explicitly listed as requiring the commercial tier for commercial use online. |  |
| buy | `buy` accepted, returned 30, decided in 12 s, then FINALIZED | [0x80686bc6…](https://explorer-studio-dev.genlayer.com/tx/0x80686bc6b502a1aadff6202c9fcef77209483a6a2ae4dcfda9f0fa04df4cc6b5) |
| balance-buy | per-step check: 19.899999999999966118 GEN → 7.999841879749994354 GEN, difference 99920510750031059 wei from this transaction's fee alone. Other transactions' refunds settle in the same window, so the reconciliation below is the real check. |  |
| ask-silent | `ask` accepted, returned 31, decided in 17 s | [0x706ac1f9…](https://explorer-studio-dev.genlayer.com/tx/0x706ac1f9b0fe752aff415464b2e95b4aa71e167793297bedf2bb38500091d76a) |
| read-silent | read back: request 31 is FREE. Reason: A free neighborhood association film night is considered personal/non-commercial use, and the commercial tier specifically targets online business use. |  |
| withdraw | `withdraw` accepted, returned 12000000000000000000, decided in 17 s, then FINALIZED | [0xa4b2a497…](https://explorer-studio-dev.genlayer.com/tx/0xa4b2a497e014e8ab1e2463b3acf2454fca043f013cbcc245faa1f4ea0cc630c2) |
| balance-withdraw | per-step check: 19.999921362499997177 GEN → 31.999795056999994354 GEN, difference 25000000000000 wei from this transaction's fee alone. Other transactions' refunds settle in the same window, so the reconciliation below is the real check. |  |
| page-work | HTTP 200 at https://clearance-genlayer-sooty.vercel.app/w/17: shows what the chain holds |  |
| page-receipt-paid | HTTP 200 at https://clearance-genlayer-sooty.vercel.app/r/RC-0030: shows what the chain holds |  |
| page-receipt-silent | HTTP 200 at https://clearance-genlayer-sooty.vercel.app/r/RC-0031: shows what the chain holds |  |
| ask-silent-2 | `ask` accepted, returned 32, decided in 17 s | [0x303189c5…](https://explorer-studio-dev.genlayer.com/tx/0x303189c5ca1cc29810b1a4786e41f0523e98b63f2a00ef4ef12ee22800c0c3ff) |
| read-ask-silent-2 | read back: request 32 is UNCLEAR. Reason: The license mentions personal use and commercial use online only, but says nothing about commercial printed book covers, and no paid tier covers print use. |  |
| answer | `answer` accepted, returned 32, decided in 8 s | [0x48377728…](https://explorer-studio-dev.genlayer.com/tx/0x4837772899bc02aa0a78b5fce62f870e8f0ad7b726f2447cb5776247d717cccc) |
| read-answer | read back: request 32 is CLEARED, receipt by the creator |  |
| page-receipt-answered | HTTP 200 at https://clearance-genlayer-sooty.vercel.app/r/RC-0032: shows what the chain holds |  |

## Balances to the wei, once everything was final

Every write locks a fee deposit and refunds the unused part when it finalizes. After all of an account's transactions were FINALIZED with their fee accounting settled:

`balance = faucet paid in + value received - value sent - net fees`

| Account | Faucet | Received | Sent | Net fees | Expected | Balance | Result |
|---|---|---|---|---|---|---|---|
| creator | 20 GEN | 12 GEN | 0 GEN | 0.000308572750008469 GEN | 31.999691427249991531 GEN | 31.999716427249991531 GEN | exact to the wei once the 25000000000000 wei External message fee is left out (see below) |
| user | 20 GEN | 0 GEN | 12 GEN | 0.000317097000011292 GEN | 7.999682902999988708 GEN | 7.999682902999988708 GEN | exact to the wei |

**The one term that does not behave as written.** `withdraw` pays its caller through an External message, and its fee accounting lists `message_fee_consumed` of 25,000,000,000,000 wei (0.000025 GEN) inside `paid_fee_value - total_refunded`. The creator's wallet was not charged that amount: the balance is higher than the plain equation by exactly it. The seed's withdrawal shows the same thing (Nara's wallet cost was likewise 25,000,000,000,000 wei less than paid minus refunded). Where that budget goes is Studio Next's fee logic; this page records what the chain reported and what the wallet shows.

Reconciled 2026-09-26T11:26:37.655Z.
