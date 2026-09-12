import type { Metadata } from 'next'
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
      <head>
        {/* Loaded in the browser rather than via next/font so the build has no
            outbound font dependency. Fallback stacks are set in tailwind.config. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- the rule
            targets the Pages Router's _document; this is the App Router root
            layout, so the stylesheet is applied site-wide, not per page. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Oswald:wght@400;500;600;700&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Courier+Prime:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
