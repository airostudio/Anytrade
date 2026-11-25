export const fieldHg =
  'w-full rounded-xl border border-hg-slate/25 bg-white px-4 py-3 text-base text-hg-ink placeholder:text-hg-slate/55 transition hover:border-hg-slate/50 focus:border-hg-ink focus:outline-none'

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-hg-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-sm text-hg-slate/80">{hint}</p> : null}
    </div>
  )
}

/** Off-screen trap field: real people never see it, so a filled value means a bot. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Leave this field empty
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  )
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-xl border border-hg-copper-deep/30 bg-[#FBEFE9] px-4 py-3 text-sm font-medium text-hg-copper-deep"
    >
      {message}
    </p>
  )
}
