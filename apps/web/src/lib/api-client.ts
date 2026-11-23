import { ErrorResponseSchema, type ErrorCode } from '@habit-tracker/shared'

type Parser<T> = { parse: (data: unknown) => T }

type RequestOptions = { signal?: AbortSignal }

type RawResponse = { status: number; body: unknown }

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown
  readonly code: ErrorCode | null
  readonly fields: Record<string, string[]>

  constructor(status: number, message: string, body?: unknown) {
    const server = ErrorResponseSchema.safeParse(body)
    super(server.success ? server.data.error.message : message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
    this.code = server.success ? server.data.error.code : null
    this.fields = server.success ? (server.data.error.fields ?? {}) : {}
  }
}

const BASE_URL = '/api'

async function send(path: string, init: RequestInit): Promise<RawResponse> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, init)
  } catch (err) {
    if (init.signal?.aborted) throw err
    throw new ApiError(0, 'Network error: the server is unreachable')
  }

  const body: unknown = await res.json().catch((err: unknown) => {
    if (init.signal?.aborted) throw err
    return undefined
  })

  if (!res.ok) {
    throw new ApiError(
      res.status,
      `Request failed with status ${res.status}`,
      body,
    )
  }

  return { status: res.status, body }
}

function parse<T>(parser: Parser<T>, { status, body }: RawResponse): T {
  try {
    return parser.parse(body)
  } catch {
    throw new ApiError(status, 'Unexpected response format', body)
  }
}

function withJson(
  method: string,
  data: unknown,
  options: RequestOptions,
): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: options.signal,
  }
}

export const api = {
  async get<T>(path: string, parser: Parser<T>, options: RequestOptions = {}) {
    return parse(
      parser,
      await send(path, { method: 'GET', signal: options.signal }),
    )
  },

  async post<T>(
    path: string,
    data: unknown,
    parser: Parser<T>,
    options: RequestOptions = {},
  ) {
    return parse(parser, await send(path, withJson('POST', data, options)))
  },

  async patch<T>(
    path: string,
    data: unknown,
    parser: Parser<T>,
    options: RequestOptions = {},
  ) {
    return parse(parser, await send(path, withJson('PATCH', data, options)))
  },

  async delete(path: string, options: RequestOptions = {}): Promise<void> {
    await send(path, { method: 'DELETE', signal: options.signal })
  },
}
