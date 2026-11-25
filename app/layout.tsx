import type { Metadata } from 'next'
import '@fontsource-variable/fraunces/index.css'
import '@fontsource-variable/fraunces/wght-italic.css'
import '@fontsource-variable/figtree/index.css'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'AnyTrade — Reliable tradies, reasonable prices',
    template: '%s · AnyTrade',
  },
  description:
    'Australia’s home handyman and trades directory. Post a job free, compare quotes from licensed local tradies, and rate them both ways when the job is done.',
  openGraph: {
    title: 'AnyTrade — Reliable tradies, reasonable prices',
    description:
      'Post a small job, get real quotes from local tradies, and pay a fair price. Handyman specialists since 1968.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
