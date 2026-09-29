# Portal entry

Every field below was counted by code; the limits are the portal's.

## Name

Clearance

_9 characters_

## Category

Consumer app

_12 characters_

## Tags

Licensing, Creators

_19 characters_

## One-liner

Plain-language licenses that answer for themselves: ask whether a use is allowed, GenLayer validators read the creator's terms and answer, and every yes becomes a receipt.

_171 characters_

## Description

Clearance is a plain-language licensing desk on GenLayer. A creator publishes a work with terms written in their own words and up to four priced tiers. Anyone describes how they want to use the work, and validators read the terms against the use and answer FREE, PAID with a tier, DENIED or UNCLEAR. A free yes issues a receipt at once, a paid yes is bought on the spot, unclear ones go to the creator, and every receipt is pinned to the exact license version and its hash. Validators compare only the verdict and the tier; the judge never moves money, and withdraw is the only payout. Deployed on Studio Next: twelve golden cases ran through real consensus and are published as they came out, 9 of 9 and 2 of 3 held out. The site and docs are live, and the reviewer's path was walked from fresh accounts to finality.

_817 characters of 1000_

## Logo

`submission/clearance-icon-512.png`, 512 × 512, the site's mark on the dark ground; everything that matters sits inside the central circle, so a circular crop keeps it whole.

## Path steps

1. **Open a work**: Go to https://useclearance.vercel.app/explore and open a work, for example Fox in the Reeds. Read its license and tiers; no wallet is needed to read.
2. **Get set up**: In Ask about a use, press Ask the license. The site walks you through Connect wallet, Switch network (it adds Studio Next, chain 61997) and Get test GEN.
3. **Ask about a use**: Describe a use, for example: Thumbnail for a monetised YouTube video about wetland birds on my channel. Press Ask the license and sign. While validators read, the transaction link shows; the answer lands in under a minute.
4. **Buy the tier**: On a PAID answer press Buy the commercial tier, 40 GEN and sign. Then press Get receipt.
5. **Check the receipt**: The receipt shows the use word for word, the answer and reason, the license version and its hash, and the Asked and Bought transactions. Press Verify on explorer.
6. **Be the creator**: Press Publish a work, write a short license with one tier and press Sign and publish. From another wallet, ask about a use the license is silent on; an UNCLEAR answer waits in /studio, where the creator answers it with Yes, free, No, or Offer at this price. Press Withdraw once a tier is bought.

## Proof

Contract https://explorer-studio-dev.genlayer.com/address/0x0336dB3c42C1ee09504664d7eCa63ae90A606bDf (Studio Next, chain 61997); deployed bytes identical to contracts/clearance.py. Golden cases with every transaction: https://useclearance.vercel.app/docs/more/evaluation (9/9, held out 2/3; the H1 miss is published). Reviewer path from fresh accounts on the live site: ask https://explorer-studio-dev.genlayer.com/tx/0xec83dc6acc03d4b4ef18edc1232631205f31ac9d12dc95b9dfe3b6acb1a5c17b , buy https://explorer-studio-dev.genlayer.com/tx/0x80686bc6b502a1aadff6202c9fcef77209483a6a2ae4dcfda9f0fa04df4cc6b5 , creator answer https://explorer-studio-dev.genlayer.com/tx/0x4837772899bc02aa0a78b5fce62f870e8f0ad7b726f2447cb5776247d717cccc , withdraw https://explorer-studio-dev.genlayer.com/tx/0xa4b2a497e014e8ab1e2463b3acf2454fca043f013cbcc245faa1f4ea0cc630c2 ; balances reconciled to the wei after finality. A creator's priced exception on a second license version: https://useclearance.vercel.app/r/RC-0017

_1024 characters_

## Steward note

Clearance applies the creator's own words, not copyright law, and cannot prove authorship; every receipt says so. The judge can miss: held-out H1 came back DENIED where UNCLEAR was expected, and it is published as it came. The five seeded works are fictional demo works; their answers are real. Seeded works have old answers, so publish your own work to see the full loop. No ask fee against spam yet.

_401 characters of 500_
