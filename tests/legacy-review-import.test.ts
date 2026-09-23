import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import { normalizeSemester, normalizeTimestamp, normalizeYear } from '../scripts/legacy-review-normalize.mjs'

const exec = promisify(execFile)
const WORKBOOK = 'old-repo/สำเนาของ เว็บรีวิววิชา.xlsx'
const run = async (...args: string[]) => JSON.parse((await exec('node', ['scripts/import-legacy-reviews.mjs', ...args], { cwd: process.cwd() })).stdout)

describe('legacy review normalization', () => {
  it('converts Google Sheets day serials to Bangkok-offset ISO timestamps', () => {
    expect(normalizeTimestamp(46285.60169368055)).toBe('2026-09-20T14:26:26+07:00')
    expect(normalizeTimestamp(46300.25)).toBe('2026-10-05T06:00:00+07:00')
    expect(normalizeTimestamp('2026-10-01T09:15:00')).toBe('2026-10-01T09:15:00+07:00')
    expect(normalizeTimestamp('2026-10-01T09:15:00Z')).toBe('2026-10-01T09:15:00Z')
    expect(normalizeTimestamp('20/9/2026 14:26:26')).toBeNull()
    expect(normalizeTimestamp('')).toBeNull()
  })

  it('normalizes terms and converts Common Era years to Buddhist Era', () => {
    expect([1, '2', 3, 'Summer', 'ฤดูร้อน', 'X', ''].map(normalizeSemester)).toEqual(['1', '2', 'ฤดูร้อน', 'ฤดูร้อน', 'ฤดูร้อน', null, null])
    expect(normalizeYear(2568)).toEqual({ year: 2568, converted: false })
    expect(normalizeYear('2025')).toEqual({ year: 2568, converted: true })
    expect(normalizeYear(99)).toBeNull()
  })
})

describe('legacy review importer dry run', () => {
  it('normalizes the four-review snapshot, matches its catalog, and discards creator emails', async () => {
    const report = await run(WORKBOOK, '--catalog', WORKBOOK)
    expect(report).toMatchObject({ mode: 'dry-run', sourceRows: 4, accepted: 4, invalid: 0, duplicates: 0, unmatched: 0, balanced: true, catalogChecked: true })
    expect(report.reviews[0]).toMatchObject({ sourceRow: 2, courseCode: 'JC380', semester: '1', year: 2569, section: '450001', createdAt: '2026-09-20T14:26:26+07:00', scheduleVerified: false })
    expect(JSON.stringify(report.reviews)).not.toContain('@')
    for (const review of report.reviews) expect(Object.keys(review)).not.toContain('CreatorEmail')
  })

  it('reconciles a fresh export with duplicate, unmatched, invalid, and blank rows', async () => {
    const report = await run('tests/fixtures/legacy-reviews-fresh.json', '--catalog', WORKBOOK)
    expect(report).toMatchObject({ sourceRows: 8, blankRows: 1, accepted: 2, invalid: 3, duplicates: 1, unmatched: 1, balanced: true })
    expect(report.rejected).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 2, kind: 'duplicate', firstRow: 1 }),
      expect.objectContaining({ row: 3, kind: 'unmatched', courseCode: 'ZZ999' }),
      expect.objectContaining({ row: 4, kind: 'invalid' }),
      expect.objectContaining({ row: 5, kind: 'invalid', reason: expect.stringContaining('timestamp') }),
      expect.objectContaining({ row: 8, kind: 'invalid', reason: expect.stringContaining('semester') }),
    ]))
    expect(report.reviews.map((r: { sourceRow: number }) => r.sourceRow)).toEqual([1, 6])
    expect(report.reviews[0]).toMatchObject({ courseCode: 'JC201', section: '810001' })
    expect(report.reviews[1]).toMatchObject({ semester: 'ฤดูร้อน', year: 2568, createdAt: '2026-10-05T06:00:00+07:00' })
    expect(report.normalizations).toEqual([{ row: 6, field: 'year', from: 2025, to: 2568 }])
    expect(JSON.stringify(report)).not.toContain('example.invalid')
  })

  it('reports that no catalog was checked when none is supplied', async () => {
    const report = await run(WORKBOOK)
    expect(report).toMatchObject({ catalogChecked: false, accepted: 4 })
  })
})
