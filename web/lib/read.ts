import { unstable_cache } from 'next/cache';

import { CONTRACT, readClient, retried } from './genlayer-core.mjs';
import type { LicenseVersion, Page, Request, Work, WorkSummary } from './types';

/**
 * Reads happen on the server, cached for a short while under tags.
 *
 * Studio Next rate-limits each IP, and every visitor's page view would
 * otherwise spend the server's budget. Shared reads are cached for 20 seconds;
 * after a decided write the page POSTs /api/refresh, which expires the tags it
 * touched, so the person who wrote sees their own result at once.
 */

const client = readClient();
const REVALIDATE = 20;

async function view<T>(method: string, args: (number | string)[]): Promise<T> {
  const raw = await retried(() => client.readContract({ address: CONTRACT, functionName: method, args }), 3);
  return JSON.parse(String(raw)) as T;
}

export const tags = {
  works: 'works',
  requests: 'requests',
  work: (id: number) => `work:${id}`,
  request: (id: number) => `request:${id}`,
};

export function getWork(id: number): Promise<Work | { found: false }> {
  return unstable_cache(() => view<Work | { found: false }>('get_work', [id]), ['get_work', String(id)], {
    revalidate: REVALIDATE,
    tags: [tags.works, tags.work(id)],
  })();
}

export function getLicense(id: number, version: number): Promise<LicenseVersion | { found: false }> {
  // A version is never overwritten, so its text can be cached for as long as the process lives.
  return unstable_cache(() => view<LicenseVersion | { found: false }>('get_license', [id, version]), ['get_license', String(id), String(version)], {
    revalidate: 3600,
    tags: [tags.work(id)],
  })();
}

export function getRequest(id: number): Promise<(Request & { found: true }) | { found: false }> {
  return unstable_cache(() => view<(Request & { found: true }) | { found: false }>('get_request', [id]), ['get_request', String(id)], {
    revalidate: REVALIDATE,
    tags: [tags.requests, tags.request(id)],
  })();
}

export function listRequests(workId: number, offset = 0, limit = 20): Promise<Page<Request>> {
  const key = ['list_requests', String(workId), String(offset), String(limit)];
  const tagged = workId === 0 ? [tags.requests] : [tags.requests, tags.work(workId)];
  return unstable_cache(() => view<Page<Request>>('list_requests', [workId, offset, limit]), key, {
    revalidate: REVALIDATE,
    tags: tagged,
  })();
}

export function listWorks(offset = 0, limit = 50): Promise<Page<WorkSummary>> {
  return unstable_cache(() => view<Page<WorkSummary>>('list_works', [offset, limit]), ['list_works', String(offset), String(limit)], {
    revalidate: REVALIDATE,
    tags: [tags.works],
  })();
}

/** Every work, newest first, for explore and the studio. Pages of fifty. */
export async function allWorks(): Promise<WorkSummary[]> {
  const first = await listWorks(0, 50);
  const items = [...first.items];
  for (let offset = 50; offset < first.total; offset += 50) {
    items.push(...(await listWorks(offset, 50)).items);
  }
  return items;
}

/** Works published by the golden set in eval/, which explore lists separately. */
export function isGolden(w: { creator: string }): boolean {
  return w.creator === 'Clearance golden set';
}

/** A read failed: say so in one sentence rather than failing the page. */
export function readError(error: unknown): string {
  const text = String((error as Error)?.message ?? error);
  if (/-32029|rate limit/i.test(text)) return 'Studio Next is rate limiting reads right now. Wait a minute and reload.';
  return 'Studio Next did not answer this read. Reload in a moment.';
}
