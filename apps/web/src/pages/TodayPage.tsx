import { useMutationState } from '@tanstack/react-query'

import type { TodayItem } from '@habit-tracker/shared'

import { Button } from '../components/Button.tsx'
import { TextLink } from '../components/TextLink.tsx'
import { TodayItemRow } from '../features/today/TodayItemRow.tsx'
import { useToday } from '../features/today/useToday.ts'
import {
  toggleCheckKey,
  useToggleCheck,
  type ToggleInput,
} from '../features/today/useToggleCheck.ts'

function formatDay(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function TodayPage() {
  const { state, retry } = useToday()
  const toggle = useToggleCheck()

  function toggleItem(item: TodayItem) {
    if (state.status !== 'success') return
    toggle.mutate({
      habitId: item.habit.id,
      date: state.date,
      checked: !item.checked,
    })
  }

  const pendingIds = useMutationState({
    filters: { mutationKey: toggleCheckKey, status: 'pending' },
    select: (mutation) => (mutation.state.variables as ToggleInput).habitId,
  })

  if (state.status === 'loading') {
    return (
      <p role="status" className="text-slate-500">
        Loading today’s habits…
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
        <p className="mb-2">{state.message}</p>
        <Button variant="danger" onClick={retry}>
          Try again
        </Button>
      </div>
    )
  }

  const done = state.items.filter((item) => item.checked).length

  return (
    <section>
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Today</h1>
        <p className="text-slate-500">
          {formatDay(state.date)}
          {state.items.length > 0 && ` · ${done} of ${state.items.length} done`}
        </p>
      </div>

      {state.items.length === 0 ? (
        <p className="text-slate-500">
          No habits to track yet.{' '}
          <TextLink to="/habits/new">Create your first habit</TextLink>
        </p>
      ) : (
        <ul className="space-y-2">
          {state.items.map((item) => (
            <TodayItemRow
              key={item.habit.id}
              item={item}
              pending={pendingIds.includes(item.habit.id)}
              onToggle={toggleItem}
            />
          ))}
        </ul>
      )}

      {toggle.isError && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          Could not save the change, so it was undone. Please try again.
        </p>
      )}
    </section>
  )
}
