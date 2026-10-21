type StatusBadgeProps = { label: string; ok: boolean }

export const StatusBadge = ({ label, ok }: StatusBadgeProps) => {
  return (
    <span className={ok ? 'text-green-600' : 'text-red-600'}>
      {label}: {ok ? 'ok' : 'error'}
    </span>
  )
}
