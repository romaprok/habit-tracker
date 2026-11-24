import { describe, expect, it } from 'vitest'

import { isValidTimeZone, todayIn } from './dates.js'

const KYIV = 'Europe/Kyiv'

describe('todayIn', () => {
  it('23:30 in Kyiv is still the same day, though it is 21:30 UTC', () => {
    const now = new Date('2026-11-24T21:30:00Z')

    expect(todayIn(KYIV, now)).toBe('2026-11-24')
    expect(todayIn('UTC', now)).toBe('2026-11-24')
  })

  it('00:30 in Kyiv is already the next day, while UTC is still on the previous one', () => {
    const now = new Date('2026-11-24T22:30:00Z')

    expect(todayIn(KYIV, now)).toBe('2026-11-25')
    expect(todayIn('UTC', now)).toBe('2026-11-24')
  })

  it('uses the summer offset (UTC+3) in Kyiv in July', () => {
    expect(todayIn(KYIV, new Date('2026-07-15T20:30:00Z'))).toBe('2026-07-15')
    expect(todayIn(KYIV, new Date('2026-07-15T21:30:00Z'))).toBe('2026-07-16')
  })

  it('handles the day of the switch to summer time (29 March 2026)', () => {
    expect(todayIn(KYIV, new Date('2026-03-28T22:30:00Z'))).toBe('2026-03-29')
    expect(todayIn(KYIV, new Date('2026-03-29T20:59:00Z'))).toBe('2026-03-29')
    expect(todayIn(KYIV, new Date('2026-03-29T21:00:00Z'))).toBe('2026-03-30')
  })

  it('handles the day of the switch back to winter time (25 October 2026)', () => {
    expect(todayIn(KYIV, new Date('2026-10-25T21:30:00Z'))).toBe('2026-10-25')
    expect(todayIn(KYIV, new Date('2026-10-25T22:00:00Z'))).toBe('2026-10-26')
  })

  it('gives different dates for opposite sides of the date line at the same instant', () => {
    const now = new Date('2026-11-24T12:00:00Z')

    expect(todayIn('Pacific/Kiritimati', now)).toBe('2026-11-25')
    expect(todayIn('Pacific/Pago_Pago', now)).toBe('2026-11-24')
  })

  it('throws for an unknown time zone', () => {
    expect(() => todayIn('Mars/Olympus')).toThrow(RangeError)
  })
})

describe('isValidTimeZone', () => {
  it('accepts IANA names and rejects anything else', () => {
    expect(isValidTimeZone(KYIV)).toBe(true)
    expect(isValidTimeZone('UTC')).toBe(true)
    expect(isValidTimeZone('Mars/Olympus')).toBe(false)
    expect(isValidTimeZone('')).toBe(false)
  })
})
