import { HabitCard } from '../features/habits/HabitCard.tsx'
import { useHabits, type HabitsState } from '../features/habits/useHabits.ts'

type HabitsContentProps = { state: HabitsState; onRetry: () => void }

function HabitsContent({ state, onRetry }: HabitsContentProps) {
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
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      )
    case 'success':
      if (state.habits.length === 0) {
        return (
          <p className="text-slate-500">
            No habits yet. Run <code>npm run db:seed</code> to add demo habits.
          </p>
        )
      }
      return (
        <ul className="space-y-3">
          {state.habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </ul>
      )
    default:
      return state satisfies never
  }
}

export function HabitsPage() {
  const { state, retry } = useHabits()

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold">Habits</h1>
      <HabitsContent state={state} onRetry={retry} />
    </section>
  )
}
