import { HealthStatus } from './HealthStatus.tsx'

const App = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="mb-2 text-xl font-semibold">Habit Tracker</h1>
        <HealthStatus />
      </div>
    </main>
  )
}

export default App
