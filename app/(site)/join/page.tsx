import Link from 'next/link'
import type { Metadata } from 'next'
import { Panel, Stamp } from '@/components/ui'

export const metadata: Metadata = { title: 'Join AnyTrade' }

export default function JoinPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <Stamp tone="oxide" className="mb-5 bg-canvas">
          Free to join
        </Stamp>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">Which one are you?</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
          Homeowners post jobs for nothing. Tradies pay only for the leads they choose to quote on.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Panel className="flex flex-col p-7">
          <span className="text-4xl" aria-hidden>
            🏠
          </span>
          <h2 className="mt-3 font-sign text-2xl font-bold uppercase tracking-wide">
            I need something done
          </h2>
          <p className="mt-2 flex-1 text-ink-soft">
            Post a job, get up to six real quotes from local tradies, compare their ratings and prices,
            and pick one. Free, always.
          </p>
          <ul className="my-5 space-y-1.5 text-sm text-ink-soft">
            <li>✓ Free to post and free to compare</li>
            <li>✓ Quotes include GST, itemised</li>
            <li>✓ Optional escrow — pay when you sign off</li>
            <li>✓ Rate your tradie when the job is done</li>
          </ul>
          <Link href="/join/client" className="btn-primary w-full">
            Sign up as a homeowner
          </Link>
        </Panel>

        <Panel tone="navy" className="flex flex-col p-7">
          <span className="text-4xl" aria-hidden>
            🧰
          </span>
          <h2 className="mt-3 font-sign text-2xl font-bold uppercase tracking-wide text-safety">
            I&apos;m a tradie
          </h2>
          <p className="mt-2 flex-1 text-canvas/85">
            Fill the gaps in your week. Quote on the jobs that suit you, build a rating that wins the
            next one, and keep every dollar you invoice.
          </p>
          <ul className="my-5 space-y-1.5 text-sm text-canvas/85">
            <li>✓ 5 free lead credits to start</li>
            <li>✓ No commission on your invoice</li>
            <li>✓ Memberships from $49/month, cancel any time</li>
            <li>✓ Your licence checked and badged</li>
          </ul>
          <Link href="/join/tradie" className="btn-primary w-full">
            Sign up as a tradie
          </Link>
        </Panel>
      </div>

      <p className="mt-10 text-center text-ink-soft">
        Already with us?{' '}
        <Link href="/signin" className="font-bold underline underline-offset-4 hover:text-oxide">
          Sign in
        </Link>
      </p>
    </div>
  )
}
