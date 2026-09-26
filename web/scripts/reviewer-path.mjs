/**
 * Walk the reviewer's path from fresh accounts, through the site's own code, to finality.
 *
 *   node scripts/reviewer-path.mjs https://<the deployed site> [run-name]
 *
 * Two accounts made for this run, which have never touched the contract:
 *   1. faucet    the deployed site's /api/faucet funds both, sent the address in lower case
 *   2. publish   the creator publishes a work with one paid tier
 *   3. ask       the user asks about a commercial use, then buys the tier the judge names
 *   4. ask       the user asks about a use the license is silent on; the creator answers it
 *   5. withdraw  the creator withdraws; after finality the wallet must have moved by what
 *                the contract owed minus the fee the transaction's own accounting reports
 *   6. read      the receipt and work pages on the deployed site show what the chain holds
 *
 * Every write goes through lib/genlayer-core.mjs with the stand-in wallet, the
 * code the browser runs. Each step is written to
 * ../docs/reviewer-path.studio-next.json before anything is printed about it.
 * Keys stay in ~/.clearance/accounts.json and are never printed.
 */

import fs from 'node:fs';
import path from 'node:path';

import { CONTRACT, outcomeOf, readClient, retried, submit, waitDecided, waitFinal, walletClient } from '../lib/genlayer-core.mjs';
import { balanceOf, ensureAccount, rpc, standinWallet } from './standin-wallet.mjs';

const site = (process.argv[2] ?? '').replace(/\/$/, '');
const run = process.argv[3] ?? 'rp1';
if (!site) {
  console.error('usage: node scripts/reviewer-path.mjs https://<site> [run-name]');
  process.exit(2);
}
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const RECORD = path.join(here, '..', '..', 'docs', 'reviewer-path.studio-next.json');
const record = fs.existsSync(RECORD) ? JSON.parse(fs.readFileSync(RECORD, 'utf8')) : { runs: {} };
const log = (record.runs[run] ??= { site, contract: CONTRACT, started: new Date().toISOString(), steps: [] });
const save = () => fs.writeFileSync(RECORD, JSON.stringify(record, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2) + '\n');
const GEN = 10n ** 18n;
const fmt = (wei) => `${Number(wei) / 1e18} GEN`;

function stepDone(key) {
  return log.steps.find((s) => s.key === key && s.ok);
}

function note(entry) {
  log.steps.push({ at: new Date().toISOString(), ...entry });
  save();
}

const reader = readClient();
async function view(functionName, args) {
  return JSON.parse(String(await retried(() => reader.readContract({ address: CONTRACT, functionName, args }), 5)));
}

/** The net fee a decided transaction cost its sender, from its own fee accounting. */
async function netFee(hash) {
  const tx = await rpc('eth_getTransactionByHash', [hash]).catch(() => null);
  const gen = await rpc('gen_getTransactionByHash', [hash]).catch(() => null);
  const acct = gen?.data?.fee_accounting ?? tx?.data?.fee_accounting;
  if (!acct) return null;
  return BigInt(acct.paid_fee_value ?? 0) - BigInt(acct.total_refunded ?? 0);
}

async function write(key, account, method, args, value = 0n, { final = false } = {}) {
  const prior = stepDone(key);
  if (prior) return prior;
  const { address, provider } = standinWallet(account);
  const client = walletClient(address, provider);
  const started = Date.now();
  const hash = await submit(client, { method, args, value, sender: address });
  const decided = await waitDecided(client, hash, method);
  const outcome = outcomeOf(decided);
  const entry = {
    key,
    method,
    account,
    from: address,
    args,
    value: value.toString(),
    hash,
    ok: outcome.ok,
    status: outcome.status,
    execution: outcome.execution,
    returned: outcome.returned ?? null,
    refusal: outcome.refusal || null,
    seconds_to_decision: Math.round((Date.now() - started) / 1000),
  };
  if (final && outcome.ok) {
    const done = await waitFinal(client, hash);
    entry.final_status = outcomeOf(done).status;
  }
  note(entry);
  console.log(`${key}: ${method} ${entry.ok ? 'ok' : 'NOT OK ' + (entry.refusal ?? entry.status)} in ${entry.seconds_to_decision} s  ${hash}`);
  if (!entry.ok) throw new Error(`${key} failed: ${entry.refusal ?? entry.status}`);
  return entry;
}

// -- accounts ---------------------------------------------------------------------------------
const creatorName = `review_creator_${run}`;
const userName = `review_user_${run}`;
const creator = ensureAccount(creatorName);
const user = ensureAccount(userName);
if (!log.accounts) {
  const nonces = { creator: Number(await rpc('eth_getTransactionCount', [creator, 'latest'])), user: Number(await rpc('eth_getTransactionCount', [user, 'latest'])) };
  log.accounts = { creator, user, nonces_at_start: nonces };
  save();
  console.log(`accounts: creator ${creator}, user ${user}, nonces at start ${JSON.stringify(nonces)}`);
}

