import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'

import { CreateHabitSchema, type CreateHabit } from '@habit-tracker/shared'

import { Button } from '../../components/Button.tsx'
import { ApiError } from '../../lib/api-client.ts'

export type HabitFormValues = {
  name: string
  description: string
  color: string
}

type FieldName = keyof HabitFormValues
type FieldErrors = Partial<Record<FieldName, string>>
type Issue = { path: PropertyKey[]; message: string }

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

function toInput(values: HabitFormValues) {
  const description = values.description.trim()
  return {
    name: values.name,
    description: description === '' ? null : description,
    color: values.color,
  }
}

function toFieldErrors(issues: Issue[]): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of issues) {
    const field = issue.path[0]
    if (field === 'name' || field === 'description' || field === 'color') {
      errors[field] ??= issue.message
    }
  }
  return errors
}

function toServerFieldErrors(fields: Record<string, string[]>): FieldErrors {
  return toFieldErrors(
    Object.entries(fields).flatMap(([field, messages]) =>
      messages.map((message) => ({ path: [field], message })),
    ),
  )
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
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const update =
    (field: FieldName) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
    }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const result = CreateHabitSchema.safeParse(toInput(values))
    if (!result.success) {
      setErrors(toFieldErrors(result.error.issues))
      return
    }

    setErrors({})
    setFormError(null)
    setSubmitting(true)
    try {
      await onSubmit(result.data)
    } catch (err) {
      const serverErrors =
        err instanceof ApiError ? toServerFieldErrors(err.fields) : {}
      if (Object.keys(serverErrors).length > 0) setErrors(serverErrors)
      else setFormError(toFormError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl bg-white p-6 shadow"
    >
      <Field name="name" label="Name" error={errors.name}>
        {(a11y) => (
          <input
            {...a11y}
            value={values.name}
            onChange={update('name')}
            className={INPUT_CLASS}
          />
        )}
      </Field>

      <Field
        name="description"
        label="Description (optional)"
        error={errors.description}
      >
        {(a11y) => (
          <textarea
            {...a11y}
            rows={3}
            value={values.description}
            onChange={update('description')}
            className={INPUT_CLASS}
          />
        )}
      </Field>

      <Field name="color" label="Color" error={errors.color}>
        {(a11y) => (
          <input
            {...a11y}
            type="color"
            value={values.color}
            onChange={update('color')}
            className="h-10 w-16 cursor-pointer rounded border border-slate-300"
          />
        )}
      </Field>

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  )
}
