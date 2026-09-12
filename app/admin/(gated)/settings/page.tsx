import { Panel, SectionHeading, Stamp } from '@/components/ui'
import { listSettings } from '@/lib/repos/settings'
import { isStripeLive } from '@/lib/stripe'
import { formatDateTime } from '@/lib/utils'
import SettingsForm from './SettingsForm'

export const dynamic = 'force-dynamic'

const GROUP_LABELS: Record<string, string> = {
  site: 'Site details',
  billing: 'Billing & fees',
  bidding: 'Bidding rules',
  reviews: 'Reviews & moderation',
  gate: 'Passcodes',
  homegirls: 'Homegirls network',
}

const SECRET_KEYS = new Set(['gate.admin_passcode', 'gate.homegirls_passcode'])

export default async function AdminSettingsPage() {
  const settings = await listSettings()

  const groups = settings.reduce<Record<string, typeof settings>>((acc, setting) => {
    const group = setting.group || 'general'
    acc[group] = acc[group] ?? []
    acc[group].push(setting)
    return acc
  }, {})

  const envAdmin = Boolean(process.env.ADMIN_PASSCODE)
  const envHomegirls = Boolean(process.env.HOMEGIRLS_PASSCODE)

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Configuration"
        title="Settings"
        blurb="These values drive the public site, the bidding rules and the two passcode gates."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel tone={isStripeLive() ? 'navy' : 'mustard'} className="p-5">
          <h2 className="font-sign text-sm font-bold uppercase tracking-[0.2em]">Stripe</h2>
          <p className="mt-2 text-sm">
            {isStripeLive()
              ? 'Live keys detected — checkout creates real Stripe sessions and the webhook is active.'
              : 'No STRIPE_SECRET_KEY set. Purchases complete instantly in demo mode without charging a card.'}
          </p>
          <p className="mt-2 text-xs opacity-80">
            Configure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET as environment variables, not here —
            secrets do not belong in the database.
          </p>
        </Panel>

        <Panel className="p-5">
          <h2 className="font-sign text-sm font-bold uppercase tracking-[0.2em]">Passcode gates</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
            <li>
              <strong>Admin:</strong>{' '}
              {envAdmin
                ? 'set by the ADMIN_PASSCODE environment variable (overrides the value below)'
                : 'using the value stored below'}
            </li>
            <li>
              <strong>Homegirls:</strong>{' '}
              {envHomegirls
                ? 'set by the HOMEGIRLS_PASSCODE environment variable (overrides the value below)'
                : 'using the value stored below'}
            </li>
          </ul>
          <p className="mt-2 text-xs text-ink-mute">
            Changing a passcode immediately signs everyone out of that section.
          </p>
        </Panel>
      </div>

      <SettingsForm groups={groups} groupLabels={GROUP_LABELS} secretKeys={Array.from(SECRET_KEYS)} />

      <Panel tone="manila" className="p-5">
        <Stamp tone="ink" className="mb-3 bg-canvas">
          Reference
        </Stamp>
        <table className="w-full text-sm">
          <thead className="text-left font-sign text-xs uppercase tracking-widest text-ink-mute">
            <tr>
              <th className="py-1.5">Key</th>
              <th className="py-1.5">Last changed</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((setting) => (
              <tr key={setting.key} className="border-t border-dashed border-ink/20">
                <td className="py-1.5 font-mono text-xs">{setting.key}</td>
                <td className="py-1.5 text-ink-mute">{formatDateTime(setting.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
