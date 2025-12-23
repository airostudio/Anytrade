import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AnyTrade - Find Trusted Tradespeople",
  description: "Connect with verified tradespeople",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
