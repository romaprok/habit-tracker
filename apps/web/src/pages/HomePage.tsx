import { HealthStatus } from '../features/health/HealthStatus.tsx'

export function HomePage() {
  return (
    <section className="rounded-xl bg-white p-6 shadow">
      <h1 className="mb-2 text-xl font-semibold">Welcome</h1>
      <HealthStatus />
    </section>
  )
}
