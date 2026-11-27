import { sql } from 'drizzle-orm'

import type { HeatmapDay, Streak } from '@habit-tracker/shared'

import type { Db } from '../../db/client.js'

export function createStatsRepository(db: Db) {
  return {
    // Gaps and islands, in one query.
    // 1) Number each habit's check dates in order: row_number() = 1, 2, 3…
    // 2) date - row_number is the same for every day of an unbroken run
    //    (Mon-1, Tue-2, Wed-3 all give the same Sunday), and jumps after a
    //    gap. That constant is the "island" id.
    // 3) Group by island: its length is a streak, its last day says whether
    //    the streak is still alive (ends today or yesterday).
    async streaks(
      userId: string,
      today: string,
      habitId?: string,
    ): Promise<Streak[]> {
      const onlyHabit = habitId ? sql`and h.id = ${habitId}` : sql``
      const { rows } = await db.execute<Streak>(sql`
        with days as (
          select c.habit_id,
                 c.date,
                 c.date - (row_number() over (
                   partition by c.habit_id order by c.date
                 ))::int as island
          from habit_checks c
          join habits h on h.id = c.habit_id
          where h.user_id = ${userId}
            and c.date <= ${today}::date
            ${onlyHabit}
        ),
        islands as (
          select habit_id, count(*)::int as length, max(date) as last_day
          from days
          group by habit_id, island
        )
        select h.id as "habitId",
               coalesce(
                 max(i.length) filter (where i.last_day >= ${today}::date - 1),
                 0
               )::int as "current",
               coalesce(max(i.length), 0)::int as "longest"
        from habits h
        left join islands i on i.habit_id = h.id
        where h.user_id = ${userId}
          ${onlyHabit}
        group by h.id
        order by h.created_at, h.id
      `)
      return rows
    },

    // generate_series makes a row for every day of the range, so the days
    // without a check are there too (checked = false): the client gets a
    // complete calendar and does not have to fill the gaps itself.
    // to_char keeps the date a plain string: pg would turn a date into a
    // JS Date at local midnight and shift it across time zones.
    async heatmap(
      habitId: string,
      from: string,
      to: string,
    ): Promise<HeatmapDay[]> {
      const { rows } = await db.execute<HeatmapDay>(sql`
        select to_char(d, 'YYYY-MM-DD') as "date",
               (c.id is not null) as "checked"
        from generate_series(
          ${from}::timestamp, ${to}::timestamp, interval '1 day'
        ) as d
        left join habit_checks c
          on c.habit_id = ${habitId} and c.date = d::date
        order by d
      `)
      return rows
    },
  }
}

export type StatsRepository = ReturnType<typeof createStatsRepository>
