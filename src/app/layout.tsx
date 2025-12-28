import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'AlphaIntel - AI Knowledge Base for Investment Firms',
    template: '%s | AlphaIntel',
  },
  description: 'AI-powered knowledge base and deal intelligence platform for Venture Capital and Private Equity firms. Institutional memory that compounds.',
  keywords: [
    'venture capital',
    'private equity',
    'knowledge base',
    'deal intelligence',
    'due diligence',
    'portfolio management',
    'AI',
    'investment',
  ],
  authors: [{ name: 'AlphaIntel' }],
  creator: 'AlphaIntel',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AlphaIntel',
    title: 'AlphaIntel - AI Knowledge Base for Investment Firms',
    description: 'AI-powered knowledge base and deal intelligence platform for VC and PE firms.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AlphaIntel - AI Knowledge Base for Investment Firms',
    description: 'AI-powered knowledge base and deal intelligence platform for VC and PE firms.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
