// Ask whether a use is allowed, from code. The key comes from the environment.
//   PRIVATE_KEY=0x... node examples/ask.mjs 1 "Phone wallpaper for myself."
import { createAccount, createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";

const CLEARANCE = "0x0336dB3c42C1ee09504664d7eCa63ae90A606bDf";
const chain = { ...studioDevnet, rpcUrls: { default: { http: ["https://studio-next.genlayer.com/api"] } } };
const account = createAccount(process.env.PRIVATE_KEY);
const client = createClient({ chain, account });

const [workId, use] = [Number(process.argv[2]), process.argv[3]];

// Studio Next charges a fee deposit on every write; the SDK estimates it.
// ask() runs the judge, so it is allowed three rotations.
const estimate = await client.estimateTransactionFees({
  leaderTimeunitsAllocation: 600,
  validatorTimeunitsAllocation: 600,
  totalMessageFees: 0,
  rotations: [3],
});
const hash = await client.writeContract({
  address: CLEARANCE,
  functionName: "ask",
  args: [workId, use],
  value: 0n,
  fees: { distribution: estimate.distribution, feeValue: estimate.feeValue },
});
console.log("asked", hash);

const receipt = await client.waitForTransactionReceipt({ hash, waitUntil: "decided", interval: 4000, retries: 120 });
const leader = receipt.consensus_data.leader_receipt[0];
// ACCEPTED is not success: validators can agree that a refusal is right.
if (leader.execution_result !== "SUCCESS" || leader.result.status !== "return") {
  throw new Error(`refused: ${JSON.stringify(leader.result.payload)}`);
}
const requestId = Number(leader.result.payload.readable);
const answer = JSON.parse(await client.readContract({ address: CLEARANCE, functionName: "get_request", args: [requestId] }));
console.log(answer.verdict, answer.tier, answer.reason);
