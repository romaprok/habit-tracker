import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ message: 'Enter a valid email address' }))

function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: z
    .string()
    .min(
      PASSWORD_MIN_LENGTH,
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    )
    .max(
      PASSWORD_MAX_LENGTH,
      `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    ),
  timezone: z
    .string()
    .refine(isValidTimeZone, { message: 'Unknown time zone' })
    .optional(),
})

export type Register = z.infer<typeof RegisterSchema>

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Enter your password'),
})

export type Login = z.infer<typeof LoginSchema>

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  timezone: z.string(),
  createdAt: z.iso.datetime(),
})

export type User = z.infer<typeof UserSchema>

export const UserResponseSchema = z.object({
  user: UserSchema,
})

export type UserResponse = z.infer<typeof UserResponseSchema>
