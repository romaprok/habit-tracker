import { sql } from 'drizzle-orm'
import {
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid()
    .primaryKey()
    .default(sql`uuidv7()`),
  email: text().notNull().unique(),
  timezone: text().notNull().default('UTC'),
  passwordHash: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export const habits = pgTable(
  'habits',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    description: text(),
    color: varchar({ length: 7 }).notNull(),
    archivedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.userId),
    check('habits_name_length', sql`char_length(${t.name}) between 1 and 100`),
    check('habits_color_hex', sql`${t.color} ~ '^#[0-9a-fA-F]{6}$'`),
  ],
)

export const habitChecks = pgTable(
  'habit_checks',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    habitId: uuid()
      .notNull()
      .references(() => habits.id, { onDelete: 'cascade' }),
    date: date({ mode: 'string' }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('habit_checks_habit_id_date_unique').on(t.habitId, t.date)],
)

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    usedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('refresh_tokens_token_hash_unique').on(t.tokenHash),
    index().on(t.userId),
  ],
)

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: text().notNull(),
    // Stable id from the provider (GitHub's numeric user id), not the login
    // or email: those can change, the id cannot.
    providerUserId: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One provider account belongs to exactly one of our users…
    unique('oauth_accounts_provider_user_unique').on(
      t.provider,
      t.providerUserId,
    ),
    // …and a user links at most one account per provider. This index starts
    // with user_id, so it also serves "accounts of this user" lookups.
    unique('oauth_accounts_user_provider_unique').on(t.userId, t.provider),
    check('oauth_accounts_provider_known', sql`${t.provider} in ('github')`),
  ],
)
