import { useNavigate } from 'react-router'

import { HabitResponseSchema, type CreateHabit } from '@habit-tracker/shared'

import { TextLink } from '../components/TextLink.tsx'
import { HabitForm } from '../features/habits/HabitForm.tsx'
import { api } from '../lib/api-client.ts'

export function NewHabitPage() {
  const navigate = useNavigate()

  async function createHabit(input: CreateHabit) {
    await api.post('/habits', input, HabitResponseSchema)
    navigate('/habits')
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">New habit</h1>
      <HabitForm submitLabel="Create habit" onSubmit={createHabit} />
      <TextLink to="/habits">Back to habits</TextLink>
    </section>
  )
}
