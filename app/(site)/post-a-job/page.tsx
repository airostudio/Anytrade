import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Panel, Stamp } from '@/components/ui'
import PostJobForm from './PostJobForm'

export const metadata: Metadata = {
  title: 'Post a job — free',
  description: 'Describe the job, get up to six quotes from local tradies. Free to post, free to compare.',
}
export const dynamic = 'force-dynamic'

export default async function PostJobPage({
  searchParams,
}: {
  searchParams: { category?: string; size?: string }
}) {
  const session = await auth()

  if (!session?.user) {
    const params = new URLSearchParams(searchParams as Record<string, string>)
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/post-a-job?${params.toString()}`)}`)
  }

  if (session.user.role === 'TRADESPERSON') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Panel className="p-7">
          <h1 className="font-display text-2xl">Tradie accounts can&apos;t post jobs</h1>
          <p className="mt-3 text-ink-soft">
            You&apos;re signed in as a tradie. Head to your leads feed to find work, or sign in with a
            homeowner account to post a job.
          </p>
          <Link href="/tradie/leads" className="btn-primary mt-5">
            Go to my leads
          </Link>
        </Panel>
      </div>
    )
  }

  if (session.user.role === 'ADMIN') redirect('/admin')

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <Stamp tone="bottle" className="mb-4 bg-canvas">
          Free to post · No obligation
        </Stamp>
        <h1 className="font-display text-4xl leading-tight">Tell us about the job</h1>
        <p className="mt-3 text-lg text-ink-soft">
          The more detail you give, the sharper the quotes. Two minutes now saves a week of phone tag.
        </p>
      </div>

      <Panel className="p-7">
        <PostJobForm
          defaultCategory={searchParams.category ?? ''}
          defaultSize={searchParams.size ?? 'ODD_JOB'}
        />
      </Panel>
    </div>
  )
}
