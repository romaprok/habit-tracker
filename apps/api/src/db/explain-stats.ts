// Prints EXPLAIN ANALYZE for the statistics queries on the perf seed:
// first without the indexes (dropped inside a transaction that is rolled
// back — DDL is transactional in PostgreSQL, so nothing really changes),
// then with them. Run `npm run db:seed:perf` first.
import { sql, type SQL } from 'drizzle-orm'

import { config } from '../config.js'
import { createDb, createPool, type Tx } from './client.js'
import { addDays, todayIn } from '../lib/dates.js'
import {
  completionQuery,
  heatmapQuery,
  streaksQuery,
} from '../modules/stats/stats.queries.js'

const pool = createPool(config.DATABASE_URL)
const db = createDb(pool)

class Rollback extends Error {}

async function explain(tx: Tx, title: string, query: SQL) {
  const { rows } = await tx.execute<{ 'QUERY PLAN': string }>(
    sql`explain (analyze, costs off, summary on) ${query}`,
  )
  console.log(`\n--- ${title}\n`)
  console.log(rows.map((r) => r['QUERY PLAN']).join('\n'))
}

try {
  const { rows } = await db.execute<{ userId: string; habitId: string }>(sql`
    select u.id as "userId", h.id as "habitId"
    from users u join habits h on h.user_id = u.id
    where u.email = 'perf@habit-tracker.local'
    limit 1
  `)
  if (!rows[0]) throw new Error('No perf user: run npm run db:seed:perf')
  const { userId, habitId } = rows[0]
  const today = todayIn('Europe/Kyiv')

  async function runAll(tx: Tx, label: string) {
    console.log(`\n========== ${label} ==========`)
    await explain(
      tx,
      'streaks (all habits of a user)',
      streaksQuery(userId, today),
    )
    await explain(
      tx,
      'heatmap (one habit, a year)',
      heatmapQuery(habitId, addDays(today, -364), today),
    )
    await explain(tx, 'completion (one habit)', completionQuery(habitId, today))
  }

  await db
    .transaction(async (tx) => {
      await tx.execute(sql`
        alter table habit_checks
          drop constraint habit_checks_habit_id_date_unique
      `)
      await tx.execute(sql`drop index habits_user_id_index`)
      await runAll(tx, 'BEFORE: without indexes')
      throw new Rollback()
    })
    .catch((err: unknown) => {
      if (!(err instanceof Rollback)) throw err
    })

  await db.transaction((tx) => runAll(tx, 'AFTER: with indexes'))
} finally {
  await pool.end()
}
