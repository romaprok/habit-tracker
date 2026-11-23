import { useNavigate, useParams } from 'react-router'

import {
  HabitResponseSchema,
  type CreateHabit,
  type Habit,
} from '@habit-tracker/shared'

import { TextLink } from '../components/TextLink.tsx'
import {
  HabitForm,
  type HabitFormValues,
} from '../features/habits/HabitForm.tsx'
import { useHabit } from '../features/habits/useHabit.ts'
import { api } from '../lib/api-client.ts'

function toFormValues(habit: Habit): HabitFormValues {
  return {
    name: habit.name,
    description: habit.description ?? '',
    color: habit.color,
  }
}

export function EditHabitPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const state = useHabit(id)

  async function saveHabit(input: CreateHabit) {
    await api.patch(`/habits/${id}`, input, HabitResponseSchema)
    navigate('/habits')
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Edit habit</h1>

      {state.status === 'loading' && (
        <p role="status" className="text-slate-500">
          Loading habit…
        </p>
      )}
      {state.status === 'not-found' && (
        <div className="rounded-xl bg-white p-6 text-center shadow">
          <p className="mb-2 font-medium">Habit not found</p>
          <p className="text-slate-500">
            It may have been deleted, or the link is wrong.
          </p>
        </div>
      )}
      {state.status === 'error' && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {state.message}
        </p>
      )}
      {state.status === 'success' && (
        <HabitForm
          key={state.habit.id}
          initialValues={toFormValues(state.habit)}
          submitLabel="Save changes"
          onSubmit={saveHabit}
        />
      )}

      <TextLink to="/habits">Back to habits</TextLink>
    </section>
  )
}
