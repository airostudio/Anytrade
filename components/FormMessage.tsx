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
      className={`rounded-xl px-4 py-3 text-sm font-semibold ${
        isError ? 'bg-oxide text-canvas' : 'bg-bottle text-canvas'
      }`}
    >
      {error ?? success}
    </p>
  )
}
