import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ReadError } from '@/components/ui';
import { dayTime, gen } from '@/lib/format';
import { getLicense, readError } from '@/lib/read';
import type { LicenseVersion } from '@/lib/types';

export const revalidate = 3600;

export async function generateMetadata(props: PageProps<'/w/[id]/v/[version]'>): Promise<Metadata> {
  const { id, version } = await props.params;
  return { title: `License v${version} of work ${id}` };
}

export default async function VersionPage(props: PageProps<'/w/[id]/v/[version]'>) {
  const { id: rawId, version: rawVersion } = await props.params;
  const id = Number(rawId);
  const version = Number(rawVersion);
  if (!Number.isInteger(id) || !Number.isInteger(version) || id < 1 || version < 1) notFound();
  let v: LicenseVersion | { found: false };
  try {
    v = await getLicense(id, version);
  } catch (e) {
    return (
      <div className="c-wrap py-16">
        <ReadError message={readError(e)} />
      </div>
    );
  }
  if (!v.found) notFound();
  return (
    <div className="c-wrap max-w-[860px] py-12">
      <nav className="c-faint text-[13px]" aria-label="Breadcrumb">
        <Link href={`/w/${id}`} className="hover:text-[var(--ink)]">{v.title}</Link> / license v{v.version}
      </nav>
      <h1 className="c-h2 mt-4">
        {v.title}, license v{v.version}
      </h1>
      <p className="c-muted mt-2 text-[14.5px]">
        {v.creator ? `By ${v.creator}. ` : ''}Written {dayTime(v.created_at)}.{' '}
        {v.version === v.latest ? 'This is the current version.' : `The current version is v${v.latest}; receipts issued under this one keep it.`}
      </p>
      <div className="c-card mt-6 p-6">
        <p className="whitespace-pre-wrap text-[17px] leading-relaxed">{v.license}</p>
      </div>
      <div className="c-card mt-4 overflow-x-auto">
        <table className="c-table">
          <thead>
            <tr>
              <th>Tier id</th>
              <th>Name</th>
              <th>Covers</th>
              <th className="text-right">Price</th>
            </tr>
          </thead>
          <tbody>
            {v.tiers.length ? (
              v.tiers.map((t) => (
                <tr key={t.id}>
                  <td className="mono">{t.id}</td>
                  <td>{t.name}</td>
                  <td className="c-muted">{t.scope}</td>
                  <td className="mono text-right">{gen(t.price)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="c-muted">No paid tiers in this version.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="c-faint mono mt-4 break-all text-[12px]">sha3-256 {v.digest}</p>
      <p className="c-faint mt-2 text-[13px]">
        The hash is SHA3-256 of this license and its tiers in one canonical JSON form. See{' '}
        <Link className="c-link" href="/docs/concepts/receipts">Receipts and what they prove</Link> to check it yourself.
      </p>
    </div>
  );
}
