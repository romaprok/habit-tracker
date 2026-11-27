import type { HeatmapDay } from '@habit-tracker/shared'

import { formatDay } from '../../lib/dates.ts'

// Monday = 0 … Sunday = 6, so weeks are columns and weekdays are rows.
function weekdayIndex(date: string) {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
// Every other label, like most calendars: all seven are too dense at 12px.
const LABELLED = new Set(['Mon', 'Wed', 'Fri'])

type HeatmapProps = { days: HeatmapDay[]; color: string }

// CSS grid does the layout: 7 rows, and grid-auto-flow: column fills them
// top to bottom, then starts the next week. Empty cells at the start push
// the first day onto its weekday row.
export function Heatmap({ days, color }: HeatmapProps) {
  const leading = days.length > 0 ? weekdayIndex(days[0].date) : 0
  const checked = days.filter((d) => d.checked).length

  return (
    <div className="flex gap-1">
      <div
        aria-hidden="true"
        className="grid grid-rows-7 gap-[3px] text-[10px] leading-3 text-slate-400"
      >
        {WEEKDAYS.map((day) => (
          <span key={day} className="h-3">
            {LABELLED.has(day) ? day : ''}
          </span>
        ))}
      </div>
      {/* Scrolled to the end on mount: on a phone the recent weeks matter. */}
      <div
        ref={(el) => {
          if (el) el.scrollLeft = el.scrollWidth
        }}
        className="overflow-x-auto pb-1"
      >
        <div
          role="img"
          aria-label={`${checked} of ${days.length} days checked in the last year`}
          className="grid grid-flow-col grid-rows-7 gap-[3px]"
        >
          {Array.from({ length: leading }, (_, i) => (
            <span key={`pad-${i}`} className="size-3" />
          ))}
          {days.map((day) => (
            <span
              key={day.date}
              title={`${formatDay(day.date)}: ${day.checked ? 'done' : 'not done'}`}
              className="size-3 rounded-sm bg-slate-100"
              style={day.checked ? { backgroundColor: color } : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
