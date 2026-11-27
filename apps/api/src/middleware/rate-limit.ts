import { rateLimit } from 'express-rate-limit'

import { TooManyRequestsError } from '../errors/app-error.js'

export type RateLimitOptions = { limit: number; windowMs: number }

export const AUTH_RATE_LIMIT: RateLimitOptions = {
  limit: 10,
  windowMs: 15 * 60 * 1000,
}

// Factory: each call gets its own counter, so login and register are
// limited separately. Counters live in memory — fine for one instance;
// several instances would need a shared store (e.g. Redis).
export function createRateLimit({ limit, windowMs }: RateLimitOptions) {
  return rateLimit({
    limit,
    windowMs,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Hand the 429 to our errorHandler so it has the usual { error } shape.
    handler: (_req, _res, next) => next(new TooManyRequestsError()),
  })
}
