// Receipt check for platforms: does receipt RC-n exist, who holds it, and what exactly does it cover?
//   node examples/check-receipt.mjs RC-0002 0xHolderAddress
import { createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";

const CLEARANCE = "0x0336dB3c42C1ee09504664d7eCa63ae90A606bDf";
const chain = { ...studioDevnet, rpcUrls: { default: { http: ["https://studio-next.genlayer.com/api"] } } };
const client = createClient({ chain });

async function view(functionName, args) {
  return JSON.parse(await client.readContract({ address: CLEARANCE, functionName, args }));
}

export async function checkReceipt(receipt, holder) {
  const id = Number(String(receipt).replace(/^rc-?0*/i, ""));
  const r = await view("get_request", [id]);
  if (!r.found || !r.receipt) return { valid: false, why: "no receipt with this number" };
  if (holder && r.holder.toLowerCase() !== holder.toLowerCase()) return { valid: false, why: "held by another account" };
  // The license text the receipt was issued under, and its hash, for the record.
  const license = await view("get_license", [r.work_id, r.version]);
  return {
    valid: true,
    work: r.title,
    holder: r.holder,
    use: r.use, // the receipt covers this sentence and nothing larger
    answer: r.decision || r.verdict,
    tier: r.offer_tier || r.tier,
    conditions: r.conditions,
    paid: r.paid,
    version: r.version,
    digest: license.digest,
    by: r.receipt_kind, // JUDGE or CREATOR
  };
}

console.log(await checkReceipt(process.argv[2] ?? "RC-0001", process.argv[3]));
