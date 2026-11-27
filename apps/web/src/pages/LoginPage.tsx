import { TextLink } from '../components/TextLink.tsx'
import { AuthForm, type Credentials } from '../features/auth/AuthForm.tsx'
import { useLogin } from '../features/auth/mutations.ts'

export function LoginPage() {
  const login = useLogin()

  async function handleSubmit(credentials: Credentials) {
    await login.mutateAsync(credentials)
    // <GuestOnly> sees the new user and redirects back to where they came from.
  }

  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Log in</h1>
      <AuthForm mode="login" onSubmit={handleSubmit} />
      <p className="text-sm text-slate-500">
        No account yet? <TextLink to="/register">Create one</TextLink>
      </p>
    </section>
  )
}
