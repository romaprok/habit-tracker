type Parser<T> = { parse: (data: unknown) => T }

type RequestOptions = { signal?: AbortSignal }

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

const BASE_URL = '/api'

async function request<T>(
  path: string,
  parser: Parser<T>,
  init: RequestInit,
): Promise<T> {
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

  try {
    return parser.parse(body)
  } catch {
    throw new ApiError(res.status, 'Unexpected response format', body)
  }
}

export const api = {
  get<T>(path: string, parser: Parser<T>, options: RequestOptions = {}) {
    return request(path, parser, { method: 'GET', signal: options.signal })
  },
}
