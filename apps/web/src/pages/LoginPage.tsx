import { useSearchParams } from 'react-router'

import { TextLink } from '../components/TextLink.tsx'
import { AuthForm, type Credentials } from '../features/auth/AuthForm.tsx'
import { GitHubButton } from '../features/auth/GitHubButton.tsx'
import { useLogin } from '../features/auth/mutations.ts'
import { oauthErrorMessage } from '../features/auth/oauth-errors.ts'

export function LoginPage() {
  const login = useLogin()
  const [searchParams] = useSearchParams()
  const oauthError = oauthErrorMessage(searchParams.get('error'))

  async function handleSubmit(credentials: Credentials) {
    await login.mutateAsync(credentials)
    // <GuestOnly> sees the new user and redirects back to where they came from.
  }

  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Log in</h1>
      {oauthError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {oauthError}
        </p>
      )}
      <GitHubButton />
      <p className="text-center text-xs text-slate-400">or with email</p>
      <AuthForm mode="login" onSubmit={handleSubmit} />
      <p className="text-sm text-slate-500">
        No account yet? <TextLink to="/register">Create one</TextLink>
      </p>
    </section>
  )
}
