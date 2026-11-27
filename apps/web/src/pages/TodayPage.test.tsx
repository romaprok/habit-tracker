import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import type { StreakListResponse, TodayResponse } from '@habit-tracker/shared'

import { TodayPage } from './TodayPage.tsx'
import { renderWithProviders } from '../test/render.tsx'
import { server } from '../test/server.ts'

const DATE = '2026-11-24'
const READ_ID = '0195f1a2-7c3e-7a00-8000-000000000001'
const RUN_ID = '0195f1a2-7c3e-7a00-8000-000000000002'

function habit(id: string, name: string) {
  return {
    id,
    name,
    description: null,
    color: '#3B82F6',
    archivedAt: null,
    createdAt: '2026-11-01T10:00:00.000Z',
  }
}

// The fake server keeps state, so a refetch after the mutation sees the
// change, like the real API would.
function mockApi({ failToggle = false } = {}) {
  const checked = new Set<string>([RUN_ID])
  let todayCalls = 0

  server.use(
    http.get('/api/today', async () => {
      // Refetches are slow, so a test can see the state *before* the fresh
      // data arrives: the rollback has to come from the cache, not a refetch.
      todayCalls += 1
      if (todayCalls > 1) await delay(300)
      return HttpResponse.json<TodayResponse>({
        date: DATE,
        items: [
          { habit: habit(READ_ID, 'Read'), checked: checked.has(READ_ID) },
          { habit: habit(RUN_ID, 'Run'), checked: checked.has(RUN_ID) },
        ],
      })
    }),
    http.get('/api/streaks', () =>
      HttpResponse.json<StreakListResponse>({
        date: DATE,
        streaks: [
          { habitId: READ_ID, current: 0, longest: 0 },
          { habitId: RUN_ID, current: 4, longest: 9 },
        ],
      }),
    ),
    http.put('/api/habits/:id/checks/:date', async ({ params }) => {
      await delay(50)
      if (failToggle) {
        return HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Boom' } },
          { status: 500 },
        )
      }
      checked.add(String(params.id))
      return new HttpResponse(null, { status: 204 })
    }),
  )
}

describe('Today checklist', () => {
  it("lists today's habits with their status and streak", async () => {
    mockApi()
    renderWithProviders(<TodayPage />)

    expect(
      await screen.findByRole('checkbox', { name: /Read/ }),
    ).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Run/ })).toBeChecked()
    expect(screen.getByText(/1 of 2 done/)).toBeInTheDocument()
    expect(
      await screen.findByText('Current streak: 4 days'),
    ).toBeInTheDocument()
  })

  it('checks a habit immediately, before the server answers', async () => {
    mockApi()
    renderWithProviders(<TodayPage />)
    const user = userEvent.setup()
    const read = await screen.findByRole('checkbox', { name: /Read/ })

    await user.click(read)

    // Optimistic: checked and disabled while the request is in flight.
    expect(read).toBeChecked()
    expect(read).toBeDisabled()
    await waitFor(() => expect(read).toBeEnabled())
    expect(read).toBeChecked()
    expect(await screen.findByText(/2 of 2 done/)).toBeInTheDocument()
  })

  it('rolls the check back and explains when the server fails', async () => {
    mockApi({ failToggle: true })
    renderWithProviders(<TodayPage />)
    const user = userEvent.setup()
    const read = await screen.findByRole('checkbox', { name: /Read/ })

    await user.click(read)
    expect(read).toBeChecked()

    // The PUT fails after 50 ms, the refetch answers after 300 ms: unchecked
    // within 200 ms can only come from the rollback in onError.
    await waitFor(() => expect(read).not.toBeChecked(), { timeout: 200 })
    // The message appears once the refetch has settled.
    expect(await screen.findByRole('alert')).toHaveTextContent(/undone/i)
    expect(read).not.toBeChecked()
  })
})
