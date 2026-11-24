import { formatDay, formatWeekday } from '../../lib/dates.ts'

type WeekGridProps = {
  days: string[]
  checkedDates: ReadonlySet<string>
  color: string
}

export function WeekGrid({ days, checkedDates, color }: WeekGridProps) {
  return (
    <ol aria-label="Last 7 days" className="mt-2 flex gap-1.5">
      {days.map((day) => {
        const done = checkedDates.has(day)
        return (
          <li key={day} className="flex flex-col items-center gap-0.5">
            <span aria-hidden="true" className="text-[10px] text-slate-400">
              {formatWeekday(day)}
            </span>
            <span
              aria-hidden="true"
              className={`size-6 rounded ${done ? '' : 'bg-slate-100 ring-1 ring-slate-200'}`}
              style={done ? { backgroundColor: color } : undefined}
            />
            <span className="sr-only">
              {formatDay(day)}: {done ? 'done' : 'not done'}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
