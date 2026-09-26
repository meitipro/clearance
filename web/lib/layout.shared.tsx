import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold">
          <svg width={22} height={22} viewBox="106 106 300 300" aria-hidden>
            <rect x="106" y="106" width="300" height="300" rx="46" fill="#a78bfa" />
            <path d="M318.6 181.8 A97 97 0 1 0 318.6 330.2" fill="none" stroke="#140c24" strokeWidth="40" strokeLinecap="round" />
          </svg>
          Clearance
          <span className="c-pill ml-1" style={{ height: 22, fontSize: 10.5 }}>
            <span className="dot" />
            Studio Next
          </span>
        </span>
      ),
      url: '/',
    },
    links: [
      { text: 'Works', url: '/explore' },
      { text: 'Receipts', url: '/receipts' },
      { text: 'For creators', url: '/#creators' },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
