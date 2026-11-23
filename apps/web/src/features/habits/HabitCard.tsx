import type { Habit } from '@habit-tracker/shared'

import { TextLink } from '../../components/TextLink.tsx'

type HabitCardProps = { habit: Habit }

export function HabitCard({ habit }: HabitCardProps) {
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
      <TextLink to={`/habits/${habit.id}/edit`} className="text-sm">
        Edit
      </TextLink>
    </li>
  )
}
