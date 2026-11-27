// Load for EXPLAIN ANALYZE: ~400 users × 3 habits, a year of checks each,
// about 100 000 rows in habit_checks. Safe to re-run: it deletes its own
// users first (perf*@habit-tracker.local) and touches nothing else.
// Log in as perf@habit-tracker.local / demo-password to see the stats.
import { sql } from 'drizzle-orm'

import { config } from '../config.js'
import { createDb, createPool } from './client.js'
import { hashPassword } from '../lib/passwords.js'

const OTHER_USERS = 399
const HABITS_PER_USER = 3
const DAYS = 365
// Other users check ~23% of days; the perf user is diligent (80%).
const OTHERS_RATE = 0.23
const PERF_RATE = 0.8

const pool = createPool(config.DATABASE_URL)
const db = createDb(pool)

const passwordHash = await hashPassword('demo-password')

try {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`delete from users where email like 'perf%@habit-tracker.local'`,
    )
    await tx.execute(sql`
      insert into users (email, timezone, password_hash)
      values ('perf@habit-tracker.local', 'Europe/Kyiv', ${passwordHash})
    `)
    await tx.execute(sql`
      insert into users (email)
      select 'perf-' || g || '@habit-tracker.local'
      from generate_series(1, ${OTHER_USERS}) g
    `)
    await tx.execute(sql`
      insert into habits (user_id, name, color, created_at)
      select u.id, 'Habit ' || n, '#3B82F6', now() - interval '400 days'
      from users u, generate_series(1, ${HABITS_PER_USER}) n
      where u.email like 'perf%@habit-tracker.local'
    `)
    // random() sits in a MATERIALIZED CTE next to the day, so it runs once
    // per (habit, day). Written as a plain WHERE on the cross join, the
    // planner evaluated it once per habit: every habit was all or nothing.
    await tx.execute(sql`
      with candidates as materialized (
        select h.id as habit_id,
               d::date as date,
               u.email = 'perf@habit-tracker.local' as is_perf,
               random() as roll
        from habits h
        join users u on u.id = h.user_id
        cross join generate_series(
          current_date - ${DAYS - 1}::int, current_date, interval '1 day'
        ) d
        where u.email like 'perf%@habit-tracker.local'
      )
      insert into habit_checks (habit_id, date)
      select habit_id, date
      from candidates
      where roll < case when is_perf then ${PERF_RATE}::float
                        else ${OTHERS_RATE}::float end
    `)
  })
  // ANALYZE: fresh statistics, otherwise the planner guesses from old numbers.
  // VACUUM: marks pages all-visible, so an Index Only Scan really skips the
  // table (otherwise EXPLAIN shows "Heap Fetches" for every row).
  await db.execute(sql`vacuum (analyze) users, habits, habit_checks`)

  const { rows } = await db.execute<{ checks: number }>(
    sql`select count(*)::int as checks from habit_checks`,
  )
  console.log(`habit_checks now has ${rows[0].checks} rows`)
} finally {
  await pool.end()
}
