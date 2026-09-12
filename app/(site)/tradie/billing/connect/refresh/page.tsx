import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { beginOnboarding } from '@/lib/connect'

export const dynamic = 'force-dynamic'

/**
 * Stripe's `refresh_url`. It lands here when an onboarding link expires before
 * the tradie finishes, so the only job is to mint a fresh link and send them
 * straight back in.
 */
export default async function ConnectRefreshPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'TRADESPERSON') redirect('/signin')

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) redirect('/tradie/billing')

  try {
    const { url } = await beginOnboarding(tradie)
    if (url) redirect(url)
  } catch (error) {
    // redirect() throws by design — only log anything that isn't that.
    if (error && typeof error === 'object' && 'digest' in error) throw error
    console.error('[connect] refresh failed', error)
  }

  redirect('/tradie/billing?connect=retry')
}
