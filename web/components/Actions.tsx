'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CONTRACT, readClient, retried } from '@/lib/genlayer-core.mjs';
import { answerOf, gen, receiptNo, short } from '@/lib/format';
import type { Request } from '@/lib/types';
import { refreshReads, send, type TxState } from '@/lib/write';

import { Tx, Verdict } from './ui';
import { WalletGate, useWallet } from './Wallet';

/** A fresh read of one request, from the browser, skipping the site's cache. */
export async function readRequest(id: number): Promise<Request | null> {
  const raw = await retried(() => readClient().readContract({ address: CONTRACT, functionName: 'get_request', args: [id] }), 4);
  const parsed = JSON.parse(String(raw));
  return parsed.found ? (parsed as Request) : null;
}

/** While a transaction is in flight: what is happening, with its link. */
export function TxProgress({ state, waiting }: { state: TxState; waiting: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (state.phase !== 'deciding' && state.phase !== 'signing') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.phase]);
  if (state.phase === 'idle') return null;
  if (state.phase === 'signing') {
    return (
      <div className="c-note flex items-center gap-2">
        <span className="c-spin" /> Confirm the transaction in your wallet.
      </div>
    );
  }
  if (state.phase === 'deciding') {
    const s = Math.max(0, Math.round((now - (state.startedAt ?? now)) / 1000));
    return (
      <div className="c-note violet flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="c-spin" />
        <span>{waiting}</span>
        <span className="mono text-[12px]">{s} s</span>
        {state.hash && <Tx hash={state.hash} label="tx" />}
      </div>
    );
  }
  if (state.phase === 'refused' || state.phase === 'error') {
    return (
      <div className="c-note" style={{ color: 'var(--danger)' }}>
        <p>{state.phase === 'refused' ? 'The contract refused: ' : ''}{state.message}</p>
        {state.hash && (
          <p className="mt-1">
            <Tx hash={state.hash} label="tx" />
          </p>
        )}
      </div>
    );
  }
  return null;
}

/** Buy a PAID answer at its stored price. Only the requester may; the contract says so too. */
export function BuyButton({ r, onDone }: { r: Request; onDone?: (r: Request) => void }) {
  const w = useWallet();
  const router = useRouter();
  const [state, setState] = useState<TxState>({ phase: 'idle' });
  const expired = r.offer_until > 0 && Date.now() / 1000 > r.offer_until;
  const mine = w.account && w.account.toLowerCase() === r.requester.toLowerCase();
  const name = r.offer_name || r.tier_name;

  if (expired) {
    return <p className="c-note">The seven-day price hold ended. Ask again to get a fresh answer.</p>;
  }
  if (w.account && !mine) {
    return (
      <p className="c-note">
        This answer belongs to {short(r.requester)}. Only the account that asked can buy it; ask about your own use on the
        work page.
      </p>
    );
  }
  async function buy() {
    const done = await send(w.account, 'buy', [r.id], BigInt(r.price), setState);
    if (done.phase === 'done') {
      await refreshReads(['requests', `request:${r.id}`, `work:${r.work_id}`, 'works']);
      w.refreshBalance();
      const fresh = await readRequest(r.id);
      if (fresh && onDone) onDone(fresh);
      router.refresh();
    }
  }
  return (
    <WalletGate action="buy this tier">
      <div className="flex flex-col gap-3">
        <button className="c-btn solid wide" onClick={buy} disabled={state.phase === 'signing' || state.phase === 'deciding'}>
          Buy the {name.toLowerCase()} tier, {gen(r.price)}
        </button>
        <TxProgress state={state} waiting="Validators are recording the purchase" />
      </div>
    </WalletGate>
  );
}

/** The answer to one request, with the one button it needs. */
export function AnswerCard({ r, seconds, hash }: { r: Request; seconds?: number; hash?: string }) {
  const [current, setCurrent] = useState(r);
  const a = answerOf(current);
  const status = current.status;
  return (
    <div className="c-card flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Verdict verdict={a.verdict} label={a.label} />
        {seconds !== undefined && <span className="c-faint mono text-[12px]">{seconds} s</span>}
        {hash && <Tx hash={hash} label="tx" />}
        {a.byCreator && <span className="c-faint mono text-[11px]">creator&apos;s answer</span>}
      </div>
      {current.reason && (
        <p className="leading-relaxed">
          {a.byCreator && <span className="c-muted">The judge had answered {current.verdict}: </span>}
          {current.reason}
        </p>
      )}
      {current.conditions && (
        <p className="c-muted text-[14px]">
          Conditions: <span className="text-[var(--ink)]">{current.conditions}</span>
        </p>
      )}
      {status === 'OFFER' && (
        <>
          <BuyButton r={current} onDone={setCurrent} />
          <p className="c-faint text-[13px]">Price held for 7 days · pinned to license v{current.version}</p>
        </>
      )}
      {status === 'CLEARED' && (
        <Link className="c-btn solid wide" href={`/r/${receiptNo(current.id)}`}>
          Get receipt {receiptNo(current.id)}
        </Link>
      )}
      {status === 'DENIED' && (
        <div className="flex flex-col gap-2">
          <a className="c-btn wide" href={current.link} target="_blank" rel="noreferrer">
            Message the creator
          </a>
          <p className="c-faint text-[13px]">No receipt. The creator can still grant an exception from their studio.</p>
        </div>
      )}
      {status === 'WAITING' && (
        <p className="c-note">Sent to the creator. They can answer yes, no or a price from their studio; this page updates when they do.</p>
      )}
      {status === 'DECLINED' && <p className="c-note">The creator answered no. No receipt was issued.</p>}
    </div>
  );
}
