# Silent demo, about ninety seconds

No voice. Every screen already says what is happening; the consensus waits are cut short with the transaction link
left on screen. Two browser profiles: one wallet for the creator, one for the user, both on Studio Next with test GEN
from the site's faucet.

| Time | Screen | What the viewer sees |
|---|---|---|
| 0:00 | Landing `/` | "Can I use this? Ask the license." A live receipt read from the contract; the recent answers strip with a DENIED and a creator's answer. |
| 0:08 | Publish `/publish` (creator wallet) | A short license: personal use free with credit, commercial use needs the commercial tier, no AI training. One tier, Commercial, 40 GEN. The preview shows the judge prompt exactly as validators read it. Sign and publish. |
| 0:25 | Work page `/w/<id>` (user wallet) | The user asks: "Thumbnail for a monetised YouTube video about wetland birds on my channel." "Validators are reading the license" with the tx link, then **PAID · COMMERCIAL** with its reason. |
| 0:45 | Work page | "Buy the commercial tier, 40 GEN". Confirm. The answer card turns into "Get receipt". |
| 0:55 | Receipt `/r/RC-…` | The certificate: the use word for word, the answer and reason, 40 GEN, license v1 and its hash, Asked and Bought transactions. Click "Verify on explorer". |
| 1:05 | Work page | Two more asks: "Train an image model on it" comes back **DENIED**; "Project it at a free film night in the park" comes back **UNCLEAR**, "Sent to the creator". |
| 1:20 | Studio `/studio` (creator wallet) | The UNCLEAR request waits. The creator offers it at the Commercial price, then presses "Withdraw 40 GEN". The note says the transfer lands at finality. |

The seeded works already show every state for a still shot: Fox in the Reeds (`/w/12`) has a paid receipt, a free
one, a denial and a creator's priced exception on a second license version (`/r/RC-0017`).
