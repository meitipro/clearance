import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AnswerCard } from '@/components/Actions';
import { CopyLink } from '@/components/CopyLink';
import { Mark } from '@/components/Nav';
import { Addr, ReadError, Tx, Verdict, addressUrl, txUrl } from '@/components/ui';
import { KIND_LABEL, answerOf, day, dayTime, gen, parseReceiptNo, receiptNo } from '@/lib/format';
import { txsFor } from '@/lib/explorer';
import { getRequest, getWork, readError } from '@/lib/read';
import type { Request } from '@/lib/types';

export const revalidate = 20;

export async function generateMetadata(props: PageProps<'/r/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  const n = parseReceiptNo(id);
  return { title: n ? `Receipt ${receiptNo(n)}` : 'Receipt' };
}

function hostOf(link: string): string {
  try {
    return new URL(link).host.replace(/^www\./, '');
  } catch {
    return link;
  }
}

const STATE_TEXT: Record<string, string> = {
  OFFER: 'No receipt yet. The license allows this use under a paid tier, and the price is held for seven days from the answer.',
  WAITING: 'No receipt yet. The license did not say enough to decide, so the request went to the creator.',
  DENIED: 'No receipt. The license clearly does not allow this use and no tier covers it.',
  DECLINED: 'No receipt. The license did not decide this use, and the creator answered no.',
};

export default async function ReceiptPage(props: PageProps<'/r/[id]'>) {
  const { id: raw } = await props.params;
  const id = parseReceiptNo(raw);
  if (!id) notFound();
  let r: (Request & { found: true }) | { found: false };
  let kind = '';
  try {
    r = await getRequest(id);
    if (r.found) {
      const w = await getWork(r.work_id);
      kind = w.found ? w.kind : '';
    }
  } catch (e) {
    return (
      <div className="c-wrap py-16">
        <ReadError message={readError(e)} />
      </div>
    );
  }
  if (!r.found) notFound();
  const req = r;
  const txs = await txsFor(req.id);
  const a = answerOf(req);
  const no = receiptNo(req.id);

  if (!req.receipt) {
    return (
      <div className="c-wrap max-w-[760px] py-12">
        <p className="c-eyebrow">Request {no}</p>
        <h1 className="c-h2 mt-3">{req.title}</h1>
        <p className="serif mt-5 text-[24px] leading-snug">&ldquo;{req.use}&rdquo;</p>
        <p className="c-muted mt-4 text-[15px]">{STATE_TEXT[req.status] ?? ''}</p>
        <div className="mt-6">
          <AnswerCard r={req} hash={txs.ask} />
        </div>
        <p className="c-faint mt-6 text-[13px]">
          Asked by <Addr address={req.requester} /> on {dayTime(req.asked_at)} under{' '}
          <Link className="c-link" href={`/w/${req.work_id}/v/${req.version}`}>license v{req.version}</Link>.{' '}
          <Link className="c-link" href={`/w/${req.work_id}`}>Open the work</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="c-wrap max-w-[880px] py-12">
      <article className="c-card overflow-hidden" aria-label={`Clearance receipt ${no}`}>
        <header className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-6 py-4">
          <p className="c-eyebrow flex items-center gap-3">
            <Mark size={22} /> Clearance receipt
          </p>
          <p className="mono text-[15px]">{no}</p>
        </header>

        <div className="px-6 py-7">
          <p className="c-eyebrow">Work</p>
          <p className="mt-2 text-[22px] font-semibold">{req.title}</p>
          <p className="c-muted text-[14px]">
            {KIND_LABEL[kind] ?? 'Work'}
            {req.creator ? ` by ${req.creator}` : ''} ·{' '}
            <a className="c-link" href={req.link} target="_blank" rel="noreferrer">{hostOf(req.link)}</a>
          </p>

          <p className="c-eyebrow mt-8">Use covered</p>
          <p className="serif mt-2 text-[27px] leading-snug">&ldquo;{req.use}&rdquo;</p>

          <div className="mt-7 flex flex-wrap items-start gap-3">
            <Verdict verdict={a.verdict} label={a.label} />
            <p className="min-w-[220px] flex-1 leading-relaxed">
              {a.byCreator ? (
                <>
                  The creator answered {req.decision} on {dayTime(req.answered_at)} (<Addr address={req.answered_by} />). The
                  judge had answered {req.verdict}: <span className="c-muted">{req.reason}</span>
                </>
              ) : (
                req.reason
              )}
            </p>
          </div>
        </div>

        <dl className="c-kv">
          <div>
            <dd className="mono">{req.paid !== '0' ? gen(req.paid) : 'No charge'}</dd>
            <dt>{req.paid !== '0' ? 'Paid' : 'Price'}</dt>
          </div>
          <div>
            <dd>{req.conditions || 'None'}</dd>
            <dt>Conditions</dt>
          </div>
          <div>
            <dd className="mono text-[13.5px]">
              <Link className="c-link" href={`/w/${req.work_id}/v/${req.version}`}>v{req.version}</Link> · {req.digest.slice(0, 6)}…{req.digest.slice(-2)}
            </dd>
            <dt>License</dt>
          </div>
          <div>
            <dd>{day(req.issued_at)}</dd>
            <dt>Issued</dt>
          </div>
        </dl>

        <div className="grid gap-2 px-6 py-6 text-[14px]">
          {txs.ask ? (
            <p>
              <span className="c-faint inline-block w-24">Asked</span> <Tx hash={txs.ask} label="tx" />
            </p>
          ) : null}
          {txs.answer ? (
            <p>
              <span className="c-faint inline-block w-24">Answered</span> <Tx hash={txs.answer} label="tx" />
            </p>
          ) : null}
          {txs.buy ? (
            <p>
              <span className="c-faint inline-block w-24">Bought</span> <Tx hash={txs.buy} label="tx" />
            </p>
          ) : null}
          <p>
            <span className="c-faint inline-block w-24">Holder</span> <Addr address={req.holder} />
          </p>
          <p>
            <span className="c-faint inline-block w-24">Issued</span> {dayTime(req.issued_at)} ·{' '}
            {req.receipt_kind === 'CREATOR' ? 'by the creator' : 'by the judge'}
          </p>
        </div>

        <div className="border-t border-[var(--line)] px-6 py-5">
          <p className="c-muted text-[14px] leading-relaxed">
            This receipt covers only the use written above, under license version {req.version}. It records the
            creator&apos;s own terms and is not legal advice.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <CopyLink />
            <Link className="c-btn small" href={`/w/${req.work_id}/v/${req.version}`}>View license v{req.version}</Link>
            <a className="c-btn small" href={txs.ask ? txUrl(txs.buy ?? txs.ask) : addressUrl(req.owner)} target="_blank" rel="noreferrer">
              Verify on explorer ↗
            </a>
          </div>
        </div>
      </article>
      <p className="c-faint mt-4 text-center text-[12.5px]">
        Read from the contract on GenLayer Studio Next. Request {req.id} of work {req.work_id}.
      </p>
    </div>
  );
}
