import { NavLink, Outlet } from 'react-router'

import { HealthStatus } from '../features/health/HealthStatus.tsx'

const NAV_LINK = 'inline-flex min-h-11 items-center rounded-lg px-3'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? `${NAV_LINK} bg-slate-100 font-semibold text-slate-900`
    : `${NAV_LINK} text-slate-500 hover:bg-slate-50 hover:text-slate-900`

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <NavLink to="/" className="text-lg font-semibold">
            Habit Tracker
          </NavLink>
          <nav aria-label="Main" className="flex gap-1">
            <NavLink to="/" end className={linkClass}>
              Today
            </NavLink>
            <NavLink to="/habits" className={linkClass}>
              Habits
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-3xl px-4 pb-6 text-xs text-slate-500 sm:px-6">
        <HealthStatus />
      </footer>
    </div>
  )
}
