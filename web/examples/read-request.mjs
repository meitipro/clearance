// Read one request and its receipt state. No wallet and no key: views are free.
//   node examples/read-request.mjs 2
import { createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";

const CLEARANCE = "0x0336dB3c42C1ee09504664d7eCa63ae90A606bDf";
const chain = { ...studioDevnet, rpcUrls: { default: { http: ["https://studio-next.genlayer.com/api"] } } };
const client = createClient({ chain });

const id = Number(process.argv[2] ?? 1);
const raw = await client.readContract({ address: CLEARANCE, functionName: "get_request", args: [id] });
const request = JSON.parse(raw);
if (!request.found) {
  console.log(`no request ${id}`);
} else {
  const { verdict, tier, price, conditions, reason, status, version, receipt } = request;
  console.log({ verdict, tier, price, conditions, reason, status, version, receipt });
}
