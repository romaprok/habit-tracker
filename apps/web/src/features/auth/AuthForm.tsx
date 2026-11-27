import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useForm } from 'react-hook-form'

import { LoginSchema, RegisterSchema } from '@habit-tracker/shared'

import { Button } from '../../components/Button.tsx'
import { FormField, INPUT_CLASS } from '../../components/FormField.tsx'
import { applyServerErrors } from '../../lib/form-errors.ts'

export type Credentials = { email: string; password: string }

type AuthFormProps = {
  mode: 'login' | 'register'
  onSubmit: (credentials: Credentials) => Promise<void>
}

const COPY = {
  login: {
    submit: 'Log in',
    pending: 'Logging in…',
    passwordAutocomplete: 'current-password',
    fallback: 'Could not log in. Please try again.',
  },
  register: {
    submit: 'Create account',
    pending: 'Creating account…',
    passwordAutocomplete: 'new-password',
    fallback: 'Could not create the account. Please try again.',
  },
} as const

const FIELDS = ['email', 'password'] as const

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const copy = COPY[mode]
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({
    resolver: standardSchemaResolver(
      mode === 'login' ? LoginSchema : RegisterSchema,
    ),
    defaultValues: { email: '', password: '' },
  })

  const submit = handleSubmit(async (credentials) => {
    try {
      await onSubmit(credentials)
    } catch (err) {
      applyServerErrors(err, setError, FIELDS, copy.fallback)
    }
  })

  return (
    <form
      noValidate
      onSubmit={submit}
      className="space-y-4 rounded-xl bg-white p-4 shadow sm:p-6"
    >
      <FormField id="auth-email" label="Email" error={errors.email?.message}>
        {(a11y) => (
          <input
            {...a11y}
            {...register('email')}
            type="email"
            autoComplete="email"
            className={INPUT_CLASS}
          />
        )}
      </FormField>

      <FormField
        id="auth-password"
        label="Password"
        error={errors.password?.message}
      >
        {(a11y) => (
          <input
            {...a11y}
            {...register('password')}
            type="password"
            autoComplete={copy.passwordAutocomplete}
            className={INPUT_CLASS}
          />
        )}
      </FormField>

      {errors.root?.server && (
        <p role="alert" className="text-sm text-red-600">
          {errors.root.server.message}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? copy.pending : copy.submit}
      </Button>
    </form>
  )
}
