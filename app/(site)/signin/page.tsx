import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth, homeForRole } from '@/lib/auth'
import { Panel, Stamp } from '@/components/ui'
import SignInForm from './SignInForm'

export const metadata: Metadata = { title: 'Sign in' }
export const dynamic = 'force-dynamic'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string }
}) {
  const session = await auth()
  if (session?.user) redirect(homeForRole(session.user.role))

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <Stamp tone="oxide" className="mx-auto mb-6 bg-canvas">
        Members entrance
      </Stamp>

      <Panel className="p-7">
        <h1 className="font-display text-3xl leading-tight">Sign in</h1>
        <p className="mt-2 text-ink-soft">
          One login for homeowners, tradies and staff — we send you to the right place.
        </p>

        <Suspense fallback={null}>
          <SignInForm callbackUrl={searchParams.callbackUrl} />
        </Suspense>

        <p className="mt-6 border-t-2 border-dashed border-ink/25 pt-5 text-sm text-ink-soft">
          No account yet?{' '}
          <Link href="/join" className="font-bold underline underline-offset-4 hover:text-oxide">
            Join AnyTrade
          </Link>
        </p>
      </Panel>
    </div>
  )
}
