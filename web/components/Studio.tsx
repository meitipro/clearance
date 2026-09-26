'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { CONTRACT, readClient, retried } from '@/lib/genlayer-core.mjs';
import { answerOf, dayTime, gen, receiptNo } from '@/lib/format';
import type { Request, Work, WorkSummary } from '@/lib/types';
import { refreshReads, send, type TxState } from '@/lib/write';

import { TxProgress } from './Actions';
import { JudgePreview, TiersEditor, tierProblems, tiersPayload, type DraftTier } from './TermsEditor';
import { Verdict } from './ui';
import { WalletGate, useWallet } from './Wallet';

async function view<T>(method: string, args: number[]): Promise<T> {
  const raw = await retried(() => readClient().readContract({ address: CONTRACT, functionName: method, args }), 4);
  return JSON.parse(String(raw)) as T;
}

type Loaded = { work: Work; requests: Request[] };

function RequestAnswer({ r, work, onDone }: { r: Request; work: Work; onDone: () => void }) {
  const w = useWallet();
  const [tier, setTier] = useState(work.tiers[0]?.id ?? '');
  const [state, setState] = useState<TxState>({ phase: 'idle' });
  const busy = state.phase === 'signing' || state.phase === 'deciding';
  const choices: ('FREE' | 'PAID' | 'DENIED')[] = r.verdict === 'DENIED' ? ['FREE', 'PAID'] : ['FREE', 'PAID', 'DENIED'];

  async function answer(decision: 'FREE' | 'PAID' | 'DENIED') {
    const done = await send(w.account, 'answer', [r.id, decision, decision === 'PAID' ? tier : ''], 0n, setState);
    if (done.phase === 'done') {
      await refreshReads(['requests', `request:${r.id}`, `work:${r.work_id}`]);
      onDone();
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Verdict verdict={r.verdict} />
        <Link className="c-link mono text-[12px]" href={`/r/${receiptNo(r.id)}`}>{receiptNo(r.id)}</Link>
        <span className="c-faint text-[12.5px]">asked {dayTime(r.asked_at)}</span>
      </div>
      <p className="serif text-[18px] leading-snug">&ldquo;{r.use}&rdquo;</p>
      {r.reason && <p className="c-muted text-[13.5px]">Judge: {r.reason}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {choices.includes('FREE') && (
          <button className="c-btn small" onClick={() => answer('FREE')} disabled={busy}>
            {r.verdict === 'DENIED' ? 'Grant free' : 'Yes, free'}
          </button>
        )}
        {work.tiers.length > 0 && (
          <span className="inline-flex items-center gap-2">
            <select className="c-select" style={{ width: 'auto', padding: '4px 8px', fontSize: 13 }} value={tier} onChange={(e) => setTier(e.target.value)} disabled={busy}>
              {work.tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}, {gen(t.price)}
                </option>
              ))}
            </select>
            <button className="c-btn small" onClick={() => answer('PAID')} disabled={busy || !tier}>
              Offer at this price
            </button>
          </span>
        )}
        {choices.includes('DENIED') && (
          <button className="c-btn small ghost" onClick={() => answer('DENIED')} disabled={busy}>
            No
          </button>
        )}
      </div>
      <TxProgress state={state} waiting="Validators are recording your answer" />
    </div>
  );
}

function Amend({ work, onDone }: { work: Work; onDone: () => void }) {
  const w = useWallet();
  const [open, setOpen] = useState(false);
  const [license, setLicense] = useState(work.license);
  const [tiers, setTiers] = useState<DraftTier[]>(work.tiers.map((t) => ({ ...t, price: gen(t.price, false).replace(/,/g, '') })));
  const [state, setState] = useState<TxState>({ phase: 'idle' });
  const busy = state.phase === 'signing' || state.phase === 'deciding';
  const problems = [...(license.trim() ? [] : ['Write the license.']), ...tierProblems(tiers)];

  async function amend() {
    const done = await send(w.account, 'amend_license', [work.id, license.trim(), JSON.stringify(tiersPayload(tiers))], 0n, setState);
    if (done.phase === 'done') {
      await refreshReads(['works', `work:${work.id}`]);
      setOpen(false);
      onDone();
    }
  }

  if (!open) {
    return (
      <button className="c-btn small" onClick={() => setOpen(true)}>
        Amend license
      </button>
    );
  }
  return (
    <div className="mt-4 flex flex-col gap-4">
      <label>
        <span className="c-label">License v{work.version + 1}</span>
        <textarea className="c-textarea" style={{ minHeight: 140 }} value={license} maxLength={1500} onChange={(e) => setLicense(e.target.value)} disabled={busy} />
      </label>
      <TiersEditor tiers={tiers} onChange={setTiers} disabled={busy} />
      <JudgePreview license={license} tiers={tiers} version={work.version + 1} />
      {problems.length > 0 && <p className="c-note">{problems.join(' ')}</p>}
      <div className="flex gap-2">
        <button className="c-btn solid" onClick={amend} disabled={busy || problems.length > 0}>
          Sign version {work.version + 1}
        </button>
        <button className="c-btn ghost" onClick={() => setOpen(false)} disabled={busy}>
          Cancel
        </button>
      </div>
      <TxProgress state={state} waiting="Validators are recording the new version" />
      <p className="c-faint text-[12.5px]">Receipts already issued keep version {work.version}. New requests read the new one.</p>
    </div>
  );
}

