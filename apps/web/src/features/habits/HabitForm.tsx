import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'

import { CreateHabitSchema, type CreateHabit } from '@habit-tracker/shared'

import { Button } from '../../components/Button.tsx'
import { ApiError } from '../../lib/api-client.ts'

export type HabitFormValues = {
  name: string
  description: string
  color: string
}

type FieldName = keyof HabitFormValues

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

const FIELD_NAMES: FieldName[] = ['name', 'description', 'color']

function isFieldName(key: string): key is FieldName {
  return (FIELD_NAMES as string[]).includes(key)
}

function toFormError(err: unknown) {
  if (err instanceof ApiError && err.status === 0) {
    return 'Cannot reach the server. Check your connection and try again.'
  }
  if (err instanceof ApiError) return err.message
  return 'Could not save the habit. Please try again.'
}

type InputA11yProps = {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
}

type FieldProps = {
  name: FieldName
  label: string
  error?: string
  children: (inputProps: InputA11yProps) => ReactNode
}

function Field({ name, label, error, children }: FieldProps) {
  const id = `habit-${name}`
  const errorId = `${id}-error`
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 px-3 py-2 aria-invalid:border-red-500'

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
      const serverFields = err instanceof ApiError ? err.fields : {}
      let shownUnderFields = 0
      for (const [key, messages] of Object.entries(serverFields)) {
        if (isFieldName(key) && messages[0]) {
          setError(key, { type: 'server', message: messages[0] })
          shownUnderFields += 1
        }
      }
      if (shownUnderFields === 0) {
        setError('root.server', { message: toFormError(err) })
      }
    }
  })

  return (
    <form
      noValidate
      onSubmit={submit}
      className="space-y-4 rounded-xl bg-white p-6 shadow"
    >
      <Field name="name" label="Name" error={errors.name?.message}>
        {(a11y) => (
          <input {...a11y} {...register('name')} className={INPUT_CLASS} />
        )}
      </Field>

      <Field
        name="description"
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
      </Field>

      <Field name="color" label="Color" error={errors.color?.message}>
        {(a11y) => (
          <input
            {...a11y}
            {...register('color')}
            type="color"
            className="h-10 w-16 cursor-pointer rounded border border-slate-300"
          />
        )}
      </Field>

      {errors.root?.server && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.server.message}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
