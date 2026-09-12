import Link from 'next/link'
import { auth } from '@/lib/auth'
import { Panel, SectionHeading } from '@/components/ui'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { getMemberByTradie } from '@/lib/repos/homegirls'
import { formatDate } from '@/lib/utils'
import JoinForms from './JoinForms'

export const dynamic = 'force-dynamic'

export default async function HomegirlsJoinPage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Panel className="p-7">
          <h1 className="font-display text-2xl">Sign in first</h1>
          <p className="mt-3 text-ink-soft">
            You can read the network with the passcode, but applying and posting needs an AnyTrade
            account.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/signin?callbackUrl=/homegirls/join" className="btn-primary">
              Sign in
            </Link>
            <Link href="/join/tradie" className="btn-ghost">
              Join as a tradie
            </Link>
          </div>
        </Panel>
      </div>
    )
  }

  const tradie =
    session.user.role === 'TRADESPERSON' ? await getTradieByUserId(session.user.id) : null
  const membership = tradie ? await getMemberByTradie(tradie.id) : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <SectionHeading
        eyebrow="Members"
        title="Join & post"
        blurb="Apply for membership, and once you're in, post to the noticeboard."
      />

      {!tradie ? (
        <Panel tone="mustard" className="mb-6 p-5">
          <p className="font-sign font-bold uppercase tracking-wide">Tradie accounts only</p>
          <p className="mt-1 text-sm text-ink-soft">
            Homegirls membership is for women working in the trades. If that&apos;s you,{' '}
            <Link href="/join/tradie" className="font-bold underline underline-offset-4">
              set up a tradie account
            </Link>{' '}
            first. You can still read the network and post to the noticeboard.
          </p>
        </Panel>
      ) : membership ? (
        <Panel
          tone={membership.status === 'APPROVED' ? 'navy' : 'manila'}
          className="mb-6 p-5"
        >
          <p className="font-sign font-bold uppercase tracking-wide">
            Application status: {membership.status}
          </p>
          <p className="mt-1 text-sm opacity-85">
            {membership.status === 'APPROVED'
              ? `Approved ${formatDate(membership.joined_at)}. You can update your intro below any time.`
              : 'An admin will review it shortly. You can update your intro in the meantime.'}
          </p>
        </Panel>
      ) : null}

      <JoinForms
        canApply={Boolean(tradie)}
        defaults={{
          intro: membership?.intro ?? '',
          mentorAvailable: membership?.mentor_available ?? false,
          seekingMentor: membership?.seeking_mentor ?? false,
        }}
      />
    </div>
  )
}
