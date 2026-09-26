import Link from 'next/link';

import { AnswerRow, CONTRACT, Empty, ReadError, ReceiptCard, addressUrl } from '@/components/ui';
import { isGolden, listRequests, readError } from '@/lib/read';
import type { Request } from '@/lib/types';

export const revalidate = 20;

const FAQ = [
  {
    q: 'Is this legal advice?',
    a: "No. Clearance applies the creator's own words and nothing else. It does not decide what copyright law allows, and every receipt says so.",
  },
  {
    q: 'Who decides?',
    a: "Several GenLayer validators, each reading the same license against the same use with their own model. An answer stands only when they agree on the verdict and, for a paid answer, on the tier. The creator keeps the last word on every UNCLEAR request.",
  },
  {
    q: 'What about fair use?',
    a: "Clearance does not judge it. The judge is told to decide only from the license and its tiers, and to ignore outside law. If you think a use is fair use, that is a question for a lawyer, not for this desk.",
  },
  {
    q: 'Which network?',
    a: 'GenLayer Studio Next, chain 61997. Test GEN is free from the faucet in the site. Every write carries a small fee deposit, most of which is refunded when the transaction finalizes.',
  },
  {
    q: 'What if the creator changes the license?',
    a: 'Amending a license adds a new version with its own hash. Receipts stay pinned to the version they were issued under, and new requests read the latest one.',
  },
  {
    q: 'Can a receipt prove I own the work?',
    a: 'No. It proves the creator on record granted this use under this license version. Clearance cannot prove the creator made the work; the work page shows their links so you can check.',
  },
];

function pickHero(items: Request[]): Request | undefined {
  const real = items.filter((r) => !isGolden(r));
  const pool = real.length ? real : items;
  return (
    pool.find((r) => r.receipt && r.paid !== '0') ??
    pool.find((r) => r.receipt) ??
    pool.find((r) => r.verdict === 'PAID') ??
    pool[0]
  );
}

