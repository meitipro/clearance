import type { Metadata } from 'next';
import Link from 'next/link';

import { ReadError, Verdict } from '@/components/ui';
import { answerOf, day, firstWords, gen, receiptNo } from '@/lib/format';
import { listRequests, readError } from '@/lib/read';
import type { Request } from '@/lib/types';

export const revalidate = 20;
export const metadata: Metadata = { title: 'Receipts' };

export default async function Receipts() {
  let items: Request[] = [];
  let error = '';
  try {
    const first = await listRequests(0, 0, 50);
    items = first.items;
    if (first.total > 50) items = items.concat((await listRequests(0, 50, 50)).items);
  } catch (e) {
    error = readError(e);
  }
  const receipts = items.filter((r) => r.receipt);
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">Receipts</p>
      <h1 className="c-h2 mt-2">Every yes, on the record</h1>
      <p className="c-lead mt-3">
        A receipt is issued at once for a FREE answer, on purchase for a PAID one, and by a creator&apos;s own yes. Each is
        pinned to the license version it was issued under. Look one up by number: <span className="mono">/r/RC-0042</span>.
      </p>
      <div className="mt-8">
        {error ? (
          <ReadError message={error} />
        ) : receipts.length ? (
          <div className="c-card overflow-x-auto">
            <table className="c-table min-w-[720px]">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Work</th>
                  <th>Use covered</th>
                  <th>Answer</th>
                  <th className="text-right">Paid</th>
                  <th>Issued</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => {
                  const a = answerOf(r);
                  return (
                    <tr key={r.id}>
                      <td className="mono whitespace-nowrap">
                        <Link className="c-link" href={`/r/${receiptNo(r.id)}`}>{receiptNo(r.id)}</Link>
                      </td>
                      <td>
                        <Link className="hover:underline" href={`/w/${r.work_id}`}>{r.title}</Link>
                        <span className="c-faint block text-[12px]">license v{r.version}</span>
                      </td>
                      <td className="serif text-[16px]">&ldquo;{firstWords(r.use, 14)}&rdquo;</td>
                      <td>
                        <Verdict verdict={a.verdict} label={a.label} />
                      </td>
                      <td className="mono whitespace-nowrap text-right">{r.paid !== '0' ? gen(r.paid) : '—'}</td>
                      <td className="whitespace-nowrap">{day(r.issued_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="c-note">No receipts yet.</p>
        )}
      </div>
    </div>
  );
}
