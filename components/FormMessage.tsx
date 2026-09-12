export default function FormMessage({
  error,
  success,
}: {
  error?: string | null
  success?: string | null
}) {
  if (!error && !success) return null
  const isError = Boolean(error)
  return (
    <p
      role={isError ? 'alert' : 'status'}
      className={`border-[3px] border-ink px-4 py-3 font-sign text-sm font-bold uppercase tracking-wide ${
        isError ? 'bg-oxide text-canvas' : 'bg-bottle text-canvas'
      }`}
    >
      {error ?? success}
    </p>
  )
}