export default async function Landing() {
  let items: Request[] = [];
  let error = '';
  try {
    items = (await listRequests(0, 0, 40)).items;
  } catch (e) {
    error = readError(e);
  }
  const hero = pickHero(items);
  const real = items.filter((r) => !isGolden(r));
  const recent = (real.length >= 4 ? real : items).slice(0, 8);

  return (
    <>
      <section className="c-wrap grid-cols-1 pb-16 pt-14 md:pt-20">
        <div className="c-grid-2">
          <div>
            <p className="c-eyebrow">Plain-language licensing, judged on GenLayer</p>
            <h1 className="c-h1 mt-5">
              Can I use this?
              <br />
              <em>Ask the license.</em>
            </h1>
            <p className="c-lead mt-6">
              Creators write their terms once in plain words. You describe how you want to use the work, GenLayer
              validators read the terms against it and answer in about a minute, and every yes comes with a receipt that
              proves you had permission.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/explore" className="c-btn solid">
                Browse works
              </Link>
              <Link href="/publish" className="c-btn">
                Publish a work
              </Link>
            </div>
            <p className="c-faint mt-5 text-[13.5px]">Reading needs no wallet. Receipts are public and pinned to the license version.</p>
          </div>
          <div>
            {error ? <ReadError message={error} /> : hero ? <ReceiptCard r={hero} /> : <Empty>No answers on chain yet.</Empty>}
          </div>
        </div>
      </section>

      <section className="c-section">
        <div className="c-wrap">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="c-eyebrow">Recent answers</p>
              <h2 className="c-h2 mt-2">Including the no&apos;s.</h2>
            </div>
            <p className="c-muted max-w-[30em] text-[14px]">
              A judge that only ever said &ldquo;paid&rdquo; would be a sales machine. Denials and unclear answers stay on
              the front page.
            </p>
          </div>
          <div className="c-card mt-6 divide-y divide-[var(--line)]">
            {recent.length ? recent.map((r) => <AnswerRow key={r.id} r={r} />) : <div className="p-4">{error ? error : 'No answers yet.'}</div>}
          </div>
        </div>
      </section>

      <section className="c-section" id="how">
        <div className="c-wrap">
          <p className="c-eyebrow">How it works</p>
          <h2 className="c-h2 mt-2">Publish once, ask in plain words, keep the receipt.</h2>
          <div className="c-steps mt-8">
            {[
              ['01', 'Publish', 'Write your terms in plain words, at most 1,500 characters, and price up to four uses you care about.'],
              ['02', 'Ask', 'Describe the use in at most 600 characters: where, how many, commercial or not, and for how long.'],
              ['03', 'Judge', 'Validators read the terms against the use and answer FREE, PAID with a tier, DENIED or UNCLEAR.'],
              ['04', 'Receipt', 'A yes becomes a public receipt tied to the exact license version. A paid yes is bought on the spot.'],
            ].map(([n, t, d]) => (
              <div key={n}>
                <p className="mono c-faint text-[12px]">{n}</p>
                <p className="c-h3 mt-3">{t}</p>
                <p className="c-muted mt-2 text-[14px] leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="c-section" id="creators">
        <div className="c-wrap c-grid-2">
          <div>
            <p className="c-eyebrow">For creators</p>
            <h2 className="c-h2 mt-2">Write your terms once. Answer only the unusual ones.</h2>
            <p className="c-lead mt-4">
              Illustrators, photographers, musicians, meme artists, indie developers and dataset owners already state their
              terms in a sentence or two. Clearance turns that sentence into an answering desk.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/publish" className="c-btn solid">Publish a work</Link>
              <Link href="/docs/concepts/writing-a-license" className="c-btn">How to write a license</Link>
            </div>
          </div>
          <div className="c-card divide-y divide-[var(--line)]">
            {[
              ['Your words, not a template', 'Say "fine for charity streams but not political ads" or "no AI training in any form". The judge reads exactly that.'],
              ['Price the uses you care about', 'Up to four tiers, each with a one-line scope and a price. A paid answer is bought on the spot and paid into your balance.'],
              ['Keep the last word', 'UNCLEAR requests come to your studio. Answer yes, no or a price, or grant an exception to a denial. Amend the license and the next request like it answers itself.'],
              ['Withdraw any time', 'Your balance leaves the contract in one top-level transfer to your wallet. Judging never moves money.'],
            ].map(([t, d]) => (
              <div key={t} className="p-5">
                <p className="font-medium">{t}</p>
                <p className="c-muted mt-1 text-[14px] leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="c-section" id="proof">
        <div className="c-wrap c-grid-2">
          <div>
            <p className="c-eyebrow">Receipts as proof</p>
            <h2 className="c-h2 mt-2">A screenshot of a DM proves nothing. A receipt does.</h2>
            <p className="c-lead mt-4">
              Each receipt is a public page, read straight from the contract. In a takedown dispute, send the link: it
              shows who asked, what they asked for word for word, the answer and why, and the exact license text it was
              issued under.
            </p>
          </div>
          <ul className="c-card divide-y divide-[var(--line)] text-[14.5px]">
            {[
              ['The use, word for word', 'The receipt covers that sentence and nothing larger. A small use cannot be stretched into a big one.'],
              ['The answer and the reason', 'The same verdict the validators agreed on, with the leader’s one-sentence reason.'],
              ['The license version and its hash', 'SHA3-256 of the license and its tiers, with a link to that exact text. Later amendments do not touch it.'],
              ['The transactions', 'The ask, and the purchase for a paid tier, each linked to the explorer.'],
            ].map(([t, d]) => (
              <li key={t} className="p-5">
                <p className="font-medium">{t}</p>
                <p className="c-muted mt-1 leading-relaxed">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="c-section" id="faq">
        <div className="c-wrap">
          <p className="c-eyebrow">FAQ</p>
          <h2 className="c-h2 mt-2">Questions people ask first.</h2>
          <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {FAQ.map((f) => (
              <div key={f.q}>
                <p className="font-medium">{f.q}</p>
                <p className="c-muted mt-2 text-[14.5px] leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="c-faint mt-10 text-[13px]">
            Contract{' '}
            <a className="c-link mono" href={addressUrl(CONTRACT)} target="_blank" rel="noreferrer">
              {CONTRACT}
            </a>{' '}
            on GenLayer Studio Next.
          </p>
        </div>
      </section>
    </>
  );
}
