'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import contract from '@/lib/contract.generated.json';
import { KIND_LABEL, gen, plural } from '@/lib/format';
import type { WorkSummary } from '@/lib/types';

type Filter = 'all' | 'commercial' | 'merch' | 'no-tier';

function cheapest(w: WorkSummary): string {
  if (!w.tiers.length) return 'No paid tier';
  const min = w.tiers.reduce((m, t) => (BigInt(t.price) < BigInt(m.price) ? t : m));
  return `Tiers from ${gen(min.price)}`;
}

function matches(w: WorkSummary, filter: Filter): boolean {
  const names = w.tiers.map((t) => `${t.id} ${t.name} ${t.scope}`.toLowerCase()).join(' | ');
  if (filter === 'commercial') return /commercial|business/.test(names);
  if (filter === 'merch') return /merch|print/.test(names);
  if (filter === 'no-tier') return w.tiers.length === 0;
  return true;
}

function Card({ w }: { w: WorkSummary }) {
  return (
    <Link href={`/w/${w.id}`} className="c-card flex flex-col gap-3 p-5 transition-colors hover:border-[var(--line-strong)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[17px] font-semibold leading-snug">{w.title}</p>
        <span className="c-pill shrink-0">{KIND_LABEL[w.kind] ?? 'Work'}</span>
      </div>
      <p className="c-muted text-[13.5px]">{w.creator ? `by ${w.creator} · ` : ''}license v{w.version}</p>
      <div className="flex flex-wrap gap-1.5">
        {w.tiers.map((t) => (
          <span key={t.id} className="c-verdict yes" style={{ letterSpacing: '0.04em' }}>
            {t.name} · {gen(t.price)}
          </span>
        ))}
      </div>
      <p className="c-faint mt-auto text-[12.5px]">
        {cheapest(w)} · {plural(w.counts.asks, 'answer')} · {plural(w.counts.receipts, 'receipt')}
      </p>
    </Link>
  );
}

export function ExploreList({ works, golden }: { works: WorkSummary[]; golden: WorkSummary[] }) {
  const [kind, setKind] = useState('all');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return works.filter(
      (w) =>
        (kind === 'all' || w.kind === kind) &&
        matches(w, filter) &&
        (!q || `${w.title} ${w.creator}`.toLowerCase().includes(q)),
    );
  }, [works, kind, filter, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[200px] flex-1">
          <span className="c-label">Search</span>
          <input className="c-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title or creator" />
        </label>
        <label>
          <span className="c-label">Type</span>
          <select className="c-select" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">All types</option>
            {contract.kinds.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k] ?? k}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tier filter">
          {(
            [
              ['all', 'Any terms'],
              ['commercial', 'Commercial tier'],
              ['merch', 'Merch or print tier'],
              ['no-tier', 'No paid tier'],
            ] as [Filter, string][]
          ).map(([f, label]) => (
            <button key={f} className={`c-btn small${filter === f ? ' solid' : ''}`} onClick={() => setFilter(f)} aria-pressed={filter === f}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {shown.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((w) => (
            <Card key={w.id} w={w} />
          ))}
        </div>
      ) : (
        <p className="c-note">No work matches these filters.</p>
      )}

      {golden.length > 0 && (
        <section className="mt-10">
          <p className="c-eyebrow">The golden set</p>
          <p className="c-muted mt-2 max-w-[48em] text-[14px]">
            These {golden.length} works carry the licenses of the evaluation cases, published so each case could be asked
            through real consensus. The answers are in the{' '}
            <Link className="c-link" href="/docs/more/evaluation">evaluation results</Link>.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {golden.map((w) => (
              <Card key={w.id} w={w} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
