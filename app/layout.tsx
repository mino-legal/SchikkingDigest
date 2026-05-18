import type { Metadata } from 'next';
import './globals.css';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://schikken.mino.law').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'SchikkingsDigest',
  description: 'Wekelijkse digest van Nederlandse (tucht)rechtspraak over schikken en minnelijke regelingen.',
  openGraph: {
    title: 'SchikkingsDigest',
    description: 'Wekelijkse digest van Nederlandse (tucht)rechtspraak over schikken en minnelijke regelingen.',
    url: siteUrl,
    siteName: 'SchikkingsDigest',
    locale: 'nl_NL',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SchikkingsDigest',
    description: 'Wekelijkse digest van Nederlandse (tucht)rechtspraak over schikken en minnelijke regelingen.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="bg-brand-bg text-brand-darkgray antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
