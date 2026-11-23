import { useNavigate } from 'react-router'

import type { CreateHabit } from '@habit-tracker/shared'

import { TextLink } from '../components/TextLink.tsx'
import { HabitForm } from '../features/habits/HabitForm.tsx'
import { useCreateHabit } from '../features/habits/mutations.ts'

export function NewHabitPage() {
  const navigate = useNavigate()
  const createHabit = useCreateHabit()

  async function handleSubmit(input: CreateHabit) {
    await createHabit.mutateAsync(input)
    navigate('/habits')
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">New habit</h1>
      <HabitForm submitLabel="Create habit" onSubmit={handleSubmit} />
      <TextLink to="/habits">Back to habits</TextLink>
    </section>
  )
}
