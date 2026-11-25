import HomeFooter from './HomeFooter'
import HomeHeader from './HomeHeader'
import PostJobProvider from './PostJobProvider'
import TrustFooter from '@/components/network/TrustFooter'
import { getSettings } from '@/lib/repos/settings'

/**
 * The shared page frame for every page in the newer design: skip link, sticky
 * header, the Post-a-Job dialog provider, and one of two footers.
 */
export default async function HomeShell({
  children,
  footer = 'standard',
  accent = 'terracotta',
}: {
  children: React.ReactNode
  footer?: 'standard' | 'trust'
  accent?: 'terracotta' | 'copper'
}) {
  const settings = await getSettings()
  const phone = settings['site.phone'] || '1300 226 987'
  const abn = settings['site.abn'] || ''

  return (
    <div className="home-scope flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-charcoal px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <PostJobProvider>
        <HomeHeader phone={phone} accent={accent} />
        <main id="main" className="flex-1">
          {children}
        </main>
        {footer === 'trust' ? (
          <TrustFooter phone={phone} abn={abn} />
        ) : (
          <HomeFooter phone={phone} email={settings['site.email'] || 'office@anytrade.com.au'} abn={abn} />
        )}
      </PostJobProvider>
    </div>
  )
}
