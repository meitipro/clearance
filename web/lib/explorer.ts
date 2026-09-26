import { abi } from 'genlayer-js';
import { unstable_cache } from 'next/cache';

import { CONTRACT, EXPLORER } from './genlayer-core.mjs';

/**
 * The transactions behind each request, read from the Studio Next explorer's
 * API. The contract cannot know its own transaction hashes, so a receipt page
 * finds them here: the ask whose returned id is the request, and the buy or
 * creator answer whose first argument is.
 *
 * Only decided, successful transactions count. A refused buy is on the
 * explorer too, and it bought nothing.
 */

export type RequestTxs = { ask?: string; buy?: string; answer?: string; askedSeconds?: number };

/* eslint-disable @typescript-eslint/no-explicit-any */

function decode(b64: string): { method: string; args: unknown[] } | null {
  try {
    const bytes = Uint8Array.from(Buffer.from(b64, 'base64'));
    const out = abi.calldata.decode(bytes) as any;
    if (!(out instanceof Map)) return null;
    return { method: String(out.get('') ?? ''), args: (out.get('args') as unknown[]) ?? [] };
  } catch {
    return null;
  }
}

function leaderOf(tx: any): any {
  const rounds = tx?.consensus_data?.leader_receipt;
  if (Array.isArray(rounds)) return rounds.find((r: any) => String(r?.mode ?? '').toLowerCase() === 'leader') ?? rounds[0];
  return rounds;
}

/**
 * The explorer stores the leader's result as base64: one status byte (0 means
 * the method returned) and then the returned value, calldata-encoded. The
 * node's own receipts carry it decoded instead, so both shapes are read.
 */
function succeeded(tx: any): { ok: boolean; returned?: string } {
  const status = String(tx?.status ?? '').toUpperCase();
  if (status !== 'ACCEPTED' && status !== 'FINALIZED') return { ok: false };
  const leader = leaderOf(tx);
  if (String(leader?.execution_result ?? '').toUpperCase() !== 'SUCCESS') return { ok: false };
  const result = leader?.result;
  if (typeof result === 'string') {
    try {
      const bytes = Uint8Array.from(Buffer.from(result, 'base64'));
      if (bytes[0] !== 0) return { ok: false };
      const value = abi.calldata.decode(bytes.subarray(1)) as unknown;
      return { ok: true, returned: typeof value === 'bigint' || typeof value === 'number' || typeof value === 'string' ? String(value) : undefined };
    } catch {
      return { ok: false };
    }
  }
  const ok = String(result?.status ?? '').toLowerCase() === 'return';
  const readable = result?.payload?.readable ?? result?.payload;
  return { ok, returned: typeof readable === 'string' ? readable : undefined };
}

async function scan(): Promise<Record<string, RequestTxs>> {
  const index: Record<string, RequestTxs> = {};
  for (let page = 1; page <= 20; page++) {
    const url = `${EXPLORER}/api/transactions?address=${CONTRACT}&limit=100&page=${page}`;
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`explorer answered ${response.status}`);
    const body = await response.json();
    for (const tx of body.transactions ?? []) {
      const call = tx?.data?.calldata ? decode(tx.data.calldata) : null;
      if (!call) continue;
      const done = succeeded(tx);
      if (!done.ok) continue;
      if (call.method === 'ask' && done.returned && /^\d+$/.test(done.returned)) {
        const row = (index[done.returned] ??= {});
        row.ask = tx.hash;
      } else if ((call.method === 'buy' || call.method === 'answer') && call.args.length) {
        const key = String(call.args[0]);
        const row = (index[key] ??= {});
        row[call.method as 'buy' | 'answer'] = tx.hash;
      }
    }
    const pages = Number(body?.pagination?.totalPages ?? 1);
    if (page >= pages) break;
  }
  return index;
}

const cachedScan = unstable_cache(scan, ['explorer-scan', CONTRACT], { revalidate: 60, tags: ['txs'] });

export async function txsFor(requestId: number): Promise<RequestTxs> {
  try {
    return (await cachedScan())[String(requestId)] ?? {};
  } catch {
    return {};
  }
}
