# Seed run on Studio Next

Written by `python scripts/seed.py` from `docs/seed.studio-next.json`. Every verdict below came from the deployed
judge through real consensus and was read back from the contract. The works are demo works written for the seed;
the creators are fictional and each work links to [docs/seed.md](seed.md), which says so.

Contract `0x0336dB3c42C1ee09504664d7eCa63ae90A606bDf`. Verdicts: FREE 5, PAID 5, DENIED 5, UNCLEAR 2.

| Step | Method | From | Outcome | Transaction |
|---|---|---|---|---|
| publish-fox | `publish_work` | seed_nara | ok | [0x0662a45b…](https://explorer-studio-dev.genlayer.com/tx/0x0662a45bb1d07639c4cabe4752de2adf88c1798eada7d804537c42095f712e7f) |
| publish-dune | `publish_work` | seed_sami | ok | [0xdc66e649…](https://explorer-studio-dev.genlayer.com/tx/0xdc66e649c833c5914b58ab0589c46d497de15a3aea76234d249c046fc2457a2f) |
| publish-tidepool | `publish_work` | seed_ilse | ok | [0x4963d672…](https://explorer-studio-dev.genlayer.com/tx/0x4963d672759a625809e07bbbd0ca57fa5681b48ea9f1a97dfce0a89ec31c7a68) |
| publish-kestrel | `publish_work` | seed_oren | ok | [0xa2bdbfef…](https://explorer-studio-dev.genlayer.com/tx/0xa2bdbfefa8ec9c4d0c9035be9e7aa56973698128d7847f1c9fece75968a284b8) |
| publish-harbor | `publish_work` | seed_lena | ok | [0xfa1ea9ed…](https://explorer-studio-dev.genlayer.com/tx/0xfa1ea9ede7ed4678fd0f3e167e0f98f104f77616628da7c799e04dbe2682dd1b) |
| ask-fox-thumbnail | `ask` | seed_alice | PAID commercial | [0x25aa686c…](https://explorer-studio-dev.genlayer.com/tx/0x25aa686c48bc6ce2fc4eba5ee342c8ebd94cd8d2cf0c0be5ba9357fec212815d) |
| ask-fox-shirts | `ask` | seed_bob | PAID merch | [0xa512bcec…](https://explorer-studio-dev.genlayer.com/tx/0xa512bcec663f94c4cc1ce520588fd79db24f6cfe8f1299237ee8cef59b9742e6) |
| ask-fox-wallpaper | `ask` | seed_carol | FREE | [0x218415f7…](https://explorer-studio-dev.genlayer.com/tx/0x218415f7057beba812981d7c15e5f5cd0bf86e02bd23468afefd4898abb4a179) |
| ask-fox-training | `ask` | seed_bob | DENIED | [0x654be13f…](https://explorer-studio-dev.genlayer.com/tx/0x654be13fbd8dab5ebba443fcb7c25de92a77e578f6e80c0d56cda0f89e88e982) |
| ask-fox-mugs | `ask` | seed_alice | DENIED | [0x53851f19…](https://explorer-studio-dev.genlayer.com/tx/0x53851f19e4f94761fdb0f053715a0a66e1cc09b29807cf36c75ba54c0d189933) |
| ask-dune-laptop | `ask` | seed_carol | FREE | [0x1058c678…](https://explorer-studio-dev.genlayer.com/tx/0x1058c678bd1a05946c6111f10ee5a6ac29f26cad8eca8fb1ca1e40191209e862) |
| ask-dune-news | `ask` | seed_alice | FREE | [0xab43b023…](https://explorer-studio-dev.genlayer.com/tx/0xab43b023fd5fa8b9141154d6a12340a14b7d721443e11c452021a308e691383d) |
| ask-dune-ad | `ask` | seed_bob | PAID commercial | [0xfc66ec42…](https://explorer-studio-dev.genlayer.com/tx/0xfc66ec42715469600e8a93c7601db35d705740e6a5964b58828d8fc9eb9ac28e) |
| ask-tidepool-stream | `ask` | seed_carol | FREE | [0x9276279d…](https://explorer-studio-dev.genlayer.com/tx/0x9276279d6bbfb857b68b234b18ca51115fd1691bffa127061ba18ac7ad183f63) |
| ask-tidepool-pack | `ask` | seed_bob | DENIED | [0xe071efc1…](https://explorer-studio-dev.genlayer.com/tx/0xe071efc129639a65dfbaef812988f8a4e229f15a1d42206f4a8c07ec345548b8) |
| ask-tidepool-training | `ask` | seed_alice | DENIED | [0x279d5318…](https://explorer-studio-dev.genlayer.com/tx/0x279d531809a49e5e867ead0c6057eec297423a2d83d7dccb63e7e064d8650a21) |
| ask-kestrel-campaign | `ask` | seed_carol | PAID commercial | [0x45a74cdc…](https://explorer-studio-dev.genlayer.com/tx/0x45a74cdcec8028b81fb33f61749da1927184254d5119e0c13cf682c93a0b10ac) |
| ask-kestrel-game | `ask` | seed_bob | PAID app | [0x7542f76e…](https://explorer-studio-dev.genlayer.com/tx/0x7542f76e0ec4fe916ab2607505a69a1dca0c685742fbf4196afac10243a6bbda) |
| ask-harbor-course | `ask` | seed_alice | FREE | [0x13c15d2e…](https://explorer-studio-dev.genlayer.com/tx/0x13c15d2ef8e081b475442e8b5842f607a4ac624e13e42b517751c0af75887afc) |
| ask-harbor-mirror | `ask` | seed_carol | DENIED | [0x07ef4746…](https://explorer-studio-dev.genlayer.com/tx/0x07ef4746cba04945daed907db347e4a8bc7f75ffa135e952a352af5670bc67c1) |
| buy-fox-thumbnail | `buy` | seed_alice | ok | [0x58c94c9b…](https://explorer-studio-dev.genlayer.com/tx/0x58c94c9b886a187adee9b7aee32df680c59a904d7bf33d8892811895b3c98258) |
| buy-fox-shirts | `buy` | seed_bob | ok | [0xd969105a…](https://explorer-studio-dev.genlayer.com/tx/0xd969105a698a03367e39ab3a4852edb1e89d273a6c61e7e76603dc6637118330) |
| buy-dune-ad | `buy` | seed_bob | ok | [0xbaf4ffa5…](https://explorer-studio-dev.genlayer.com/tx/0xbaf4ffa55678b650084784d29e08cd93793a9b133e67071ad237e44150776c1f) |
| buy-kestrel-campaign | `buy` | seed_carol | ok | [0x787b9545…](https://explorer-studio-dev.genlayer.com/tx/0x787b954567c6064656bc7334729eb766ca8426466ef007ef28c96f0d2ca2141c) |
| buy-kestrel-game | `buy` | seed_bob | ok | [0x9a4d0067…](https://explorer-studio-dev.genlayer.com/tx/0x9a4d0067516e51ffbeb5fee661ef3e3aae87c2832f04543deea29ef550f37fb1) |
| answer-harbor-mirror | `answer` | seed_lena | ok | [0x307de1e7…](https://explorer-studio-dev.genlayer.com/tx/0x307de1e72ac8bb7600ddb203c0ade246fa4e8e7b66d8b8e7adc9046d086b6c41) |
| withdraw-nara | `withdraw` | seed_nara | ok | [0x3a18d0b4…](https://explorer-studio-dev.genlayer.com/tx/0x3a18d0b471733b551ca2ce6bee49f70d8dbd4ce6bb10aa39095dbc15a411b53d) |
| ask-tidepool-cafe | `ask` | seed_alice | UNCLEAR | [0x12c226ed…](https://explorer-studio-dev.genlayer.com/tx/0x12c226eddb757b7ccae360235cf7233a682db770bce437ee517469ba46ee1990) |
| ask-harbor-app | `ask` | seed_bob | UNCLEAR | [0xac3fdc6a…](https://explorer-studio-dev.genlayer.com/tx/0xac3fdc6a9a70d585ca6ccd6ae3f3e50b756fdef46b5120802936664a5ea7ea42) |
| amend-fox | `amend_license` | seed_nara | ok | [0xad9ae702…](https://explorer-studio-dev.genlayer.com/tx/0xad9ae70240527c05e39bae008ab898a93eb56a982b0b6a31246b8dbb3a96cc92) |
| answer-fox-mugs | `answer` | seed_nara | ok | [0x5dc43596…](https://explorer-studio-dev.genlayer.com/tx/0x5dc43596f187ec478c25c4e25b4b8343070e0e0b8b1def52eef81bc515e2e700) |
| buy-fox-mugs | `buy` | seed_alice | ok | [0x1de6954b…](https://explorer-studio-dev.genlayer.com/tx/0x1de6954be671538e39b1cc09c8c2b5ad23e63b44beeed30e9ca0fc72c161f9ad) |
| answer-tidepool-cafe | `answer` | seed_ilse | ok | [0x019b9ba8…](https://explorer-studio-dev.genlayer.com/tx/0x019b9ba80e09dda617ce11f0930fad06c88a1c4c4a834086cec696cd9123510c) |
| answer-harbor-app | `answer` | seed_lena | ok | [0xb459589d…](https://explorer-studio-dev.genlayer.com/tx/0xb459589d96f06ee1b3bc61c5945c4da90a7b833ad2c898a0a8f5a62bbfd310f1) |
