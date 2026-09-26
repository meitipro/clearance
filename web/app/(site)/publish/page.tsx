import type { Metadata } from 'next';

import { PublishForm } from '@/components/PublishForm';

export const metadata: Metadata = { title: 'Publish a work' };

export default function Publish() {
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">Publish</p>
      <h1 className="c-h2 mt-2">Write your terms once, in your own words</h1>
      <p className="c-lead mt-3">
        Your license becomes version 1. Anyone can then ask about a use and get an answer in about a minute. You can amend
        it later; receipts already issued keep their version.
      </p>
      <div className="mt-8">
        <PublishForm />
      </div>
    </div>
  );
}
