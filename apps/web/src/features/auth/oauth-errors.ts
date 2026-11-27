// The API sends the browser back to /login?error=<code> when GitHub sign-in
// fails. Codes map to text here; an unknown code gets the generic message.
const MESSAGES: Record<string, string> = {
  github_denied: 'GitHub sign-in was cancelled.',
  github_state:
    'The sign-in link has expired or was opened in another browser. Please try again.',
  github_no_verified_email:
    'Your GitHub account has no verified email. Verify one on GitHub and try again.',
  github_conflict:
    'This account is already linked to a different GitHub account.',
  github_unavailable: 'Sign-in with GitHub is not available right now.',
}

const GENERIC = 'Could not sign in with GitHub. Please try again.'

export function oauthErrorMessage(code: string | null): string | null {
  if (!code) return null
  return MESSAGES[code] ?? GENERIC
}
