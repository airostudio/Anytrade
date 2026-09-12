import Link from 'next/link'
import { Panel, Pill, SectionHeading, StatTile } from '@/components/ui'
import Stars from '@/components/Stars'
import { homegirlsStats, listMembers, listPosts } from '@/lib/repos/homegirls'
import { adminModeratePost, adminSetHomegirlStatus } from '@/app/actions/admin'
import { categoryName } from '@/lib/constants'
import { formatDate, timeAgo } from '@/lib/utils'
import type { HomegirlsStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STATUSES: HomegirlsStatus[] = ['PENDING', 'APPROVED', 'DECLINED', 'SUSPENDED']

export default async function AdminHomegirlsPage() {
  const [members, posts, stats] = await Promise.all([
    listMembers('ALL'),
    listPosts({ includeHidden: true, limit: 50 }),
    homegirlsStats(),
  ])

  const pending = members.filter((m) => m.status === 'PENDING')

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Members only"
        title="Homegirls network"
        blurb="Approve members, moderate the noticeboard and keep an eye on demand for women tradies."
        action={
          <Link href="/homegirls" className="btn-ghost btn-sm">
            View the network
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Approved members" value={stats.approved} tone="bottle" />
        <StatTile
          label="Applications"
          value={stats.pending}
          tone={stats.pending ? 'oxide' : 'canvas'}
        />
        <StatTile label="Mentors available" value={stats.mentors} tone="mustard" />
        <StatTile label="Noticeboard posts" value={stats.posts} tone="navy" />
        <StatTile
          label="Jobs asking for a woman"
          value={stats.jobsRequestingHomegirls}
          tone="safety"
        />
      </div>

      {pending.length ? (
        <section>
          <h2 className="mb-3 font-sign text-lg font-bold uppercase tracking-[0.2em] text-oxide">
            Waiting on you
          </h2>
          <div className="space-y-3">
            {pending.map((member) => (
              <Panel key={member.id} tone="mustard" className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-sign text-lg font-bold uppercase tracking-wide">
                      {member.business_name}
                    </h3>
                    <p className="text-sm text-ink-soft">
                      {member.tradie_name} · {member.base_suburb ?? '—'}, {member.state ?? '—'} ·{' '}
                      {member.trades.map(categoryName).join(', ')}
                    </p>
                    {member.intro ? (
                      <p className="mt-2 border-l-4 border-ink/25 pl-3 text-sm text-ink-soft">
                        “{member.intro}”
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-ink-mute">
                      Applied {timeAgo(member.created_at)}
                      {member.mentor_available ? ' · offering to mentor' : ''}
                      {member.seeking_mentor ? ' · looking for a mentor' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={adminSetHomegirlStatus}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <button type="submit" className="btn-primary btn-sm">
                        Approve
                      </button>
                    </form>
                    <form action={adminSetHomegirlStatus}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="hidden" name="status" value="DECLINED" />
                      <button type="submit" className="btn-ghost btn-sm">
                        Decline
                      </button>
                    </form>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
          All members
        </h2>
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Trades</th>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-dashed border-ink/20">
                  <td className="px-4 py-3">
                    <Link href={`/find-a-tradie/${member.slug}`} className="font-semibold hover:text-oxide">
                      {member.business_name}
                    </Link>
                    <span className="block text-xs text-ink-mute">{member.tradie_name}</span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {member.trades.map(categoryName).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {member.base_suburb ?? '—'}, {member.state ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Stars value={member.average_rating} size="sm" showValue count={member.total_reviews} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-mute">
                    {member.joined_at ? formatDate(member.joined_at) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Pill
                      className={
                        member.status === 'APPROVED'
                          ? 'border-bottle bg-bottle text-canvas'
                          : member.status === 'PENDING'
                            ? 'border-ink bg-mustard text-ink'
                            : 'border-oxide bg-oxide text-canvas'
                      }
                    >
                      {member.status}
                    </Pill>
                  </td>
                  <td className="px-4 py-3">
                    <form action={adminSetHomegirlStatus} className="flex gap-1.5">
                      <input type="hidden" name="memberId" value={member.id} />
                      <select
                        name="status"
                        defaultValue={member.status}
                        className="border-2 border-ink px-1.5 py-1 text-xs"
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="border-2 border-ink px-2 py-1 font-sign text-[11px] font-bold uppercase hover:bg-safety"
                      >
                        Set
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!members.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-ink-mute">
                    No members yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Panel>
      </section>

      <section>
        <h2 className="mb-3 font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
          Noticeboard
        </h2>
        <div className="space-y-3">
          {posts.map((post) => (
            <Panel key={post.id} className={`p-5 ${post.is_hidden ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-sign text-base font-bold uppercase tracking-wide">
                      {post.title}
                    </h3>
                    <Pill className="border-ink bg-canvas-deep text-ink-soft">{post.category}</Pill>
                    {post.is_pinned ? (
                      <Pill className="border-ink bg-safety text-ink">Pinned</Pill>
                    ) : null}
                    {post.is_hidden ? (
                      <Pill className="border-oxide bg-oxide text-canvas">Hidden</Pill>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{post.body}</p>
                  <p className="mt-2 text-xs text-ink-mute">
                    {post.author_business ?? post.author_name ?? 'AnyTrade'} · {timeAgo(post.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={adminModeratePost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <input type="hidden" name="pinned" value={String(!post.is_pinned)} />
                    <button type="submit" className="btn-ghost btn-sm">
                      {post.is_pinned ? 'Unpin' : 'Pin'}
                    </button>
                  </form>
                  <form action={adminModeratePost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <input type="hidden" name="hidden" value={String(!post.is_hidden)} />
                    <button type="submit" className="btn-ghost btn-sm">
                      {post.is_hidden ? 'Restore' : 'Hide'}
                    </button>
                  </form>
                </div>
              </div>
            </Panel>
          ))}
          {!posts.length ? (
            <Panel className="p-10 text-center text-ink-mute">Noticeboard is empty.</Panel>
          ) : null}
        </div>
      </section>
    </div>
  )
}
