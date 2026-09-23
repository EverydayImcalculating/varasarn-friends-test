import { describe, expect, it } from 'vitest'
import { overlaps } from '../src/services/timetable'

describe('timetable overlaps', () => {
  it('treats touching intervals as non-conflicting', () => expect(overlaps({ day: 1, start: '09:00', end: '10:00' }, { day: 1, start: '10:00', end: '11:00' })).toBe(false))
  it('detects contained intervals on the same day', () => expect(overlaps({ day: 1, start: '09:00', end: '12:00' }, { day: 1, start: '10:00', end: '11:00' })).toBe(true))
})
