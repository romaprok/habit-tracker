import { useParams } from 'react-router'

import type { Completion } from '@habit-tracker/shared'

import { Button } from '../components/Button.tsx'
import { TextLink } from '../components/TextLink.tsx'
import { useHabit } from '../features/habits/useHabit.ts'
import { Heatmap } from '../features/stats/Heatmap.tsx'
import { StatTile } from '../features/stats/StatTile.tsx'
import { useHabitStats } from '../features/stats/useHabitStats.ts'

function percent({ rate }: Completion) {
  return `${Math.round(rate * 100)}%`
}

function daysLabel(n: number) {
  return `${n} ${n === 1 ? 'day' : 'days'}`
}

export function HabitStatsPage() {
  const { id = '' } = useParams()
  const habit = useHabit(id)
  const stats = useHabitStats(id)

  if (habit.status === 'not-found') {
    return (
      <div className="rounded-xl bg-white p-6 text-center shadow">
        <p className="mb-2 font-medium">Habit not found</p>
        <TextLink to="/habits">Back to habits</TextLink>
      </div>
    )
  }

  if (habit.status === 'loading' || stats.isPending) {
    return (
      <p role="status" className="text-slate-500">
        Loading stats…
      </p>
    )
  }

  if (habit.status === 'error' || stats.isError) {
    return (
      <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
        <p className="mb-2">Could not load the stats.</p>
        <Button variant="danger" onClick={() => void stats.refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  const { habit: h } = habit
  const { completion, streak, days } = stats.data

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <span
            aria-hidden="true"
            className="size-3 rounded-full"
            style={{ backgroundColor: h.color }}
          />
          {h.name}
        </h1>
        <TextLink to="/habits">Back to habits</TextLink>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Current streak" value={daysLabel(streak.current)} />
        <StatTile label="Longest streak" value={daysLabel(streak.longest)} />
        <StatTile
          label="Last 7 days"
          value={percent(completion.week)}
          detail={`${completion.week.checked} of ${completion.week.total}`}
        />
        <StatTile
          label="Last 30 days"
          value={percent(completion.month)}
          detail={`${completion.month.checked} of ${completion.month.total}`}
        />
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-3 text-sm font-medium text-slate-500">
          Last 12 months
        </h2>
        <Heatmap days={days} color={h.color} />
      </div>
    </section>
  )
}
