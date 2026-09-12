import Link from 'next/link'
import { Panel, Pill, SectionHeading, StatTile } from '@/components/ui'
import { listUsers } from '@/lib/repos/users'
import { platformStats } from '@/lib/repos/admin'
import { adminSetSuspended } from '@/app/actions/admin'
import { formatDate, rating1dp, timeAgo } from '@/lib/utils'
import type { UserRole } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; q?: string }
}) {
  const role = ['CLIENT', 'TRADESPERSON', 'ADMIN'].includes(searchParams.role ?? '')
    ? (searchParams.role as UserRole)
    : undefined

  const [users, stats] = await Promise.all([
    listUsers({ role, q: searchParams.q, limit: 200 }),
    platformStats(),
  ])

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="People" title="Users" blurb="Every account on the platform." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="All users" value={stats.users.total} />
        <StatTile label="Homeowners" value={stats.users.clients} tone="navy" />
        <StatTile label="Tradies" value={stats.users.tradies} tone="safety" />
        <StatTile label="Admins" value={stats.users.admins} tone="mustard" />
        <StatTile
          label="Suspended"
          value={stats.users.suspended}
          tone={stats.users.suspended ? 'oxide' : 'canvas'}
        />
      </div>

      <Panel className="p-4">
        <form method="get" className="grid gap-3 sm:grid-cols-[200px_1fr_auto_auto]">
          <select name="role" defaultValue={searchParams.role ?? ''} className="field border-2 py-2">
            <option value="">All roles</option>
            <option value="CLIENT">Homeowners</option>
            <option value="TRADESPERSON">Tradies</option>
            <option value="ADMIN">Admins</option>
          </select>
          <input
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Search name or email"
            className="field border-2 py-2"
          />
          <button type="submit" className="btn-navy btn-sm">
            Filter
          </button>
          <Link href="/admin/users" className="btn-ghost btn-sm">
            Reset
          </Link>
        </form>
      </Panel>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Last seen</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-dashed border-ink/20">
                <td className="px-4 py-3">
                  <span className="font-semibold">{user.name}</span>
                  <span className="block font-mono text-xs text-ink-mute">{user.email}</span>
                  {user.phone ? (
                    <span className="block font-mono text-xs text-ink-mute">{user.phone}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Pill className="border-ink bg-canvas-deep text-ink-soft">{user.role}</Pill>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {user.suburb ? `${user.suburb}, ${user.state ?? ''}` : '—'}
                </td>
                <td className="px-4 py-3 font-mono">
                  {user.client_review_count
                    ? `${rating1dp(user.client_rating)} (${user.client_review_count})`
                    : '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-mute">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-mute">
                  {user.last_login_at ? timeAgo(user.last_login_at) : 'never'}
                </td>
                <td className="px-4 py-3">
                  {user.is_suspended ? (
                    <Pill className="border-oxide bg-oxide text-canvas">Suspended</Pill>
                  ) : (
                    <Pill className="border-bottle bg-bottle text-canvas">Active</Pill>
                  )}
                  {user.suspended_reason ? (
                    <span className="block text-xs text-ink-mute">{user.suspended_reason}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right">
                  {user.role !== 'ADMIN' ? (
                    <form action={adminSetSuspended} className="flex items-center justify-end gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="suspend" value={String(!user.is_suspended)} />
                      {!user.is_suspended ? (
                        <input
                          name="reason"
                          placeholder="Reason"
                          className="w-28 border-2 border-ink px-2 py-1 text-xs"
                        />
                      ) : null}
                      <button
                        type="submit"
                        className={`btn-sm border-2 font-sign uppercase tracking-widest ${
                          user.is_suspended
                            ? 'border-bottle bg-bottle text-canvas'
                            : 'border-ink hover:border-oxide hover:text-oxide'
                        }`}
                      >
                        {user.is_suspended ? 'Reinstate' : 'Suspend'}
                      </button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
            {!users.length ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-ink-mute">
                  No users match that filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
