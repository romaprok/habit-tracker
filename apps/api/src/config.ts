import { z } from 'zod'

// `KEY=` in .env arrives as an empty string: treat it as "not set".
const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().optional(),
)

const envSchema = z
  .object({
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
    // Where the web app is served from; comma-separated if there are several.
    ALLOWED_ORIGINS: z
      .string()
      .default('http://localhost:5173')
      .transform((value) => value.split(',').map((origin) => origin.trim()))
      .pipe(z.array(z.url())),
    // The web app's own URL: OAuth callbacks and redirects are built from it.
    WEB_URL: z.url().default('http://localhost:5173'),
    // GitHub OAuth App (Settings → Developer settings → OAuth Apps).
    // Optional: without them the API runs, only "Sign in with GitHub" is off.
    GITHUB_CLIENT_ID: optionalString,
    GITHUB_CLIENT_SECRET: optionalString,
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
  })
  .refine(
    (env) =>
      Boolean(env.GITHUB_CLIENT_ID) === Boolean(env.GITHUB_CLIENT_SECRET),
    {
      message: 'Set both GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET, or neither',
      path: ['GITHUB_CLIENT_SECRET'],
    },
  )
const result = envSchema.safeParse(process.env)
if (!result.success) {
  console.error(
    `Invalid environment variables:\n${z.prettifyError(result.error)}`,
  )
  process.exit(1)
}
export const config = result.data
