import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { isGateUnlocked } from '@/lib/gates'
import { getSettings } from '@/lib/repos/settings'
import { homegirlsStats } from '@/lib/repos/homegirls'
import { Panel, Stamp } from '@/components/ui'
import Logo from '@/components/Logo'
import EnterForm from './EnterForm'

export const metadata: Metadata = {
  title: 'Homegirls — members entrance',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function HomegirlsEnterPage() {
  if (await isGateUnlocked('homegirls')) redirect('/homegirls')

  const [settings, stats] = await Promise.all([getSettings(), homegirlsStats()])

  return (
    <div className="min-h-screen bg-oxide">
      <div className="hazard-tape" aria-hidden />
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-14 sm:px-6">
        <Logo size="md" tone="light" href="/" />

        <div className="mt-10 grid w-full gap-8 lg:grid-cols-[1fr_380px]">
          <div className="text-canvas">
            <Stamp tone="mustard" className="mb-5 bg-canvas">
              Members only
            </Stamp>
            <h1 className="font-display text-4xl leading-tight sm:text-5xl">The Homegirls</h1>
            <p className="mt-4 max-w-xl text-lg text-canvas/90">{settings['homegirls.intro']}</p>

            <dl className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t-2 border-canvas/30 pt-6">
              <div>
                <dt className="font-sign text-[11px] uppercase tracking-[0.18em] text-canvas/70">
                  Members
                </dt>
                <dd className="font-display text-3xl text-mustard">{stats.approved}</dd>
              </div>
              <div>
                <dt className="font-sign text-[11px] uppercase tracking-[0.18em] text-canvas/70">
                  Mentors
                </dt>
                <dd className="font-display text-3xl text-mustard">{stats.mentors}</dd>
              </div>
              <div>
                <dt className="font-sign text-[11px] uppercase tracking-[0.18em] text-canvas/70">
                  Jobs asking
                </dt>
                <dd className="font-display text-3xl text-mustard">{stats.jobsRequestingHomegirls}</dd>
              </div>
            </dl>

            <div className="mt-8 space-y-3 text-canvas/85">
              <p className="flex items-start gap-2">
                <span className="text-mustard" aria-hidden>
                  ✓
                </span>
                A members&apos; directory of women working in Australian trades
              </p>
              <p className="flex items-start gap-2">
                <span className="text-mustard" aria-hidden>
                  ✓
                </span>
                A private noticeboard — tools, jobs, advice and the occasional vent
              </p>
              <p className="flex items-start gap-2">
                <span className="text-mustard" aria-hidden>
                  ✓
                </span>
                Mentoring between apprentices and tradeswomen who have been at it for years
              </p>
              <p className="flex items-start gap-2">
                <span className="text-mustard" aria-hidden>
                  ✓
                </span>
                Jobs from customers who specifically asked for a woman tradesperson
              </p>
            </div>
          </div>

          <Panel className="h-fit p-7">
            <h2 className="font-display text-2xl leading-tight">Come in</h2>
            <p className="mt-2 text-sm text-ink-soft">
              This section is passcode protected. Members get the passcode when their application is
              approved.
            </p>

            <EnterForm />

            <div className="mt-6 space-y-3 border-t-2 border-dashed border-ink/25 pt-5 text-sm">
              <p className="text-ink-soft">
                Not a member yet?{' '}
                <Link href="/join/tradie" className="font-bold underline underline-offset-4">
                  Sign up as a tradie
                </Link>{' '}
                and tick the Homegirls box, or{' '}
                <Link href="/contact" className="font-bold underline underline-offset-4">
                  ask the office
                </Link>
                .
              </p>
              <p className="text-xs text-ink-mute">
                Looking to <em>hire</em> a woman tradesperson? You don&apos;t need the passcode — just
                tick &ldquo;I&apos;d prefer a woman tradesperson&rdquo; when you{' '}
                <Link href="/post-a-job" className="underline underline-offset-4">
                  post your job
                </Link>
                .
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
