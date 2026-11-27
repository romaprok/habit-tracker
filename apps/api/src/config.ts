import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long'),
  // Short on purpose; set e.g. 30 locally to watch the silent refresh work.
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
})
const result = envSchema.safeParse(process.env)
if (!result.success) {
  console.error(
    `Invalid environment variables:\n${z.prettifyError(result.error)}`,
  )
  process.exit(1)
}
export const config = result.data
