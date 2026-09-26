# Golden cases, through real consensus

Contract [`0x0336dB3c42C1ee09504664d7eCa63ae90A606bDf`](https://explorer-studio-dev.genlayer.com/address/0x0336dB3c42C1ee09504664d7eCa63ae90A606bDf) on Studio Next (chain 61997). Every row is one `ask` transaction on the deployed contract, and the verdict is read back from the contract with `get_request`, not from the script's memory.

- Golden set: **9 of 9** matched.
- Held-out cases: **2 of 3** matched.
- `eval/golden.json` sha256 `c4ea4f6999849a1ba56f6dfd8e8502a46fd60e0a3b8f9d66dbffa21b7340af7c`, locked at 2026-09-26T01:07:37Z, before the first run.
- Judge prompt sha256 `1c65e31baa597219e73247d66ebe974d708455ea3e79442bb83d48386323e341`.

Nothing here was tuned. The prompt is the spec's, word for word, and no case was edited after the lock. H1 and H3 are borderline on purpose, so their results are reported as they came out.

| Case | Use | Expected | Got | Reason (the leader's, display only) | Transaction |
|---|---|---|---|---|---|
| 1 | A wallpaper on my own phone, for myself only. | FREE | FREE ✓ | License explicitly permits personal use (non-commercial, self-only) with credit. | [0x86dfb67f…](https://explorer-studio-dev.genlayer.com/tx/0x86dfb67f1750e947fcebd423fef0f28a919bcb2d1454711bb7805abc8e0eeba6) |
| 2 | Thumbnail for a monetised YouTube video about wetland birds on my channel. | PAID · commercial | PAID · commercial ✓ | A thumbnail for a monetised YouTube video is commercial use, and the license says monetised videos need the commercial tier. | [0xdd384bc0…](https://explorer-studio-dev.genlayer.com/tx/0xdd384bc016c3fdc121bdc1e1d0823c9680ad757d882bbc1cfd12325ba52a9ba3) |
| 3 | Fine-tune an open-source image model on this illustration so it can generate pictures in the same style. | DENIED | DENIED ✓ | The license explicitly prohibits using the work to fine-tune any machine learning model. | [0x2872a1d4…](https://explorer-studio-dev.genlayer.com/tx/0x2872a1d40270ee52b1658616a793434c50cd1997391aac9bb4d2844b90af254e) |
| 4 | A poster for a registered charity's bake sale, printed by the charity's volunteers and put up in the town library. | FREE | FREE ✓ | The license says registered non-profits and charities may use the work free for any of their own activities, and a charity's bake sale poster fits that. | [0x660d9e47…](https://explorer-studio-dev.genlayer.com/tx/0x660d9e470ccb200221f85c2ad76032d65311d39587a1188cfc8f0b321e1f1f1f) |
| 5 | Print the design on 200 T-shirts for my band's autumn tour, sold at our shows. | PAID · merch | PAID · merch ✓ | Printed merchandise requires the merch tier and 200 T‑shirts are within its 500‑unit limit. | [0xfd52a6e1…](https://explorer-studio-dev.genlayer.com/tx/0xfd52a6e1e08504aab30d9a768a094581faa2a3d1b81911c4036245093e626322) |
| 6 | Background art in a paid mobile game sold on the App Store. | DENIED | DENIED ✓ | The license explicitly prohibits use in anything that is sold or monetised, and a paid mobile game sold on the App Store falls directly under that prohibition. | [0x1c8bb0c6…](https://explorer-studio-dev.genlayer.com/tx/0x1c8bb0c609a2ae5405933f9f2441899d58dc6ddd3f83075998b83cf9b2a6167a) |
| 7 | The logo for my startup, a company that sells bike repair kits. | UNCLEAR | UNCLEAR ✓ | The license says personal use is free and commercial use requires contacting the creator to agree terms, but it provides no paid tier or definite permission for this commercial logo use. | [0x89e9eeb4…](https://explorer-studio-dev.genlayer.com/tx/0x89e9eeb4a986c9e895d8f58bb9597616f240a617017e23965d1968f98ac0fc57) |
| 8 | Header image for my personal blog. The artist said I need no credit. | FREE | FREE ✓ | The license allows any use, including a personal blog header image, as long as Juno Park is credited by name next to the work. | [0x04df2604…](https://explorer-studio-dev.genlayer.com/tx/0x04df26043576a0fb4a2da2266174e27839f7e83d7990b5c1dee389431aef5791) |
| 9 | A full-page print advert in a national magazine for our coffee brand. | DENIED | DENIED ✓ | The license explicitly states that print use of any kind is not offered, and no paid tier covers print use. | [0x0f326050…](https://explorer-studio-dev.genlayer.com/tx/0x0f326050dd44c1e99ef14278c63ecc4cd9f81ff627faa3b7068091629b0672f8) |
| H1 (held out) | Cover image for a newspaper's explainer on how the upcoming election works. | UNCLEAR | DENIED ✗ miss | The license prohibits use for political causes, which includes an election explainer. | [0xac4ae4cc…](https://explorer-studio-dev.genlayer.com/tx/0xac4ae4ccbfb211ff2f390e81676ce44491702b87be49b7dc14e47a433147f22f) |
| H2 (held out) | Stream overlay on my Twitch channel, which has 12,000 followers. | PAID · commercial | PAID · commercial ✓ | The user has 12,000 followers, which exceeds the 1,000-follower limit for free use and requires the commercial tier. | [0x4b28ba6c…](https://explorer-studio-dev.genlayer.com/tx/0x4b28ba6c306ca2e09f90cf84a35356ab9fb031256a58f8b8df85fa696fdc377a) |
| H3 (held out) | Slides for a paid online course I sell on my website. | UNCLEAR | UNCLEAR ✓ | The license only says 'Free for education' and does not clearly say whether a paid online course sold on a website counts as allowed educational use. | [0x1e8f0488…](https://explorer-studio-dev.genlayer.com/tx/0x1e8f048857b35815dc2e0c30b3eeced76dfa8744c700b9b2980ecd5f54639e01) |

## Every attempt

Every case produced a verdict on its first attempt; nothing was sent twice.

## The works the cases were published as

- case 1: work 1, published in [0x8da430e3…](https://explorer-studio-dev.genlayer.com/tx/0x8da430e349222416ed4c8067c5358831e561d3aca88054d7eb3fdc9e958d81e2)
- case 3: work 2, published in [0x3ef00e28…](https://explorer-studio-dev.genlayer.com/tx/0x3ef00e28c28b76256ce85ff8f8eab4077afe1ad3ddd42949096f1e02c0a42e1c)
- case 4: work 3, published in [0x02a02b17…](https://explorer-studio-dev.genlayer.com/tx/0x02a02b17e97528cef1b0cb2d7421aef265802d3c9e8a9420c753590051552c80)
- case 5: work 4, published in [0x216330af…](https://explorer-studio-dev.genlayer.com/tx/0x216330afef7e8ef52ce406b43170e8cdd0d9db1bf82252fd648c4207dde31675)
- case 6: work 5, published in [0x14389d39…](https://explorer-studio-dev.genlayer.com/tx/0x14389d392fcea817617a37240b12e7dc5d9c45ce1067fa0d5b5245320715d829)
- case 7: work 6, published in [0xfc208e04…](https://explorer-studio-dev.genlayer.com/tx/0xfc208e04a48c60d62320af6fb938458f89d1e285a5da13835792e2608b0020c7)
- case 8: work 7, published in [0xc86abdde…](https://explorer-studio-dev.genlayer.com/tx/0xc86abdde474e971cb9118f4e91374f47760981519bd74f224fef219bf29dea9a)
- case 9: work 8, published in [0x7ddf9c4f…](https://explorer-studio-dev.genlayer.com/tx/0x7ddf9c4fcef3f47e07240d8b3dfe12f71ab24dc143e57d22eaadd534ae640de7)
- case H1: work 9, published in [0x7ee17413…](https://explorer-studio-dev.genlayer.com/tx/0x7ee174137c5d1e0d67c72d705f5b1ffbcff09be53623e79ad230344f48f69def)
- case H2: work 10, published in [0x8f092191…](https://explorer-studio-dev.genlayer.com/tx/0x8f09219129e99c6f5f144bfc1b590d417d43daf2efc6c776caf7e118d5c8216a)
- case H3: work 11, published in [0x250cdf77…](https://explorer-studio-dev.genlayer.com/tx/0x250cdf7792c4e256121c07ceb607feab721c4c22382962d09fd64419d348a55c)
