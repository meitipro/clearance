import Link from 'next/link';

import { DEPLOYMENT } from '@/lib/genlayer-core.mjs';
import { answerOf, firstWords, gen, receiptNo, short, shortHash } from '@/lib/format';
import type { Request, Verdict as VerdictName } from '@/lib/types';

export const EXPLORER = DEPLOYMENT.explorer as string;
export const CONTRACT = DEPLOYMENT.clearance as string;

export function txUrl(hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}

export function addressUrl(address: string): string {
  return `${EXPLORER}/address/${address}`;
}

/** Violet for yes answers, grey for DENIED and UNCLEAR. */
export function Verdict({ verdict, label }: { verdict: VerdictName | string; label?: string }) {
  const yes = verdict === 'FREE' || verdict === 'PAID';
  return <span className={`c-verdict${yes ? ' yes' : ''}`}>{label ?? verdict}</span>;
}

export function Tx({ hash, label }: { hash: string; label?: string }) {
  if (!hash) return null;
  return (
    <a className="c-link mono text-[12.5px]" href={txUrl(hash)} target="_blank" rel="noreferrer">
      {label ? `${label} ` : ''}
      {shortHash(hash)} ↗
    </a>
  );
}

export function Addr({ address }: { address: string }) {
  if (!address) return null;
  return (
    <a className="c-link mono text-[12.5px]" href={addressUrl(address)} target="_blank" rel="noreferrer" title={address}>
      {short(address)}
    </a>
  );
}

/** One row of an answer feed: verdict, work, first words of the reason. */
export function AnswerRow({ r, showWork = true }: { r: Request; showWork?: boolean }) {
  const a = answerOf(r);
  return (
    <Link href={r.receipt ? `/r/${receiptNo(r.id)}` : `/r/${receiptNo(r.id)}`} className="c-row-link px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Verdict verdict={a.verdict} label={a.label} />
        {showWork && <span className="font-medium">{r.title}</span>}
        <span className="c-faint text-[13px]">{firstWords(r.use, 10)}</span>
        {a.byCreator && <span className="c-faint mono text-[11px]">creator&apos;s answer</span>}
      </div>
      {r.reason && (
        <p className="c-muted mt-1 text-[13.5px] leading-snug">
          {a.byCreator ? `The judge had answered ${r.verdict}: ` : ''}
          {firstWords(r.reason, a.byCreator ? 16 : 22)}
        </p>
      )}
    </Link>
  );
}

/** The receipt card on the landing page: a real receipt, read from the contract. */
export function ReceiptCard({ r }: { r: Request }) {
  const a = answerOf(r);
  return (
    <Link href={`/r/${receiptNo(r.id)}`} className="c-card block p-5 transition-colors hover:border-[var(--line-strong)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[17px] font-semibold">{r.title}</p>
          <p className="c-faint text-[13px]">
            {r.creator ? `by ${r.creator} · ` : ''}license v{r.version}
          </p>
        </div>
        <span className="c-verdict yes">{r.receipt ? 'Cleared' : 'Answered'}</span>
      </div>
      <p className="c-eyebrow mt-5">Requested use</p>
      <p className="serif mt-1 text-[21px] leading-snug">&ldquo;{r.use}&rdquo;</p>
      <div className="mt-5 flex flex-wrap items-start gap-3">
        <Verdict verdict={a.verdict} label={a.label} />
        <p className="c-muted min-w-[220px] flex-1 text-[14px] leading-snug">
          {a.byCreator ? `Creator's answer. The judge had answered ${r.verdict}: ` : ''}
          {r.reason}
        </p>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-4 text-[13px]">
        <span className="mono">
          {r.paid !== '0' ? gen(r.paid) : 'No charge'}
          {r.conditions ? ` · ${r.conditions}` : ''}
        </span>
        <span className="mono c-faint">Receipt {receiptNo(r.id)}</span>
      </div>
    </Link>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="c-note">{children}</div>;
}

export function ReadError({ message }: { message: string }) {
  return (
    <div className="c-card pad">
      <p className="font-medium">The chain did not answer.</p>
      <p className="c-muted mt-1 text-[14px]">{message}</p>
    </div>
  );
}
