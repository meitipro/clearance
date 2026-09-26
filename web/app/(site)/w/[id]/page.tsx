import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AskBox } from '@/components/AskBox';
import { AnswerRow, Addr, ReadError } from '@/components/ui';
import { KIND_LABEL, day, gen, plural } from '@/lib/format';
import { getWork, listRequests, readError } from '@/lib/read';
import { REPO_URL } from '@/lib/shared';
import type { Request, Work } from '@/lib/types';

export const revalidate = 20;

function hostOf(link: string): string {
  try {
    return new URL(link).host.replace(/^www\./, '');
  } catch {
    return link;
  }
}

export async function generateMetadata(props: PageProps<'/w/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  try {
    const w = await getWork(Number(id));
    if (w.found) return { title: w.title, description: `License v${w.version}${w.creator ? ` by ${w.creator}` : ''}. Ask whether a use is allowed.` };
  } catch {
    /* fall through */
  }
  return { title: `Work ${id}` };
}

export default async function WorkPage(props: PageProps<'/w/[id]'>) {
  const { id: raw } = await props.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  let work: Work | { found: false };
  let answers: Request[] = [];
  let total = 0;
  try {
    work = await getWork(id);
    if (work.found) {
      const page = await listRequests(id, 0, 12);
      answers = page.items;
      total = page.total;
    }
  } catch (e) {
    return (
      <div className="c-wrap py-16">
        <ReadError message={readError(e)} />
      </div>
    );
  }
  if (!work.found) notFound();
  const w = work;
  const report = `${REPO_URL}/issues/new?title=${encodeURIComponent(`Report work ${w.id}: ${w.title}`)}&body=${encodeURIComponent(
    `Work: /w/${w.id}\nCreator on record: ${w.owner}\n\nWhat is wrong (for example, this is not the creator's work):\n`,
  )}`;

  return (
    <div className="c-wrap py-10">
      <nav className="c-faint text-[13px]" aria-label="Breadcrumb">
        <Link href="/explore" className="hover:text-[var(--ink)]">Works</Link>
        {w.creator && <> / <span>{w.creator}</span></>} / <span className="text-[var(--ink-2)]">{w.title}</span>
      </nav>

      <div className="c-grid-2 mt-6">
        <div className="flex min-w-0 flex-col gap-8">
          <div>
            <h1 className="c-h2" style={{ fontSize: 'clamp(30px, 4.2vw, 44px)' }}>{w.title}</h1>
            <p className="c-muted mt-2 text-[15px]">
              {KIND_LABEL[w.kind] ?? 'Work'}
              {w.creator ? ` by ${w.creator}` : ''} ·{' '}
              <a className="c-link" href={w.link} target="_blank" rel="noreferrer">{hostOf(w.link)}</a> · creator on record <Addr address={w.owner} />
            </p>
            <p className="c-eyebrow mt-4 flex flex-wrap gap-x-4 gap-y-1">
              <span>License v{w.version}</span>
              <span>Updated {day(w.updated_at)}</span>
              <span>{plural(w.counts.asks, 'answer')}</span>
              <span>{plural(w.counts.receipts, 'receipt')}</span>
            </p>
          </div>

          <section>
            <p className="c-eyebrow">License, in the creator&apos;s words</p>
            <div className="c-card mt-3 p-5">
              <p className="whitespace-pre-wrap text-[16.5px] leading-relaxed">{w.license}</p>
              <p className="c-faint mono mt-4 break-all text-[11.5px]">
                v{w.version} · sha3-256 {w.digest}
              </p>
            </div>
          </section>

          <section>
            <p className="c-eyebrow">Paid tiers</p>
            <div className="c-card mt-3 overflow-x-auto">
              <table className="c-table min-w-[480px]">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>Covers</th>
                    <th className="text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {w.tiers.map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium">
                        {t.name}
                        <span className="c-faint mono block text-[11px]">{t.id}</span>
                      </td>
                      <td className="c-muted">{t.scope}</td>
                      <td className="mono whitespace-nowrap text-right" style={{ color: 'var(--violet-ink)' }}>{gen(t.price)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="font-medium">Anything else</td>
                    <td className="c-muted">Only what the license text above allows. The rest is not offered, or goes to the creator as UNCLEAR.</td>
                    <td className="mono c-faint text-right">none</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {w.tiers.length === 0 && <p className="c-faint mt-2 text-[13px]">This license offers no paid tier.</p>}
          </section>

          {w.version > 1 && (
            <section>
              <p className="c-eyebrow">Earlier versions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: w.version }, (_, i) => w.version - i).map((v) => (
                  <Link key={v} className="c-btn small" href={`/w/${w.id}/v/${v}`}>
                    v{v}
                    {v === w.version ? ' (current)' : ''}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <p className="c-faint text-[13px]">
            Is this not the creator&apos;s own work?{' '}
            <a className="c-link" href={report} target="_blank" rel="noreferrer">Report it</a>. Clearance cannot prove who
            made a work; the creator&apos;s link and address above are what a receipt is only as good as.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-8 lg:sticky lg:top-[84px]">
          <AskBox workId={w.id} version={w.version} />
          <section>
            <div className="flex items-baseline justify-between">
              <p className="c-eyebrow">Recent answers</p>
              <span className="c-faint text-[12.5px]">{plural(total, 'answer')}</span>
            </div>
            <div className="c-card mt-3 divide-y divide-[var(--line)]">
              {answers.length ? answers.map((r) => <AnswerRow key={r.id} r={r} showWork={false} />) : <p className="c-muted p-4 text-[14px]">No one has asked yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
