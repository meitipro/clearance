/** The JSON the contract's views return. Field names are the contract's own. */

export type Verdict = 'FREE' | 'PAID' | 'DENIED' | 'UNCLEAR';
export type Status = 'CLEARED' | 'OFFER' | 'DENIED' | 'WAITING' | 'DECLINED';

export type Tier = { id: string; name: string; scope: string; price: string };

export type Counts = {
  asks: number;
  free: number;
  paid: number;
  denied: number;
  unclear: number;
  answered: number;
  receipts: number;
};

export type WorkSummary = {
  id: number;
  owner: string;
  title: string;
  link: string;
  creator: string;
  kind: string;
  version: number;
  digest: string;
  tiers: Tier[];
  created_at: number;
  updated_at: number;
  counts: Counts;
  earned: string;
};

export type Work = WorkSummary & {
  found: true;
  license: string;
  balance: string;
  withdrawn: string;
};

export type LicenseVersion = {
  found: true;
  work_id: number;
  title: string;
  creator: string;
  version: number;
  latest: number;
  license: string;
  tiers: Tier[];
  digest: string;
  created_at: number;
};

export type Request = {
  id: number;
  work_id: number;
  title: string;
  creator: string;
  owner: string;
  link: string;
  version: number;
  digest: string;
  requester: string;
  use: string;
  asked_at: number;
  verdict: Verdict;
  tier: string;
  tier_name: string;
  conditions: string;
  reason: string;
  price: string;
  offer_tier: string;
  offer_name: string;
  offer_at: number;
  offer_until: number;
  decision: '' | 'FREE' | 'PAID' | 'DENIED';
  answered_by: string;
  answered_at: number;
  receipt: boolean;
  receipt_kind: '' | 'JUDGE' | 'CREATOR';
  holder: string;
  issued_at: number;
  paid: string;
  status: Status;
};

export type Page<T> = { total: number; offset: number; items: T[]; found?: boolean };
