import { TRADE_CATEGORIES } from '@/lib/constants'

/**
 * The directory search. A plain GET form so results are linkable and the whole
 * thing works without JavaScript.
 */
export default function SearchBar({
  action = '/find-a-tradie',
  defaultTrade = '',
  defaultSuburb = '',
  compact = false,
}: {
  action?: string
  defaultTrade?: string
  defaultSuburb?: string
  compact?: boolean
}) {
  return (
    <form
      action={action}
      method="get"
      className={`grid gap-2 border-[3px] border-ink bg-canvas p-2 shadow-hard ${
        compact ? 'sm:grid-cols-[1fr_1fr_auto]' : 'sm:grid-cols-[1.2fr_1fr_auto]'
      }`}
    >
      <label className="sr-only" htmlFor="trade">
        What do you need done?
      </label>
      <select id="trade" name="trade" defaultValue={defaultTrade} className="field border-2">
        <option value="">What do you need done?</option>
        {TRADE_CATEGORIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.name}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="suburb">
        Suburb
      </label>
      <input
        id="suburb"
        name="suburb"
        defaultValue={defaultSuburb}
        placeholder="Suburb or postcode"
        className="field border-2"
      />

      <button type="submit" className="btn-primary whitespace-nowrap">
        Search
      </button>
    </form>
  )
}
