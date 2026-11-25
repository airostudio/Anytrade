import HomeShell from '@/components/home/HomeShell'

export const dynamic = 'force-dynamic'

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <HomeShell>{children}</HomeShell>
}
