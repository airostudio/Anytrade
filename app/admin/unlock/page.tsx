import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { isGateUnlocked } from '@/lib/gates'
import { Panel, Stamp } from '@/components/ui'
import Logo from '@/components/Logo'
import UnlockForm from './UnlockForm'

export const metadata: Metadata = { title: 'Admin access', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

/**
 * Second factor for the back office: middleware has already checked the ADMIN
 * role, this checks the shared passcode.
 */
export default async function AdminUnlockPage({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')
  if (await isGateUnlocked('admin')) redirect(searchParams.next ?? '/admin')

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="md" tone="light" href="/" />
        </div>

        <Panel className="p-7">
          <Stamp tone="oxide" className="mb-5 bg-canvas">
            Staff only
          </Stamp>
          <h1 className="font-display text-3xl leading-tight">Back office</h1>
          <p className="mt-2 text-ink-soft">
            Signed in as <strong>{session.user.name}</strong>. Enter the admin passcode to continue.
          </p>

          <UnlockForm next={searchParams.next} />

          <p className="mt-6 border-t-2 border-dashed border-ink/25 pt-5 text-xs text-ink-mute">
            The passcode is separate from your login and rotates from Admin → Settings. Failed attempts
            are written to the audit log.
          </p>
        </Panel>
      </div>
    </div>
  )
}
