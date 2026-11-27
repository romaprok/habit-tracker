import { ErrorResponseSchema, type ErrorCode } from '@habit-tracker/shared'

type Parser<T> = { parse: (data: unknown) => T }

type RequestOptions = { signal?: AbortSignal }

// For 204 No Content answers: there is no body to parse.
export const noContent: Parser<void> = { parse: () => undefined }

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

// Endpoints where a 401 is the final answer: wrong password, dead refresh
// token… Refreshing there would loop or hide the real error.
const NO_REFRESH = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
])

let refreshing: Promise<boolean> | null = null

// Single flight: five requests that hit 401 together share one refresh call.
// A second refresh with the same cookie would look like token reuse to the
// API and end the session.
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${BASE_URL}/auth/refresh`, { method: 'POST' })
    .then(
      (res) => res.ok,
      () => false,
    )
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

async function request(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${BASE_URL}${path}`, init)
  } catch (err) {
    if (init.signal?.aborted) throw err
    throw new ApiError(0, 'Network error: the server is unreachable')
  }
}

async function send(path: string, init: RequestInit): Promise<RawResponse> {
  let res = await request(path, init)

  // The access token lives 15 minutes: on 401 try to renew it once and repeat
  // the request. If the refresh fails too, the 401 goes to the caller.
  if (res.status === 401 && !NO_REFRESH.has(path) && (await refreshSession())) {
    res = await request(path, init)
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

  async put(path: string, options: RequestOptions = {}): Promise<void> {
    await send(path, { method: 'PUT', signal: options.signal })
  },

  async delete(path: string, options: RequestOptions = {}): Promise<void> {
    await send(path, { method: 'DELETE', signal: options.signal })
  },
}
