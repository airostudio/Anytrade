import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth, homeForRole } from '@/lib/auth'
import { Panel } from '@/components/ui'
import { safeNext } from '@/lib/trust'
import ClientSignUpForm from './ClientSignUpForm'

export const metadata: Metadata = { title: 'Sign up as a homeowner' }
export const dynamic = 'force-dynamic'

export default async function ClientJoinPage({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  const session = await auth()
  if (session?.user) redirect(homeForRole(session.user.role))

  return (
    <div className="mx-auto max-w-xl px-4 py-14">
      <Panel className="p-7">
        <h1 className="font-display text-3xl leading-tight">Post jobs for free</h1>
        <p className="mt-2 text-ink-soft">
          Takes about a minute. You&apos;ll be able to post your first job straight after.
        </p>
        <ClientSignUpForm next={safeNext(searchParams.next)} />
        <p className="mt-6 border-t-2 border-dashed border-ink/25 pt-5 text-sm text-ink-soft">
          Are you a tradie?{' '}
          <Link href="/join/tradie" className="font-bold underline underline-offset-4 hover:text-oxide">
            Sign up over here
          </Link>
        </p>
      </Panel>
    </div>
  )
}
