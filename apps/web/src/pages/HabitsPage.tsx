import type { Habit } from '@habit-tracker/shared'

import { Button } from '../components/Button.tsx'
import { TextLink } from '../components/TextLink.tsx'
import { HabitCard } from '../features/habits/HabitCard.tsx'
import { useDeleteHabit } from '../features/habits/mutations.ts'
import { useHabits, type HabitsState } from '../features/habits/useHabits.ts'
import { ApiError } from '../lib/api-client.ts'

type HabitsContentProps = {
  state: HabitsState
  deletingId: string | null
  onRetry: () => void
  onDelete: (habit: Habit) => void
}

function HabitsContent({
  state,
  deletingId,
  onRetry,
  onDelete,
}: HabitsContentProps) {
  switch (state.status) {
    case 'loading':
      return (
        <p role="status" className="text-slate-500">
          Loading habits…
        </p>
      )
    case 'error':
      return (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          <p className="mb-2">{state.message}</p>
          <Button variant="danger" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )
    case 'success':
      if (state.habits.length === 0) {
        return (
          <p className="text-slate-500">
            No habits yet.{' '}
            <TextLink to="/habits/new">Create your first habit</TextLink>
          </p>
        )
      }
      return (
        <ul className="space-y-3">
          {state.habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              deleting={deletingId === habit.id}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )
    default:
      return state satisfies never
  }
}

export function HabitsPage() {
  const { state, retry } = useHabits()
  const deleteMutation = useDeleteHabit()
  const deletingId = deleteMutation.isPending ? deleteMutation.variables : null

  async function deleteHabit(habit: Habit) {
    if (!window.confirm(`Delete "${habit.name}"? This cannot be undone.`))
      return

    try {
      await deleteMutation.mutateAsync(habit.id)
    } catch (err) {
      window.alert(
        err instanceof ApiError
          ? `Could not delete the habit: ${err.message}`
          : 'Could not delete the habit. Please try again.',
      )
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Habits</h1>
        <TextLink to="/habits/new">New habit</TextLink>
      </div>
      <HabitsContent
        state={state}
        deletingId={deletingId}
        onRetry={retry}
        onDelete={deleteHabit}
      />
    </section>
  )
}
