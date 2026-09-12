import Link from 'next/link'
import { auth } from '@/lib/auth'
import { Panel, Pill, SectionHeading, Stamp } from '@/components/ui'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { getUser } from '@/lib/repos/users'
import { formatDate } from '@/lib/utils'
import ProfileForm from './ProfileForm'

export const dynamic = 'force-dynamic'

export default async function TradieProfilePage() {
  const session = await auth()
  if (!session?.user) return null

  const [tradie, me] = await Promise.all([
    getTradieByUserId(session.user.id),
    getUser(session.user.id),
  ])
  if (!tradie) return null

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Your shopfront"
        title="My listing"
        blurb="This is what customers see in the directory and next to every quote you send."
        action={
          <Link href={`/find-a-tradie/${tradie.slug}`} className="btn-ghost btn-sm">
            View it live
          </Link>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <Panel className="p-7">
          <ProfileForm
            tradie={{
              businessName: tradie.business_name,
              tagline: tradie.tagline ?? '',
              bio: tradie.bio ?? '',
              trades: tradie.trades,
              handymanServices: tradie.handyman_services,
              serviceAreas: tradie.service_areas.join(', '),
              acceptsSmallJobs: tradie.accepts_small_jobs,
              availableNow: tradie.available_now,
              availableWeekends: tradie.available_weekends,
              emergencyCallouts: tradie.emergency_callouts,
              freeQuotes: tradie.free_quotes,
              hourlyRate: tradie.hourly_rate,
              calloutFee: tradie.callout_fee,
              minimumCharge: tradie.minimum_charge,
              yearsExperience: tradie.years_experience,
              baseSuburb: tradie.base_suburb ?? '',
              city: tradie.city ?? '',
              state: tradie.state ?? '',
              postcode: tradie.postcode ?? '',
              travelRadiusKm: tradie.travel_radius_km,
              abn: tradie.abn ?? '',
              licenceNumber: tradie.licence_number ?? '',
              insurerName: tradie.insurer_name ?? '',
              phone: me?.phone ?? '',
            }}
          />
        </Panel>

        <aside className="space-y-5">
          <Panel tone="navy" className="p-5">
            <h2 className="font-sign text-sm font-bold uppercase tracking-[0.2em] text-safety">
              Verification
            </h2>
            <p className="mt-3">
              <Pill
                className={
                  tradie.verification_status === 'VERIFIED'
                    ? 'border-canvas bg-bottle text-canvas'
                    : 'border-canvas/60 bg-transparent text-canvas'
                }
              >
                {tradie.verification_status}
              </Pill>
            </p>
            {tradie.verification_status === 'VERIFIED' ? (
              <p className="mt-3 text-sm text-canvas/80">
                Checked {formatDate(tradie.verified_at)}. Verified listings rank above unverified ones.
              </p>
            ) : (
              <p className="mt-3 text-sm text-canvas/80">
                Add your licence number and insurer below, then email a copy of each to the office. We
                badge your listing once it checks out.
              </p>
            )}
            {tradie.verification_notes ? (
              <p className="mt-3 border-t-2 border-canvas/25 pt-3 text-sm text-canvas/80">
                <strong>Note from us:</strong> {tradie.verification_notes}
              </p>
            ) : null}
            <Link href="/contact" className="btn-primary btn-sm mt-4">
              Send documents
            </Link>
          </Panel>

          <Panel tone="manila" className="p-5">
            <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em]">
              Listing health
            </h2>
            <ul className="space-y-2 text-sm">
              <Check done={Boolean(tradie.tagline)} label="Tagline written" />
              <Check done={Boolean(tradie.bio && tradie.bio.length > 80)} label="Proper bio" />
              <Check done={tradie.trades.length > 0} label="Trades selected" />
              <Check done={tradie.service_areas.length > 0} label="Service areas listed" />
              <Check done={Boolean(tradie.hourly_rate)} label="Hourly rate shown" />
              <Check done={Boolean(tradie.licence_number)} label="Licence number added" />
              <Check done={tradie.handyman_services.length > 0} label="Small jobs listed" />
            </ul>
            <p className="mt-4 text-xs text-ink-mute">
              Complete listings get roughly twice the profile views.
            </p>
          </Panel>

          {tradie.is_homegirl ? (
            <Panel className="p-5">
              <Stamp tone="oxide" className="mb-3 bg-canvas">
                Homegirls member
              </Stamp>
              <p className="text-sm text-ink-soft">
                You appear in the Homegirls directory and can quote on jobs where the customer has
                asked for a woman tradesperson.
              </p>
              <Link href="/homegirls" className="btn-oxide btn-sm mt-4">
                Open the network
              </Link>
            </Panel>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function Check({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={done ? 'font-bold text-bottle' : 'text-ink-mute'} aria-hidden>
        {done ? '✓' : '○'}
      </span>
      <span className={done ? '' : 'text-ink-mute'}>{label}</span>
    </li>
  )
}
