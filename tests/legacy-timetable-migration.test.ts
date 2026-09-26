import { beforeEach, describe, expect, it, vi } from 'vitest'
import { migrateLegacyTimetable, readLegacyTimetable, type LegacyClass } from '../src/services/legacy-timetable-import'

const key = 'my_tu_schedule_student@example.com'
const valid = { code: 'JC100', name: 'วารสารศาสตร์', sec: '1', teacher: 'อาจารย์เดิม', day: 'จันทร์', start: '09:00', end: '11:00' }
const storage = () => window.localStorage
const entry = (overrides: Partial<LegacyClass> = {}, index = 1): LegacyClass => ({ index, code: valid.code, name: valid.name, section: valid.sec, teacher: valid.teacher, day: valid.day, start: valid.start, end: valid.end, ...overrides })

beforeEach(() => window.localStorage.clear())

describe('silent legacy timetable migration', () => {
  it.each([null, '[]'])('does not schedule work for absent or empty data (%s)', (raw) => {
    if (raw !== null) storage().setItem(key, raw)
    expect(readLegacyTimetable('student@example.com', storage())).toEqual({ kind: 'none' })
  })

  it('preserves unsupported and malformed storage without rewriting it', () => {
    for (const raw of ['{broken', '{"classes":[]}']) {
      storage().setItem(key, raw)
      expect(readLegacyTimetable('student@example.com', storage()).kind).toBe('error')
      expect(storage().getItem(key)).toBe(raw)
    }
  })

  it('reads a normalized email key and rejects invalid rows individually', () => {
    storage().setItem('my_tu_schedule_Student@Example.com', JSON.stringify([valid, { ...valid, sec: '2', day: 'Someday' }]))
    const source = readLegacyTimetable(' student@example.com ', storage())
    expect(source.kind).toBe('found')
    if (source.kind !== 'found') return
    expect(source.entries[0].invalidReason).toBeUndefined()
    expect(source.entries[1].invalidReason).toBeDefined()
  })

  it('coalesces identical rows and records one durable server request', async () => {
    const requests: Array<Record<string, unknown>> = []
    const client = { rpc: vi.fn(async (_name: string, args?: Record<string, unknown>) => {
      requests.push(args ?? {})
      return { data: { outcome: 'added-official' }, error: null }
    }) }
    const entries = [entry({}, 1), entry({}, 2)]
    const result = await migrateLegacyTimetable(client, entries)
    expect(requests).toHaveLength(1)
    expect(requests[0].p_migration_version).toBe(1)
    expect(requests[0].p_entry).toEqual(valid)
    expect(result.map((item) => item.outcome)).toEqual(['added-official'])
  })

  it('marks every duplicate-course or overlapping legacy row as unresolved', async () => {
    const requests: Array<Record<string, unknown>> = []
    const client = { rpc: vi.fn(async (_name: string, args?: Record<string, unknown>) => {
      requests.push(args ?? {})
      return { data: { outcome: 'conflict' }, error: null }
    }) }
    const rows: LegacyClass[] = [
      entry({}, 1),
      entry({ code: 'BJM200', section: '4' }, 2),
      entry({ code: 'GE101', section: '9', start: '10:00', end: '12:00' }, 3),
    ]
    const outcomes = await migrateLegacyTimetable(client, rows)
    expect(requests.map((request) => request.p_conflicting)).toEqual([true, true, true])
    expect(outcomes.every((item) => item.outcome === 'conflict')).toBe(true)
  })

  it('continues with valid rows when one source row is invalid', async () => {
    const client = { rpc: vi.fn(async () => ({ data: { outcome: 'added-legacy' }, error: null })) }
    const rows: LegacyClass[] = [entry({ invalidReason: 'bad' }, 1), entry({}, 2)]
    const result = await migrateLegacyTimetable(client, rows)
    expect(client.rpc).toHaveBeenCalledTimes(1)
    expect(result.map((item) => item.outcome)).toEqual(['invalid', 'added-legacy'])
  })

  it('keeps failed RPCs retryable and does not mutate the browser source', async () => {
    const raw = JSON.stringify([valid])
    storage().setItem(key, raw)
    const source = readLegacyTimetable('student@example.com', storage())
    expect(source.kind).toBe('found')
    if (source.kind !== 'found') return
    const client = { rpc: vi.fn(async () => ({ data: null, error: { message: 'offline' } })) }
    expect((await migrateLegacyTimetable(client, source.entries))[0].outcome).toBe('retryable')
    expect(storage().getItem(key)).toBe(raw)
  })
})
