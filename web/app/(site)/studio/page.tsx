import type { Metadata } from 'next';

import { Studio } from '@/components/Studio';
import { ReadError } from '@/components/ui';
import { allWorks, readError } from '@/lib/read';
import type { WorkSummary } from '@/lib/types';

export const revalidate = 20;
export const metadata: Metadata = { title: 'Creator studio' };

export default async function StudioPage() {
  let works: WorkSummary[] = [];
  let error = '';
  try {
    works = await allWorks();
  } catch (e) {
    error = readError(e);
  }
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">Creator studio</p>
      <h1 className="c-h2 mt-2">Your works, the requests waiting for you, and your earnings</h1>
      <div className="mt-8">{error ? <ReadError message={error} /> : <Studio works={works} />}</div>
    </div>
  );
}