// -- 1. faucet, through the deployed site --------------------------------------------------------
for (const [who, address] of [['creator', creator], ['user', user]]) {
  const key = `faucet-${who}`;
  if (stepDone(key)) continue;
  const response = await fetch(`${site}/api/faucet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: address.toLowerCase() }),
  });
  const body = await response.json().catch(() => ({}));
  const after = await balanceOf(address);
  const ok = response.ok && BigInt(body.after ?? 0) > BigInt(body.before ?? 0) && after > 0n;
  note({ key, ok, http: response.status, sent_address: address.toLowerCase(), answered_address: body.address, before: body.before, after: body.after, read_after: after.toString(), error: body.error });
  console.log(`${key}: HTTP ${response.status} ${fmt(BigInt(body.before ?? 0))} -> ${fmt(after)} ${body.error ?? ''}`);
  if (!ok) throw new Error(`${key} did not fund ${address}`);
}

// -- 2. publish -----------------------------------------------------------------------------------
const license =
  'Free for personal use, with credit to the photographer. Commercial use online, including company websites, ads and social media for a business, needs the commercial tier.';
const tiers = { creator: 'Review Run Photographer', kind: 'photo', tiers: [{ id: 'commercial', name: 'Commercial', scope: 'Commercial use online for one business', price: '12' }] };
const published = await write('publish', creatorName, 'publish_work', [`Reviewer path ${run}: Harbour at Dawn`, `${site}/docs/more/limitations`, license, JSON.stringify(tiers)]);
const workId = Number(published.returned);

// -- 3. a commercial use: ask, then buy what the judge names -----------------------------------------
const paidAsk = await write('ask-commercial', userName, 'ask', [workId, 'Hero image on the landing page of my company website, which sells kayak tours.']);
const paidId = Number(paidAsk.returned);
const paid = await view('get_request', [paidId]);
note({ key: 'read-commercial', ok: true, request_id: paidId, verdict: paid.verdict, tier: paid.tier, price: paid.price, reason: paid.reason });
console.log(`  -> ${paid.verdict} ${paid.tier} ${paid.price !== '0' ? fmt(BigInt(paid.price)) : ''}  ${paid.reason}`);
let bought = null;
if (paid.verdict === 'PAID') {
  const before = await balanceOf(user);
  bought = await write('buy', userName, 'buy', [paidId], BigInt(paid.price), { final: true });
  const after = await balanceOf(user);
  const fee = await netFee(bought.hash);
  const expected = fee === null ? null : before - BigInt(paid.price) - fee;
  note({ key: 'balance-buy', ok: expected === after, before: before.toString(), after: after.toString(), price: paid.price, net_fee: fee?.toString() ?? null, expected: expected?.toString() ?? null, difference: expected === null ? null : (after - expected).toString() });
  console.log(`  buyer ${fmt(before)} -> ${fmt(after)}; price ${fmt(BigInt(paid.price))}, fee ${fee === null ? '?' : fmt(fee)}; ${expected === after ? 'exact to the wei' : 'difference ' + (expected === null ? '?' : (after - expected).toString()) + ' wei'}`);
}

// -- 4. a use the license is silent on: ask, then the creator's answer ----------------------------------
const silentAsk = await write('ask-silent', userName, 'ask', [workId, 'Project the photo on a wall during a free outdoor film night that our neighbourhood association runs in the park.']);
const silentId = Number(silentAsk.returned);
const silent = await view('get_request', [silentId]);
note({ key: 'read-silent', ok: true, request_id: silentId, verdict: silent.verdict, tier: silent.tier, reason: silent.reason });
console.log(`  -> ${silent.verdict} ${silent.tier}  ${silent.reason}`);
if (silent.verdict === 'UNCLEAR' || silent.verdict === 'DENIED') {
  await write('answer', creatorName, 'answer', [silentId, 'FREE', '']);
  const answered = await view('get_request', [silentId]);
  note({ key: 'read-answer', ok: answered.receipt === true && answered.receipt_kind === 'CREATOR', status: answered.status, receipt_kind: answered.receipt_kind });
  console.log(`  -> creator answered FREE; receipt ${answered.receipt} (${answered.receipt_kind})`);
}

// -- 5. withdraw, and the balance after finality --------------------------------------------------------
const owed = BigInt((await view('get_work', [workId])).balance);
if (owed > 0n) {
  const before = await balanceOf(creator);
  const w = await write('withdraw', creatorName, 'withdraw', [], 0n, { final: true });
  const after = await balanceOf(creator);
  const fee = await netFee(w.hash);
  const expected = fee === null ? null : before + owed - fee;
  note({ key: 'balance-withdraw', ok: expected === after, owed: owed.toString(), before: before.toString(), after: after.toString(), net_fee: fee?.toString() ?? null, expected: expected?.toString() ?? null, difference: expected === null ? null : (after - expected).toString() });
  console.log(`  creator ${fmt(before)} -> ${fmt(after)}; owed ${fmt(owed)}, fee ${fee === null ? '?' : fmt(fee)}; ${expected === after ? 'exact to the wei' : 'difference ' + (expected === null ? '?' : (after - expected).toString()) + ' wei'}`);
} else {
  note({ key: 'balance-withdraw', ok: false, owed: '0', why: 'nothing was owed, so there was nothing to withdraw' });
}

// -- 6. the deployed site shows what the chain holds -------------------------------------------------
for (const [key, url, needle] of [
  ['page-work', `${site}/w/${workId}`, `Reviewer path ${run}`],
  ['page-receipt-paid', `${site}/r/RC-${String(paidId).padStart(4, '0')}`, 'Hero image on the landing page'],
  ['page-receipt-silent', `${site}/r/RC-${String(silentId).padStart(4, '0')}`, 'free outdoor film night'],
]) {
  let ok = false;
  let status = 0;
  for (let attempt = 0; attempt < 6 && !ok; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 10000));
    const response = await fetch(url, { cache: 'no-store' });
    status = response.status;
    const html = await response.text();
    ok = response.ok && html.includes(needle);
  }
  note({ key, ok, url, http: status });
  console.log(`${key}: HTTP ${status} ${ok ? 'shows it' : 'MISSING'}  ${url}`);
}

log.finished = new Date().toISOString();
save();
console.log(`\nrecorded in docs/reviewer-path.studio-next.json (run ${run})`);
