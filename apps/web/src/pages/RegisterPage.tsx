import { TextLink } from '../components/TextLink.tsx'
import { AuthForm, type Credentials } from '../features/auth/AuthForm.tsx'
import { GitHubButton } from '../features/auth/GitHubButton.tsx'
import { useRegister } from '../features/auth/mutations.ts'

function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function RegisterPage() {
  const registerUser = useRegister()

  async function handleSubmit(credentials: Credentials) {
    await registerUser.mutateAsync({
      ...credentials,
      timezone: browserTimeZone(),
    })
    // <GuestOnly> sees the new user and redirects back to where they came from.
  }

  return (
    <section className="mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Create an account</h1>
      <GitHubButton />
      <p className="text-center text-xs text-slate-400">or with email</p>
      <AuthForm mode="register" onSubmit={handleSubmit} />
      <p className="text-sm text-slate-500">
        Already have an account? <TextLink to="/login">Log in</TextLink>
      </p>
    </section>
  )
}
