'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import contract from '@/lib/contract.generated.json';
import type { Request } from '@/lib/types';
import { refreshReads, send, type TxState } from '@/lib/write';

import { AnswerCard, TxProgress, readRequest } from './Actions';
import { WalletGate, useWallet } from './Wallet';

const MAX = contract.limits.use;

/** The four facts licenses turn on. Each chip starts a sentence about one. */
const CHIPS: [string, string][] = [
  ['WHERE', 'Where it appears: '],
  ['HOW MANY', 'How many copies or viewers: '],
  ['COMMERCIAL?', 'Commercial or not: '],
  ['HOW LONG', 'For how long: '],
];

export function AskBox({ workId, version }: { workId: number; version: number }) {
  const w = useWallet();
  const router = useRouter();
  const [use, setUse] = useState('');
  const [state, setState] = useState<TxState>({ phase: 'idle' });
  const [answer, setAnswer] = useState<Request | null>(null);
  const busy = state.phase === 'signing' || state.phase === 'deciding';
  const text = use.trim();

  function chip(start: string) {
    setUse((u) => (u.trim() === '' ? start : `${u.replace(/\s+$/, '')} ${start}`).slice(0, MAX));
  }

  async function ask() {
    setAnswer(null);
    const done = await send(w.account, 'ask', [workId, text], 0n, setState);
    if (done.phase !== 'done') return;
    const id = Number(done.returned);
    await refreshReads(['requests', `work:${workId}`, 'works']);
    const fresh = Number.isFinite(id) ? await readRequest(id) : null;
    if (fresh) setAnswer(fresh);
    w.refreshBalance();
    router.refresh();
  }

  return (
    <div className="c-card flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <p className="c-eyebrow">Ask about a use</p>
        <span className="c-faint mono text-[11.5px]">license v{version}</span>
      </div>
      <textarea
        className="c-textarea"
        value={use}
        maxLength={MAX}
        onChange={(e) => setUse(e.target.value)}
        placeholder="Print the fox on 200 T-shirts for my band's autumn tour, sold at shows."
        aria-label="Describe the use"
        disabled={busy}
      />
      <div className="flex flex-wrap gap-2">
        {CHIPS.map(([label, start]) => (
          <button key={label} type="button" className="c-chip" onClick={() => chip(start)} disabled={busy}>
            {label}
          </button>
        ))}
      </div>
      <WalletGate action="ask the license">
        <div className="flex items-center gap-3">
          <button className="c-btn solid flex-1" onClick={ask} disabled={busy || text.length === 0}>
            Ask the license
          </button>
          <span className="c-faint mono text-[12px]">
            {use.length} / {MAX}
          </span>
        </div>
      </WalletGate>
      <TxProgress state={state} waiting="Validators are reading the license" />
      {state.phase === 'done' && !answer && (
        <p className="c-note">Answered. Reload the page to see it in the list below.</p>
      )}
      {answer && <AnswerCard r={answer} seconds={state.seconds} hash={state.hash} />}
      <p className="c-faint text-[12.5px] leading-relaxed">
        One sentence per use, in your own words. Say where, how many, commercial or not, and for how long. Claims such as
        &ldquo;the artist said it&apos;s fine&rdquo; are ignored by rule.
      </p>
    </div>
  );
}
