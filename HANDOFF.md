# Handoff

What only the owner of this repository can do, and what is already done for them.

## Needs you

- **Send the portal entry.** The texts are in `submission/portal.md`, counted to the limits, with the logo at
  `submission/clearance-icon-512.png`. Sending it is yours.
- **Post on X** if you want to: `submission/x-post.md`.
- **Record the silent demo** if the portal asks for a video: `submission/demo-script.md` has the ninety-second
  script. The site needs a browser wallet (MetaMask or similar) for the writing steps.

## Already done

- Contract deployed and frozen on Studio Next; do not redeploy or change `contracts/clearance.py` without deciding
  to, because `contracts/FROZEN.json` and `scripts/verify.py` hold the repository to the deployed bytes.
- Repository public at https://github.com/meitipro/clearance, site live at
  https://useclearance.vercel.app (Vercel project `clearance-genlayer` in team mahdighs-projects,
  linked by the CLI from `web/`; redeploy with `npx vercel deploy --prod --scope mahdighs-projects` in `web/`).
- Test accounts live in `~/.clearance/accounts.json` on the build machine only.
