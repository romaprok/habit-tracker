import { NavLink, Outlet } from 'react-router'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'font-semibold text-slate-900'
    : 'text-slate-500 hover:text-slate-900'

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between p-4">
          <NavLink to="/" className="text-lg font-semibold">
            Habit Tracker
          </NavLink>
          <nav aria-label="Main" className="flex gap-4">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/habits" className={linkClass}>
              Habits
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
