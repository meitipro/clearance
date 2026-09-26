import Link from 'next/link';

import { WalletButton } from './Wallet';

/** The site's mark, the same drawing as docs/brand/clearance-icon.svg without its ground. */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="106 106 300 300" aria-hidden style={{ flexShrink: 0 }}>
      <rect x="106" y="106" width="300" height="300" rx="46" fill="#a78bfa" />
      <path d="M318.6 181.8 A97 97 0 1 0 318.6 330.2" fill="none" stroke="#140c24" strokeWidth="40" strokeLinecap="round" />
    </svg>
  );
}

export function Nav() {
  return (
    <header className="c-nav">
      <div className="c-wrap c-nav-row">
        <Link href="/" className="c-brand" aria-label="Clearance home">
          <Mark />
          Clearance
        </Link>
        <nav className="c-links" aria-label="Main">
          <Link href="/explore">Works</Link>
          <Link href="/receipts">Receipts</Link>
          <Link href="/#creators">For creators</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="c-nav-right">
          <span className="c-pill hidden sm:inline-flex" title="GenLayer Studio Next, chain 61997">
            <span className="dot" />
            Studio Next
          </span>
          <WalletButton />
          <Link href="/publish" className="c-btn small solid hidden sm:inline-flex">
            Publish a work
          </Link>
        </div>
      </div>
    </header>
  );
}
