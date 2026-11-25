import HomeShell from '@/components/home/HomeShell'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <HomeShell>{children}</HomeShell>
}
