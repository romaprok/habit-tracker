import { execFileSync } from 'node:child_process'

import pg from 'pg'

import { E2E_DATABASE_URL } from './playwright.config.ts'

// Runs once before all tests: make sure habit_tracker_e2e exists, bring it
// to the latest migration and empty it, so every run starts from zero.
export default async function globalSetup() {
  const dbName = new URL(E2E_DATABASE_URL).pathname.slice(1)
  if (!dbName.endsWith('_e2e')) {
    throw new Error(`Refusing to reset "${dbName}": name must end with _e2e`)
  }

  const adminUrl = new URL(E2E_DATABASE_URL)
  adminUrl.pathname = '/postgres'
  const admin = new pg.Client({ connectionString: adminUrl.toString() })
  await admin.connect()
  try {
    const { rowCount } = await admin.query(
      'select 1 from pg_database where datname = $1',
      [dbName],
    )
    if (rowCount === 0) await admin.query(`create database "${dbName}"`)
  } finally {
    await admin.end()
  }

  // The same migrations the API uses, through its own drizzle-kit script.
  execFileSync('npm', ['run', 'db:migrate', '-w', 'apps/api'], {
    cwd: '../..',
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    stdio: 'inherit',
  })

  const db = new pg.Client({ connectionString: E2E_DATABASE_URL })
  await db.connect()
  try {
    await db.query(
      'truncate users, habits, habit_checks, refresh_tokens, oauth_accounts restart identity cascade',
    )
  } finally {
    await db.end()
  }
}
