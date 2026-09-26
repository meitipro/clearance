import type { Metadata } from 'next';

import { ExploreList } from '@/components/ExploreList';
import { ReadError } from '@/components/ui';
import { allWorks, isGolden, readError } from '@/lib/read';
import type { WorkSummary } from '@/lib/types';

export const revalidate = 20;
export const metadata: Metadata = { title: 'Explore works' };

export default async function Explore() {
  let works: WorkSummary[] = [];
  let error = '';
  try {
    works = await allWorks();
  } catch (e) {
    error = readError(e);
  }
  const published = works.filter((w) => !isGolden(w));
  const golden = works.filter(isGolden);
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">Explore</p>
      <h1 className="c-h2 mt-2">Works with licenses that answer for themselves</h1>
      <p className="c-lead mt-3">Every work here has a license in its creator&apos;s own words. Open one and ask about your use.</p>
      <div className="mt-8">
        {error ? <ReadError message={error} /> : <ExploreList works={published} golden={golden} />}
      </div>
    </div>
  );
}
