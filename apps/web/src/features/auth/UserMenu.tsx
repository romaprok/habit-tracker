import type { User } from '@habit-tracker/shared'

import { useLogout } from './mutations.ts'
import { Button } from '../../components/Button.tsx'

export function UserMenu({ user }: { user: User }) {
  const logout = useLogout()

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="hidden text-slate-500 sm:inline">{user.email}</span>
      <Button
        variant="secondary"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
      >
        {logout.isPending ? 'Logging out…' : 'Log out'}
      </Button>
      {logout.isError && (
        <span role="alert" className="text-red-600">
          Could not log out
        </span>
      )}
    </div>
  )
}
