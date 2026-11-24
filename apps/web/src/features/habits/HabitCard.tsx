import type { Habit } from '@habit-tracker/shared'

import { WeekGrid } from './WeekGrid.tsx'
import { Button } from '../../components/Button.tsx'
import { TextLink } from '../../components/TextLink.tsx'

type HabitCardProps = {
  habit: Habit
  days: string[]
  checkedDates: ReadonlySet<string>
  deleting: boolean
  onDelete: (habit: Habit) => void
}

export function HabitCard({
  habit,
  days,
  checkedDates,
  deleting,
  onDelete,
}: HabitCardProps) {
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow sm:flex-row sm:items-start">
      <div className="flex flex-1 items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1.5 size-3 shrink-0 rounded-full"
          style={{ backgroundColor: habit.color }}
        />
        <div className="min-w-0">
          <h2 className="font-medium break-words">{habit.name}</h2>
          {habit.description && (
            <p className="text-sm break-words text-slate-500">
              {habit.description}
            </p>
          )}
          {days.length > 0 && (
            <WeekGrid
              days={days}
              checkedDates={checkedDates}
              color={habit.color}
            />
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
        <TextLink
          to={`/habits/${habit.id}/edit`}
          className="inline-flex min-h-11 items-center px-2 text-sm sm:min-h-9"
        >
          Edit
        </TextLink>
        <Button
          variant="danger"
          disabled={deleting}
          onClick={() => onDelete(habit)}
          aria-label={`Delete ${habit.name}`}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </li>
  )
}
