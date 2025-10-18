import '../styles/globals.css';
import '../styles/tiptap.css';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Plus_Jakarta_Sans, Noto_Sans } from 'next/font/google';
import { CartSyncProvider } from '@/components/providers/CartSyncProvider';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

const noto = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
  variable: '--font-noto',
});

export const metadata: Metadata = {
  title: 'Culture Bridge - Heritage Preservation Network',
  description:
    'A decentralized platform built on Nostr to permanently preserve cultural practices, languages, and traditions. Empowering indigenous and minority communities to self-document their heritage.',
  keywords: [
    'culture',
    'heritage',
    'preservation',
    'nostr',
    'decentralized',
    'indigenous',
    'traditions',
    'languages',
  ],
  authors: [{ name: 'Culture Bridge Team' }],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Culture Bridge - Heritage Preservation Network',
    description: 'Preserve Heritage, Empower Communities',
    type: 'website',
    url: 'https://culturebridge.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Culture Bridge - Heritage Preservation Network',
    description: 'Preserve Heritage, Empower Communities',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${noto.variable} scroll-smooth`}>
      <body className="font-sans antialiased">
        {/* QW8: Skip to content link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:text-primary-800 focus:px-4 focus:py-2 focus:rounded shadow"
        >
          Skip to main content
        </a>
        <CartSyncProvider>
          <Header />
          <main id="main-content" className="pt-16 lg:pt-20" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </CartSyncProvider>
        <Analytics />
      </body>
    </html>
  );
}
