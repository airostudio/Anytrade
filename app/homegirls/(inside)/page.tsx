import Link from 'next/link'
import { auth } from '@/lib/auth'
import Stars from '@/components/Stars'
import { EmptyState, Panel, Pill, SectionHeading, StatTile, Stamp } from '@/components/ui'
import { homegirlsStats, listMembers, listPosts, getMemberByTradie } from '@/lib/repos/homegirls'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { searchJobs } from '@/lib/repos/jobs'
import { getSettings } from '@/lib/repos/settings'
import { categoryName } from '@/lib/constants'
import { budgetRange, formatDate, timeAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const POST_CATEGORIES = [
  { slug: 'all', label: 'Everything' },
  { slug: 'noticeboard', label: 'Noticeboard' },
  { slug: 'advice', label: 'Advice' },
  { slug: 'tools', label: 'Tools & gear' },
  { slug: 'jobs', label: 'Work going' },
  { slug: 'events', label: 'Meet-ups' },
]

export default async function HomegirlsPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
  const session = await auth()

  const [members, posts, stats, settings, homegirlJobs] = await Promise.all([
    listMembers('APPROVED'),
    listPosts({ category: searchParams.category ?? 'all', limit: 30 }),
    homegirlsStats(),
    getSettings(),
    searchJobs({ homegirlsOnly: true, status: ['OPEN', 'SHORTLISTING'], limit: 6 }),
  ])

  const tradie = session?.user?.role === 'TRADESPERSON' ? await getTradieByUserId(session.user.id) : null
  const membership = tradie ? await getMemberByTradie(tradie.id) : null
  const mentors = members.filter((m) => m.mentor_available)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Stamp tone="oxide" className="mb-4 bg-canvas">
          Members only
        </Stamp>
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">The Homegirls</h1>
        <p className="mt-3 max-w-3xl text-lg text-ink-soft">{settings['homegirls.intro']}</p>
      </div>

      {membership ? (
        <Panel
          tone={membership.status === 'APPROVED' ? 'navy' : 'mustard'}
          className="mb-8 flex flex-wrap items-center justify-between gap-4 p-5"
        >
          <div>
            <p className="font-sign text-lg font-bold uppercase tracking-wide">
              {membership.status === 'APPROVED'
                ? `You're in — member since ${formatDate(membership.joined_at)}`
                : `Your application is ${membership.status.toLowerCase()}`}
            </p>
            <p className="mt-1 text-sm opacity-85">
              {membership.status === 'APPROVED'
                ? 'Your listing carries the Homegirls badge and you can quote on jobs asking for a woman tradesperson.'
                : 'An admin reviews every application. We will let you know as soon as it is looked at.'}
            </p>
          </div>
          <Link href="/homegirls/join" className="btn-primary btn-sm">
            {membership.status === 'APPROVED' ? 'Post to the noticeboard' : 'Update application'}
          </Link>
        </Panel>
      ) : (
        <Panel tone="mustard" className="mb-8 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-sign text-lg font-bold uppercase tracking-wide">Not a member yet</p>
            <p className="mt-1 text-sm text-ink-soft">
              {session?.user?.role === 'TRADESPERSON'
                ? 'Apply and an admin will review it, usually within a day.'
                : 'Membership is for tradie accounts. You can still read the network from here.'}
            </p>
          </div>
          <Link href="/homegirls/join" className="btn-oxide btn-sm">
            Apply to join
          </Link>
        </Panel>
      )}

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Members" value={stats.approved} tone="oxide" />
        <StatTile label="Offering mentoring" value={stats.mentors} tone="mustard" />
        <StatTile label="Noticeboard posts" value={stats.posts} tone="navy" />
        <StatTile
          label="Jobs asking for a woman"
          value={stats.jobsRequestingHomegirls}
          tone="bottle"
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          {/* Noticeboard */}
          <section>
            <SectionHeading
              eyebrow="Private"
              title="The noticeboard"
              action={
                <Link href="/homegirls/join" className="btn-ghost btn-sm">
                  Write a post
                </Link>
              }
            />

            <div className="mb-5 flex flex-wrap gap-2">
              {POST_CATEGORIES.map((category) => {
                const active =
                  (searchParams.category ?? 'all') === category.slug
                return (
                  <Link
                    key={category.slug}
                    href={category.slug === 'all' ? '/homegirls' : `/homegirls?category=${category.slug}`}
                    className={`border-2 border-ink px-3 py-1.5 font-sign text-xs font-bold uppercase tracking-widest ${
                      active ? 'bg-oxide text-canvas' : 'bg-canvas hover:bg-mustard'
                    }`}
                  >
                    {category.label}
                  </Link>
                )
              })}
            </div>

            {posts.length ? (
              <ul className="space-y-4">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Panel className={`p-5 ${post.is_pinned ? 'border-oxide' : ''}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        {post.is_pinned ? (
                          <Pill className="border-oxide bg-oxide text-canvas">Pinned</Pill>
                        ) : null}
                        <Pill className="border-ink bg-canvas-deep text-ink-soft">{post.category}</Pill>
                      </div>
                      <h3 className="mt-2 font-sign text-xl font-bold uppercase leading-tight">
                        {post.title}
                      </h3>
                      <p className="mt-2 whitespace-pre-line text-ink-soft">{post.body}</p>
                      <p className="mt-3 border-t-2 border-dashed border-ink/25 pt-3 text-xs text-ink-mute">
                        {post.author_slug ? (
                          <Link href={`/find-a-tradie/${post.author_slug}`} className="underline">
                            {post.author_business ?? post.author_name}
                          </Link>
                        ) : (
                          (post.author_business ?? post.author_name ?? 'AnyTrade office')
                        )}{' '}
                        · {timeAgo(post.created_at)}
                      </p>
                    </Panel>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon="📌"
                title="Nothing on the board yet"
                blurb="Be the first to post — a tip, a tool for sale, or a job you can't get to."
                action={
                  <Link href="/homegirls/join" className="btn-oxide">
                    Write the first post
                  </Link>
                }
              />
            )}
          </section>

          {/* Members directory */}
          <section>
            <SectionHeading
              eyebrow="Who's here"
              title="Members directory"
              blurb="Every one of these is a verified AnyTrade listing. Refer work to each other."
            />

            {members.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {members.map((member) => (
                  <Panel key={member.id} className="p-5 card-lift">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-sign text-lg font-bold uppercase tracking-wide">
                          <Link href={`/find-a-tradie/${member.slug}`} className="hover:text-oxide">
                            {member.business_name}
                          </Link>
                        </h3>
                        <p className="truncate text-sm text-ink-mute">
                          {member.tradie_name} · {member.base_suburb ?? '—'}, {member.state ?? '—'}
                        </p>
                      </div>
                      {member.verification_status === 'VERIFIED' ? (
                        <Pill className="shrink-0 border-bottle bg-bottle text-canvas">✓</Pill>
                      ) : null}
                    </div>

                    <div className="mt-2">
                      <Stars
                        value={member.average_rating}
                        size="sm"
                        showValue
                        count={member.total_reviews}
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {member.trades.slice(0, 3).map((trade) => (
                        <Pill key={trade} className="border-ink bg-canvas-deep text-ink-soft">
                          {categoryName(trade)}
                        </Pill>
                      ))}
                    </div>

                    {member.intro ? (
                      <p className="mt-3 border-t-2 border-dashed border-ink/25 pt-3 text-sm italic text-ink-soft">
                        “{member.intro}”
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {member.mentor_available ? (
                        <Pill className="border-oxide bg-oxide text-canvas">Mentors</Pill>
                      ) : null}
                      {member.seeking_mentor ? (
                        <Pill className="border-ink bg-mustard text-ink">Looking for a mentor</Pill>
                      ) : null}
                      <Pill className="border-ink/40 bg-transparent text-ink-mute">
                        {member.completed_jobs} jobs
                      </Pill>
                    </div>
                  </Panel>
                ))}
              </div>
            ) : (
              <EmptyState icon="👷‍♀️" title="No approved members yet" />
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <Panel tone="oxide" className="p-5 text-canvas">
            <h2 className="font-sign text-sm font-bold uppercase tracking-[0.2em] text-mustard">
              Jobs asking for a woman
            </h2>
            {homegirlJobs.length ? (
              <ul className="mt-3 space-y-3">
                {homegirlJobs.map((job) => (
                  <li key={job.id} className="border-b border-canvas/25 pb-3 last:border-0">
                    <Link
                      href={tradie ? `/tradie/leads/${job.id}` : '/join/tradie'}
                      className="font-sign text-sm font-bold uppercase tracking-wide underline-offset-4 hover:underline"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-canvas/80">
                      {categoryName(job.category)} · {job.suburb} ·{' '}
                      {budgetRange(job.budget_min, job.budget_max)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-canvas/85">
                Nothing open right now. Customers tick a box when posting to request a woman
                tradesperson — those jobs land here and in members&apos; lead feeds.
              </p>
            )}
          </Panel>

          {mentors.length ? (
            <Panel tone="manila" className="p-5">
              <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em]">
                Happy to mentor
              </h2>
              <ul className="space-y-2 text-sm">
                {mentors.slice(0, 8).map((mentor) => (
                  <li key={mentor.id}>
                    <Link href={`/find-a-tradie/${mentor.slug}`} className="font-semibold underline-offset-4 hover:underline">
                      {mentor.tradie_name}
                    </Link>
                    <span className="block text-xs text-ink-mute">
                      {mentor.trades.map(categoryName).join(', ')} ·{' '}
                      {mentor.years_experience ? `${mentor.years_experience} yrs` : 'experienced'}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel className="p-5">
            <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em]">House rules</h2>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>· What is said here stays here.</li>
              <li>· Refer work you can&apos;t take to someone on this list.</li>
              <li>· No spruiking products you get a kickback on without saying so.</li>
              <li>· Apprentices ask anything. Nobody gets laughed at.</li>
              <li>· Report anything out of line to the office.</li>
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
