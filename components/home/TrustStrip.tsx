import { Check } from 'lucide-react'

const ITEMS = [
  'Licence & ABN Checked',
  'Public Liability Insured',
  'No Hidden Call-Out Fees',
  'Australian Owned Since 1968',
] as const

/** The four promises, directly under the Quick-Start bar. */
export default function TrustStrip() {
  return (
    <ul
      aria-label="Our promises"
      className="grid grid-cols-1 gap-x-8 gap-y-3 text-[15px] font-semibold text-charcoal sm:grid-cols-2 lg:grid-cols-4"
    >
      {ITEMS.map((item) => (
        <li key={item} className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-verified text-white"
          >
            <Check className="h-3 w-3" strokeWidth={3.5} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}
