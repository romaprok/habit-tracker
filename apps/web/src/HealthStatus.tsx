import { StatusBadge } from './StatusBadge.tsx'
import { useHealth } from './useHealth.ts'

export const HealthStatus = () => {
  const { health, apiDown } = useHealth()

  if (apiDown) return <StatusBadge label="API" ok={false} />
  if (!health) return <p className="text-slate-500">Checking...</p>

  return (
    <p>
      <StatusBadge label="API" ok /> ·{' '}
      <StatusBadge label="DB" ok={health.db === 'ok'} />
    </p>
  )
}
