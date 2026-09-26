'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import contract from '@/lib/contract.generated.json';
import { KIND_LABEL } from '@/lib/format';
import { refreshReads, send, type TxState } from '@/lib/write';

import { TxProgress } from './Actions';
import { JudgePreview, TiersEditor, tierProblems, tiersPayload, type DraftTier } from './TermsEditor';
import { WalletGate, useWallet } from './Wallet';

const L = contract.limits;

const HINTS = [
  'Say what is free, and under which conditions (credit, a link).',
  'Say what needs a tier, using words a stranger would use: monetised, client work, printed, over 500 units.',
  'Say what is never allowed, plainly: "No AI training, in any form."',
  'Anything you leave out comes back to you as UNCLEAR. That is the safe default, not a failure.',
];

export function PublishForm() {
  const w = useWallet();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [creator, setCreator] = useState('');
  const [kind, setKind] = useState('illustration');
  const [license, setLicense] = useState('');
  const [tiers, setTiers] = useState<DraftTier[]>([{ id: 'commercial', name: 'Commercial', scope: '', price: '' }]);
  const [state, setState] = useState<TxState>({ phase: 'idle' });
  const busy = state.phase === 'signing' || state.phase === 'deciding';

  const problems = [
    ...(title.trim() ? [] : ['Give the work a title.']),
    ...(/^https?:\/\/[^\s<>]+\.[^\s<>]+/i.test(link.trim()) ? [] : ['Add a link that starts with https:// to the work or your page.']),
    ...(license.trim() ? [] : ['Write the license.']),
    ...tierProblems(tiers),
  ];

  async function publish() {
    const terms = JSON.stringify({ creator: creator.trim(), kind, tiers: tiersPayload(tiers) });
    const done = await send(w.account, 'publish_work', [title.trim(), link.trim(), license.trim(), terms], 0n, setState);
    if (done.phase === 'done') {
      await refreshReads(['works']);
      router.push(`/w/${Number(done.returned)}`);
    }
  }

  return (
    <div className="c-grid-2">
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="c-label">Title</span>
            <input className="c-input" value={title} maxLength={L.title} onChange={(e) => setTitle(e.target.value)} placeholder="Fox in the Reeds" disabled={busy} />
          </label>
          <label>
            <span className="c-label">Your name, as credit should read</span>
            <input className="c-input" value={creator} maxLength={L.creator} onChange={(e) => setCreator(e.target.value)} placeholder="Nara Ito" disabled={busy} />
          </label>
          <label>
            <span className="c-label">Type</span>
            <select className="c-select" value={kind} onChange={(e) => setKind(e.target.value)} disabled={busy}>
              {contract.kinds.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k] ?? k}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="c-label">Link to the work or your page</span>
            <input className="c-input" value={link} maxLength={L.link} onChange={(e) => setLink(e.target.value)} placeholder="https://naraito.art/fox" disabled={busy} />
          </label>
        </div>

        <label>
          <span className="c-label flex justify-between">
            <span>License, in your own words</span>
            <span className="mono c-faint">
              {license.length} / {L.license}
            </span>
          </span>
          <textarea
            className="c-textarea"
            style={{ minHeight: 170 }}
            value={license}
            maxLength={L.license}
            onChange={(e) => setLicense(e.target.value)}
            placeholder="Free for personal use, with credit to Nara Ito. Any commercial use, including monetised videos and client work, needs the commercial tier. No AI training, in any form."
            disabled={busy}
          />
        </label>
        <ul className="c-note flex list-disc flex-col gap-1 pl-8">
          {HINTS.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>

        <div>
          <p className="c-label">Paid tiers, up to four</p>
          <TiersEditor tiers={tiers} onChange={setTiers} disabled={busy} />
        </div>
      </div>

      <div className="flex flex-col gap-5 lg:sticky lg:top-[84px]">
        <div>
          <p className="c-eyebrow">Preview: what the validators read</p>
          <div className="mt-3">
            <JudgePreview license={license} tiers={tiers} version={1} />
          </div>
        </div>
        {problems.length > 0 && (
          <ul className="c-note flex list-disc flex-col gap-1 pl-8">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        <WalletGate action="publish">
          <button className="c-btn solid wide" onClick={publish} disabled={busy || problems.length > 0}>
            Sign and publish
          </button>
        </WalletGate>
        <TxProgress state={state} waiting="Validators are recording the work" />
        <p className="c-faint text-[13px] leading-relaxed">
          Publishing makes you the creator on record for this work: the only account that can amend its license, answer its
          requests and withdraw what it earns. Publish only work you have the right to license.
        </p>
      </div>
    </div>
  );
}
