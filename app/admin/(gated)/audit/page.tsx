import { Panel, Pill, SectionHeading } from '@/components/ui'
import { listAudit } from '@/lib/repos/admin'
import { formatDateTime, timeAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: { action?: string }
}) {
  const all = await listAudit(400)
  const entries = searchParams.action
    ? all.filter((e) => e.action.startsWith(searchParams.action as string))
    : all

  const prefixes = Array.from(new Set(all.map((e) => e.action.split('.')[0]))).sort()

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Paper trail"
        title="Audit log"
        blurb="Every administrative action, sign-up, award and gate attempt, oldest at the bottom."
      />

      <Panel className="p-4">
        <div className="flex flex-wrap gap-2">
          <a
            href="/admin/audit"
            className={`btn-sm border-2 border-ink font-sign uppercase tracking-widest ${
              !searchParams.action ? 'bg-safety' : 'bg-canvas'
            }`}
          >
            Everything ({all.length})
          </a>
          {prefixes.map((prefix) => (
            <a
              key={prefix}
              href={`/admin/audit?action=${prefix}`}
              className={`btn-sm border-2 border-ink font-sign uppercase tracking-widest ${
                searchParams.action === prefix ? 'bg-safety' : 'bg-canvas'
              }`}
            >
              {prefix} ({all.filter((e) => e.action.startsWith(prefix)).length})
            </a>
          ))}
        </div>
      </Panel>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-dashed border-ink/20">
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="block">{formatDateTime(entry.created_at)}</span>
                  <span className="block text-xs text-ink-mute">{timeAgo(entry.created_at)}</span>
                </td>
                <td className="px-4 py-3">
                  <Pill
                    className={
                      entry.action.includes('failed')
                        ? 'border-oxide bg-oxide text-canvas'
                        : 'border-ink bg-canvas-deep text-ink-soft'
                    }
                  >
                    {entry.action}
                  </Pill>
                </td>
                <td className="px-4 py-3">
                  {entry.actor_name ?? <span className="text-ink-mute">system / anonymous</span>}
                  {entry.actor_email ? (
                    <span className="block font-mono text-xs text-ink-mute">{entry.actor_email}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-ink-mute">
                  {entry.entity_type ?? '—'}
                  {entry.entity_id ? (
                    <span className="block font-mono text-[11px]">{entry.entity_id.slice(0, 12)}…</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-ink-soft">{entry.detail ?? '—'}</td>
              </tr>
            ))}
            {!entries.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-ink-mute">
                  Nothing logged yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
