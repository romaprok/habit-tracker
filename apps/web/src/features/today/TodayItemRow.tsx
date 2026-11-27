import type { TodayItem } from '@habit-tracker/shared'

import { StreakBadge } from '../stats/StreakBadge.tsx'

type TodayItemRowProps = {
  item: TodayItem
  streak: number | undefined
  pending: boolean
  onToggle: (item: TodayItem) => void
}

export function TodayItemRow({
  item,
  streak,
  pending,
  onToggle,
}: TodayItemRowProps) {
  const id = `today-${item.habit.id}`

  return (
    <li className="rounded-xl bg-white shadow">
      <label
        htmlFor={id}
        className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3"
      >
        <input
          id={id}
          type="checkbox"
          checked={item.checked}
          disabled={pending}
          onChange={() => onToggle(item)}
          className="size-5 shrink-0 accent-green-600"
        />
        <span
          aria-hidden="true"
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: item.habit.color }}
        />
        <span
          className={`break-words ${item.checked ? 'text-slate-400 line-through' : ''}`}
        >
          {item.habit.name}
        </span>
        <span className="ml-auto">
          <StreakBadge days={streak} />
        </span>
      </label>
    </li>
  )
}
