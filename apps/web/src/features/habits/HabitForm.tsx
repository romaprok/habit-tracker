import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useForm } from 'react-hook-form'

import { CreateHabitSchema, type CreateHabit } from '@habit-tracker/shared'

import { Button } from '../../components/Button.tsx'
import { FormField, INPUT_CLASS } from '../../components/FormField.tsx'
import { applyServerErrors } from '../../lib/form-errors.ts'

export type HabitFormValues = {
  name: string
  description: string
  color: string
}

type HabitFormProps = {
  initialValues?: HabitFormValues
  submitLabel: string
  onSubmit: (input: CreateHabit) => Promise<void>
}

const EMPTY_VALUES: HabitFormValues = {
  name: '',
  description: '',
  color: '#3B82F6',
}

const FIELDS = ['name', 'description', 'color'] as const

export function HabitForm({
  initialValues = EMPTY_VALUES,
  submitLabel,
  onSubmit,
}: HabitFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<HabitFormValues, unknown, CreateHabit>({
    resolver: standardSchemaResolver(CreateHabitSchema),
    defaultValues: initialValues,
  })

  const submit = handleSubmit(async (data) => {
    const description = data.description?.trim()
    try {
      await onSubmit({ ...data, description: description || null })
    } catch (err) {
      applyServerErrors(
        err,
        setError,
        FIELDS,
        'Could not save the habit. Please try again.',
      )
    }
  })

  return (
    <form
      noValidate
      onSubmit={submit}
      className="space-y-4 rounded-xl bg-white p-4 shadow sm:p-6"
    >
      <FormField id="habit-name" label="Name" error={errors.name?.message}>
        {(a11y) => (
          <input {...a11y} {...register('name')} className={INPUT_CLASS} />
        )}
      </FormField>

      <FormField
        id="habit-description"
        label="Description (optional)"
        error={errors.description?.message}
      >
        {(a11y) => (
          <textarea
            {...a11y}
            {...register('description')}
            rows={3}
            className={INPUT_CLASS}
          />
        )}
      </FormField>

      <FormField id="habit-color" label="Color" error={errors.color?.message}>
        {(a11y) => (
          <input
            {...a11y}
            {...register('color')}
            type="color"
            className="h-11 w-20 cursor-pointer rounded border border-slate-300"
          />
        )}
      </FormField>

      {errors.root?.server && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.server.message}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
