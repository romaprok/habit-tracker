import { Button } from '../components/Button.tsx'
import { TextLink } from '../components/TextLink.tsx'
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Habits</h1>
        <TextLink to="/habits/new">New habit</TextLink>
      </div>
      <HabitsContent state={state} onRetry={retry} />
    </section>
  )
}
