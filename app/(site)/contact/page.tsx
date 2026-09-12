import type { Metadata } from 'next'
import { Panel, Stamp } from '@/components/ui'
import { getSettings } from '@/lib/repos/settings'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Talk to a human at AnyTrade about a job, a quote, an account or a complaint.',
}
export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const settings = await getSettings()

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="mb-10">
        <Stamp tone="oxide" className="mb-4 bg-canvas">
          A real person answers
        </Stamp>
        <h1 className="font-display text-4xl leading-tight">Get in touch</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          Something gone sideways on a job? Question about a quote or your account? Tell us and
          we&apos;ll come back within one business day.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <Panel className="p-7">
          <ContactForm />
        </Panel>

        <aside className="space-y-5">
          <Panel tone="navy" className="p-6">
            <h2 className="font-sign text-sm font-bold uppercase tracking-[0.2em] text-safety">
              The office
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-canvas/70">Phone</dt>
                <dd className="font-mono text-lg">{settings['site.phone']}</dd>
              </div>
              <div>
                <dt className="text-canvas/70">Email</dt>
                <dd className="font-mono">{settings['site.email']}</dd>
              </div>
              <div>
                <dt className="text-canvas/70">ABN</dt>
                <dd className="font-mono">{settings['site.abn']}</dd>
              </div>
              <div>
                <dt className="text-canvas/70">Hours</dt>
                <dd>Mon–Fri 7am–5pm AEST, Sat 8am–12pm</dd>
              </div>
            </dl>
          </Panel>

          <Panel tone="manila" className="p-6">
            <h2 className="font-sign text-sm font-bold uppercase tracking-[0.2em]">
              Quicker than emailing
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>
                <strong>Chasing a quote?</strong> Open the job in your dashboard — quotes land there
                first.
              </li>
              <li>
                <strong>Dispute on a job?</strong> Don&apos;t release escrow. Message us with the job
                reference.
              </li>
              <li>
                <strong>Tradie billing?</strong> Your invoices are all under Billing in your dashboard.
              </li>
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
