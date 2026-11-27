import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { CreateHabit } from '@habit-tracker/shared'

import { HabitForm } from './HabitForm.tsx'
import { ApiError } from '../../lib/api-client.ts'

type Submit = (input: CreateHabit) => Promise<void>

function setup(onSubmit: Submit = vi.fn<Submit>(async () => {})) {
  render(<HabitForm submitLabel="Create habit" onSubmit={onSubmit} />)
  return { user: userEvent.setup(), onSubmit }
}

describe('HabitForm', () => {
  it('shows the schema error under the field and does not submit an empty name', async () => {
    const { user, onSubmit } = setup()

    await user.click(screen.getByRole('button', { name: 'Create habit' }))

    const name = screen.getByLabelText('Name')
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(name).toHaveAccessibleDescription(/.+/)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits trimmed values and turns an empty description into null', async () => {
    const { user, onSubmit } = setup()

    await user.type(screen.getByLabelText('Name'), '  Read  ')
    await user.click(screen.getByRole('button', { name: 'Create habit' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Read',
      description: null,
      color: '#3B82F6',
    })
  })

  it('shows field errors from the server under the matching field', async () => {
    const body = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request',
        fields: { name: ['Name is already used'] },
      },
    }
    const { user } = setup(async () => {
      throw new ApiError(400, 'Request failed', body)
    })

    await user.type(screen.getByLabelText('Name'), 'Read')
    await user.click(screen.getByRole('button', { name: 'Create habit' }))

    expect(await screen.findByText('Name is already used')).toBeVisible()
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription(
      'Name is already used',
    )
  })

  it('shows a general error when the server is unreachable', async () => {
    const { user } = setup(async () => {
      throw new ApiError(0, 'Network error')
    })

    await user.type(screen.getByLabelText('Name'), 'Read')
    await user.click(screen.getByRole('button', { name: 'Create habit' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /cannot reach the server/i,
    )
  })
})
