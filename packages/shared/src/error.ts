import { z } from 'zod'

export const ErrorCodeSchema = z.enum([
  'NOT_FOUND',
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'CONFLICT',
  'TOO_MANY_REQUESTS',
  'INTERNAL_ERROR',
])

export type ErrorCode = z.infer<typeof ErrorCodeSchema>

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    fields: z.record(z.string(), z.array(z.string())).optional(),
  }),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
