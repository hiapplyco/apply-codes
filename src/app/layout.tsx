import type { Metadata } from 'next';
import { Providers } from './providers';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Apply - Agentic Talent Sourcing & Acquisition',
  description:
    'Apply revolutionizes recruitment with AI agents that attract and find exceptional talent. The agentic approach to talent sourcing.',
  openGraph: {
    type: 'website',
    title: 'Apply - Agentic Talent Sourcing & Acquisition',
    description:
      'Apply revolutionizes recruitment with AI agents that attract and find exceptional talent.',
    images: [
      'https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos/Apply2025logo.png',
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apply - Agentic Talent Sourcing & Acquisition',
    description:
      'Apply revolutionizes recruitment with AI agents that attract and find exceptional talent.',
  },
  icons: {
    icon: 'https://kxghaajojntkqrmvsngn.supabase.co/storage/v1/object/public/logos/Apply2025logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          data-domain="apply.codes"
          src="https://plausible.io/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
