import '@fontsource-variable/fraunces/index.css'
import '@fontsource-variable/fraunces/wght-italic.css'
import '@fontsource-variable/figtree/index.css'
import HomeFooter from '@/components/home/HomeFooter'
import HomeHeader from '@/components/home/HomeHeader'
import PostJobProvider from '@/components/home/PostJobProvider'
import { getSettings } from '@/lib/repos/settings'

export const dynamic = 'force-dynamic'

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()
  const phone = settings['site.phone'] || '1300 226 987'

  return (
    <div className="home-scope flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-charcoal px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <PostJobProvider>
        <HomeHeader phone={phone} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <HomeFooter
          phone={phone}
          email={settings['site.email'] || 'office@anytrade.com.au'}
          abn={settings['site.abn'] || ''}
        />
      </PostJobProvider>
    </div>
  )
}
