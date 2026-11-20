import type { RequestHandler } from 'express'
import type { z } from 'zod'

import { ValidationError, type FieldErrors } from '../errors/app-error.js'

type RequestPart = 'params' | 'query' | 'body'

type Schemas = Partial<Record<RequestPart, z.ZodType>>

const PARTS: RequestPart[] = ['params', 'query', 'body']

function fieldKey(part: RequestPart, path: PropertyKey[]) {
  const name = path.length > 0 ? path.map(String).join('.') : '_root'
  return part === 'body' ? name : `${part}.${name}`
}

export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    const fields: FieldErrors = {}

    for (const part of PARTS) {
      const schema = schemas[part]
      if (!schema) continue

      const result = schema.safeParse(req[part])
      if (!result.success) {
        for (const issue of result.error.issues) {
          const key = fieldKey(part, issue.path)
          fields[key] = [...(fields[key] ?? []), issue.message]
        }
        continue
      }

      if (part === 'query') {
        Object.defineProperty(req, 'query', {
          value: result.data,
          writable: true,
          configurable: true,
          enumerable: true,
        })
      } else {
        req[part] = result.data
      }
    }

    if (Object.keys(fields).length > 0) {
      next(new ValidationError(fields))
      return
    }
    next()
  }
}
