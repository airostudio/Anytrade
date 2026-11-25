import HomeShell from '@/components/home/HomeShell'

export const dynamic = 'force-dynamic'

export default function NetworkLayout({ children }: { children: React.ReactNode }) {
  return (
    <HomeShell footer="trust" accent="copper">
      {children}
    </HomeShell>
  )
}
