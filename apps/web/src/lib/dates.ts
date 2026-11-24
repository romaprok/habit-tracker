function toLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function lastDays(today: string, count: number) {
  return Array.from({ length: count }, (_, i) => addDays(today, i - count + 1))
}

export function formatDay(date: string) {
  return toLocalDate(date).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatWeekday(date: string) {
  return toLocalDate(date).toLocaleDateString('en-US', { weekday: 'short' })
}
