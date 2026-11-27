import { setupServer } from 'msw/node'

// MSW intercepts fetch at the network level: components and hooks run their
// real code (api client, TanStack Query), only the server is fake. Each test
// adds the handlers it needs with server.use(...).
export const server = setupServer()
