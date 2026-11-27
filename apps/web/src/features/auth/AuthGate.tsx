import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useCurrentUser } from './useCurrentUser.ts'
import { Button } from '../../components/Button.tsx'

export type FromState = { from?: string } | null

function SessionCheck({ children }: { children: ReactNode }) {
  const { isPending, isError, refetch } = useCurrentUser()

  if (isPending) return <p className="text-slate-500">Loading…</p>
  if (isError) {
    return (
      <div role="alert" className="space-y-2">
        <p className="text-red-600">Could not check your session.</p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    )
  }
  return children
}

function PrivateOutlet() {
  const { data: user } = useCurrentUser()
  const location = useLocation()

  if (!user) {
    const state: FromState = { from: location.pathname + location.search }
    return <Navigate to="/login" replace state={state} />
  }
  return <Outlet />
}

function GuestOutlet() {
  const { data: user } = useCurrentUser()
  const location = useLocation()

  if (user) {
    const from = (location.state as FromState)?.from ?? '/'
    return <Navigate to={from} replace />
  }
  return <Outlet />
}

// Layout routes: wrap a group of <Route>s, decide once for all of them.
export function RequireAuth() {
  return (
    <SessionCheck>
      <PrivateOutlet />
    </SessionCheck>
  )
}

export function GuestOnly() {
  return (
    <SessionCheck>
      <GuestOutlet />
    </SessionCheck>
  )
}
