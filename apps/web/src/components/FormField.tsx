import type { ReactNode } from 'react'

export const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-base aria-invalid:border-red-500'

type InputA11yProps = {
  id: string
  'aria-invalid': boolean
  'aria-describedby': string | undefined
}

type FormFieldProps = {
  id: string
  label: string
  error?: string
  children: (inputProps: InputA11yProps) => ReactNode
}

export function FormField({ id, label, error, children }: FormFieldProps) {
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
