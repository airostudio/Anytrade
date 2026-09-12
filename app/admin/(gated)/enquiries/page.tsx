import { Panel, Pill, SectionHeading, StatTile } from '@/components/ui'
import { listEnquiries } from '@/lib/repos/admin'
import { adminHandleEnquiry } from '@/app/actions/admin'
import { formatDateTime, timeAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminEnquiriesPage() {
  const enquiries = await listEnquiries(200)
  const open = enquiries.filter((e) => !e.is_handled)

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Inbox"
        title="Contact enquiries"
        blurb="Messages sent through the contact form on the public site."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="All enquiries" value={enquiries.length} />
        <StatTile label="Unhandled" value={open.length} tone={open.length ? 'oxide' : 'canvas'} />
        <StatTile label="Handled" value={enquiries.length - open.length} tone="bottle" />
      </div>

      <div className="space-y-3">
        {enquiries.map((enquiry) => (
          <Panel key={enquiry.id} className={`p-5 ${enquiry.is_handled ? 'opacity-70' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-sign text-base font-bold uppercase tracking-wide">
                    {enquiry.name}
                  </h3>
                  <Pill className="border-ink bg-canvas-deep text-ink-soft">
                    {enquiry.subject ?? 'General'}
                  </Pill>
                  {enquiry.is_handled ? (
                    <Pill className="border-bottle bg-bottle text-canvas">Handled</Pill>
                  ) : (
                    <Pill className="border-oxide bg-oxide text-canvas">New</Pill>
                  )}
                </div>

                <p className="mt-1 font-mono text-xs text-ink-mute">
                  {enquiry.email}
                  {enquiry.phone ? ` · ${enquiry.phone}` : ''}
                  {enquiry.suburb ? ` · ${enquiry.suburb}` : ''}
                </p>

                <p className="mt-3 whitespace-pre-line border-l-4 border-ink/25 pl-3 text-ink-soft">
                  {enquiry.message}
                </p>

                <p className="mt-3 text-xs text-ink-mute">
                  Received {formatDateTime(enquiry.created_at)} ({timeAgo(enquiry.created_at)})
                  {enquiry.handled_at ? ` · handled ${timeAgo(enquiry.handled_at)}` : ''}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                <a href={`mailto:${enquiry.email}`} className="btn-navy btn-sm">
                  Reply by email
                </a>
                <form action={adminHandleEnquiry}>
                  <input type="hidden" name="id" value={enquiry.id} />
                  <input type="hidden" name="handled" value={String(!enquiry.is_handled)} />
                  <button type="submit" className="btn-ghost btn-sm w-full">
                    {enquiry.is_handled ? 'Reopen' : 'Mark handled'}
                  </button>
                </form>
              </div>
            </div>
          </Panel>
        ))}

        {!enquiries.length ? (
          <Panel className="p-10 text-center text-ink-mute">No enquiries yet.</Panel>
        ) : null}
      </div>
    </div>
  )
}
