import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'Knightsbridge DEX — Intelligence-Driven Trading',
  description: 'Launchpad, DEX, and on-chain intelligence platform. Track smart money, detect rug pulls, and trade with confidence.',
  keywords: ['DEX', 'launchpad', 'crypto', 'trading', 'blockchain', 'intelligence'],
  openGraph: {
    title: 'Knightsbridge DEX',
    description: 'Intelligence-Driven Trading Platform',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#0B0F14] text-[#E5E7EB] antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
