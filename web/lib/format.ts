import type { Request, Tier, Verdict } from './types';

const GEN = 10n ** 18n;

/** Wei as GEN: 40 GEN, 0.5 GEN, 1.25 GEN. Never through a float. */
export function gen(wei: string | bigint | number, unit = true): string {
  const value = BigInt(wei);
  const whole = value / GEN;
  const frac = value % GEN;
  let text = whole.toLocaleString('en-US');
  if (frac !== 0n) {
    const digits = frac.toString().padStart(18, '0').replace(/0+$/, '');
    text += '.' + digits.slice(0, 6);
  }
  return unit ? `${text} GEN` : text;
}

/** GEN typed by a person ("40", "0.5") to wei; null when it is not a number. */
export function toWei(text: string): bigint | null {
  const clean = text.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(clean)) return null;
  const [whole, frac = ''] = clean.split('.');
  return BigInt(whole) * GEN + BigInt((frac + '0'.repeat(18)).slice(0, 18));
}

export function short(address: string, head = 6, tail = 4): string {
  if (!address) return '';
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

export function shortHash(hash: string): string {
  return hash ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : '';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Chain seconds as "Sep 24, 2026", in UTC so server and browser agree. */
export function day(seconds: number): string {
  if (!seconds) return '';
  const d = new Date(seconds * 1000);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function dayTime(seconds: number): string {
  if (!seconds) return '';
  const d = new Date(seconds * 1000);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day(seconds)}, ${hh}:${mm} UTC`;
}

export function receiptNo(id: number): string {
  return `RC-${String(id).padStart(4, '0')}`;
}

/** "RC-0042", "rc-42" or "42" to 42. */
export function parseReceiptNo(text: string): number | null {
  const match = /^(?:rc-?)?0*(\d{1,9})$/i.exec(decodeURIComponent(text).trim());
  return match ? Number(match[1]) : null;
}

export const KIND_LABEL: Record<string, string> = {
  illustration: 'Illustration',
  photo: 'Photograph',
  music: 'Music',
  video: 'Video',
  font: 'Font',
  dataset: 'Dataset',
  code: 'Code',
  other: 'Work',
};

/** "PAID · MERCH", "FREE", with the tier the answer names. */
export function verdictLabel(verdict: Verdict | string, tierName = ''): string {
  if (verdict === 'PAID' && tierName) return `PAID · ${tierName.toUpperCase()}`;
  return String(verdict);
}

/** What the page shows as the answer: the creator's word when they gave one, else the judge's. */
export function answerOf(r: Request): { label: string; verdict: Verdict; byCreator: boolean } {
  if (r.decision) {
    const v = r.decision as Verdict;
    return { label: verdictLabel(v, r.offer_name), verdict: v, byCreator: true };
  }
  return { label: verdictLabel(r.verdict, r.tier_name), verdict: r.verdict, byCreator: false };
}

export function tierPrice(t: Tier): string {
  return gen(t.price);
}

export function firstWords(text: string, count = 9): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length <= count ? text : words.slice(0, count).join(' ') + '…';
}

export function plural(n: number, one: string, many = one + 's'): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
}
