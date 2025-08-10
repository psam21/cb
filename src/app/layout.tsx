import '../styles/globals.css'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Culture Bridge - Heritage Preservation Network',
  description: 'A decentralized platform built on Nostr to permanently preserve cultural practices, languages, and traditions. Empowering indigenous and minority communities to self-document their heritage.',
  keywords: ['culture', 'heritage', 'preservation', 'nostr', 'decentralized', 'indigenous', 'traditions', 'languages'],
  authors: [{ name: 'Culture Bridge Team' }],
  openGraph: {
    title: 'Culture Bridge - Heritage Preservation Network',
    description: 'Preserve Heritage, Empower Communities',
    type: 'website',
    url: 'https://culturebridge.org',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Culture Bridge - Heritage Preservation Network',
    description: 'Preserve Heritage, Empower Communities',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased">
        <Header />
        <main className="pt-16 lg:pt-20">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
