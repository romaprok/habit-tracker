// Shows nothing for 0: a "0 days" badge on every new habit is noise.
export function StreakBadge({ days }: { days: number | undefined }) {
  if (!days) return null

  const label = `Current streak: ${days} ${days === 1 ? 'day' : 'days'}`
  return (
    <span
      title={label}
      className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700"
    >
      <span aria-hidden="true">🔥</span>
      <span aria-hidden="true">{days}</span>
      <span className="sr-only">{label}</span>
    </span>
  )
}
