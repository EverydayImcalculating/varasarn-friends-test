import { describe, expect, it } from 'vitest'
import { withRange } from '../src/neon'

describe('withRange', () => {
  it('calls .range(0, to) on a query that supports it, matching the Data API default-page-size workaround', () => {
    const calls: Array<[number, number]> = []
    const query = { range: (from: number, to: number) => { calls.push([from, to]); return 'ranged-result' } }
    const result = withRange(query, 4999)
    expect(calls).toEqual([[0, 4999]])
    expect(result).toBe('ranged-result')
  })

  it('passes the query through unchanged when .range is not available, e.g. a plain test mock', () => {
    const plainPromise = Promise.resolve({ data: [], error: null })
    expect(withRange(plainPromise, 4999)).toBe(plainPromise)
  })
})
