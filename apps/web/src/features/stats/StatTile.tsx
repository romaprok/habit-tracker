type StatTileProps = { label: string; value: string; detail?: string }

export function StatTile({ label, value, detail }: StatTileProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      {detail && <p className="text-xs text-slate-400">{detail}</p>}
    </div>
  )
}
