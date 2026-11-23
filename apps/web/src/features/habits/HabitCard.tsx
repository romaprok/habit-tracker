import type { Habit } from '@habit-tracker/shared'

import { Button } from '../../components/Button.tsx'
import { TextLink } from '../../components/TextLink.tsx'

type HabitCardProps = {
  habit: Habit
  deleting: boolean
  onDelete: (habit: Habit) => void
}

export function HabitCard({ habit, deleting, onDelete }: HabitCardProps) {
  return (
    <li className="flex items-start gap-3 rounded-xl bg-white p-4 shadow">
      <span
        aria-hidden="true"
        className="mt-1.5 size-3 shrink-0 rounded-full"
        style={{ backgroundColor: habit.color }}
      />
      <div className="flex-1">
        <h2 className="font-medium">{habit.name}</h2>
        {habit.description && (
          <p className="text-sm text-slate-500">{habit.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <TextLink to={`/habits/${habit.id}/edit`} className="text-sm">
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