export function Studio({ works }: { works: WorkSummary[] }) {
  const w = useWallet();
  const router = useRouter();
  const mine = useMemo(() => works.filter((x) => w.account && x.owner.toLowerCase() === w.account.toLowerCase()), [works, w.account]);
  const [loaded, setLoaded] = useState<Loaded[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawState, setWithdrawState] = useState<TxState>({ phase: 'idle' });

  const load = useCallback(async () => {
    if (!mine.length) {
      setLoaded([]);
      return;
    }
    setLoading(true);
    try {
      const out: Loaded[] = [];
      for (const s of mine) {
        const work = await view<Work>('get_work', [s.id]);
        const page = await view<{ items: Request[] }>('list_requests', [s.id, 0, 50]);
        out.push({ work, requests: page.items });
      }
      setLoaded(out);
    } finally {
      setLoading(false);
    }
  }, [mine]);

  useEffect(() => {
    load();
  }, [load]);

  if (!w.account || w.step === 'no-wallet' || w.step === 'connect' || w.step === 'switch') {
    return (
      <WalletGate action="open your studio">
        <span />
      </WalletGate>
    );
  }

  const balance = loaded[0]?.work.balance ?? '0';
  const withdrawn = loaded[0]?.work.withdrawn ?? '0';
  const earned = loaded.reduce((sum, l) => sum + BigInt(l.work.earned), 0n);
  const waiting = loaded.flatMap((l) => l.requests.filter((r) => !r.receipt && !r.decision && (r.verdict === 'UNCLEAR' || r.verdict === 'DENIED')).map((r) => ({ r, work: l.work })));
  const unclear = waiting.filter((x) => x.r.verdict === 'UNCLEAR');
  const denied = waiting.filter((x) => x.r.verdict === 'DENIED');

  async function withdraw() {
    const done = await send(w.account, 'withdraw', [], 0n, setWithdrawState);
    if (done.phase === 'done') {
      await refreshReads(['works', ...mine.map((m) => `work:${m.id}`)]);
      await load();
      w.refreshBalance();
      router.refresh();
    }
  }

  if (!mine.length) {
    return (
      <div className="c-card pad flex flex-col items-start gap-3">
        <p>This account has not published a work yet.</p>
        <Link className="c-btn solid" href="/publish">Publish a work</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="c-card overflow-hidden">
        <dl className="c-kv" style={{ borderTop: 0 }}>
          <div>
            <dd className="mono" style={{ color: 'var(--violet-ink)' }}>{gen(balance)}</dd>
            <dt>Ready to withdraw</dt>
          </div>
          <div>
            <dd className="mono">{gen(earned)}</dd>
            <dt>Earned, all works</dt>
          </div>
          <div>
            <dd className="mono">{gen(withdrawn)}</dd>
            <dt>Withdrawn</dt>
          </div>
          <div>
            <dd className="mono">{unclear.length}</dd>
            <dt>Waiting for you</dt>
          </div>
        </dl>
        <div className="flex flex-col gap-3 p-5">
          <button className="c-btn solid self-start" onClick={withdraw} disabled={balance === '0' || withdrawState.phase === 'signing' || withdrawState.phase === 'deciding'}>
            Withdraw {gen(balance)}
          </button>
          <TxProgress state={withdrawState} waiting="Validators are sending your balance" />
          {withdrawState.phase === 'done' && (
            <p className="c-note violet">Withdrawn. The transfer lands in your wallet when the transaction finalizes, usually within a few minutes.</p>
          )}
        </div>
      </section>

      <section>
        <p className="c-eyebrow">Requests waiting for an answer</p>
        {loading && !loaded.length ? (
          <p className="c-note mt-3">Reading your requests…</p>
        ) : unclear.length ? (
          <div className="c-card mt-3 divide-y divide-[var(--line)]">
            {unclear.map(({ r, work }) => (
              <RequestAnswer key={r.id} r={r} work={work} onDone={load} />
            ))}
          </div>
        ) : (
          <p className="c-note mt-3">Nothing is waiting. Every request so far was answered by the license.</p>
        )}
      </section>

      {denied.length > 0 && (
        <section>
          <p className="c-eyebrow">Denied by your license: grant an exception</p>
          <div className="c-card mt-3 divide-y divide-[var(--line)]">
            {denied.map(({ r, work }) => (
              <RequestAnswer key={r.id} r={r} work={work} onDone={load} />
            ))}
          </div>
        </section>
      )}

      <section>
        <p className="c-eyebrow">Your works</p>
        <div className="mt-3 flex flex-col gap-4">
          {loaded.map(({ work, requests }) => (
            <div key={work.id} className="c-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link className="text-[17px] font-semibold hover:underline" href={`/w/${work.id}`}>{work.title}</Link>
                  <p className="c-faint text-[13px]">
                    license v{work.version} · {work.counts.asks} answers · {work.counts.receipts} receipts · earned {gen(work.earned)}
                  </p>
                </div>
                <Amend work={work} onDone={load} />
              </div>
              {requests.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {requests.slice(0, 8).map((r) => {
                    const a = answerOf(r);
                    return (
                      <Link key={r.id} href={`/r/${receiptNo(r.id)}`} title={r.use}>
                        <Verdict verdict={a.verdict} label={`${receiptNo(r.id)} ${a.label}`} />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
