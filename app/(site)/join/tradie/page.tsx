import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth, homeForRole } from '@/lib/auth'
import { Panel, Stamp } from '@/components/ui'
import TradieSignUpForm from './TradieSignUpForm'

export const metadata: Metadata = { title: 'Join as a tradie' }
export const dynamic = 'force-dynamic'

export default async function TradieJoinPage() {
  const session = await auth()
  if (session?.user) redirect(homeForRole(session.user.role))

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="mb-8 text-center">
        <Stamp tone="bottle" className="mb-4 bg-canvas">
          5 free lead credits
        </Stamp>
        <h1 className="font-display text-4xl leading-tight">Get on the tools</h1>
        <p className="mx-auto mt-3 max-w-xl text-lg text-ink-soft">
          Set your listing up once. Quote on the jobs that suit you, keep 100% of what you invoice.
        </p>
      </div>

      <Panel className="p-7">
        <TradieSignUpForm />
      </Panel>

      <p className="mt-8 text-center text-sm text-ink-soft">
        Just need a job done?{' '}
        <Link href="/join/client" className="font-bold underline underline-offset-4 hover:text-oxide">
          Sign up as a homeowner
        </Link>
      </p>
    </div>
  )
}
