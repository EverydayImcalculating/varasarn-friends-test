import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const exec = promisify(execFile)
const runImport = async (file: string) => {
  const { stdout } = await exec('node', ['scripts/import-courses.mjs', file], { cwd: process.cwd() })
  return JSON.parse(stdout)
}

describe('course importer', () => {
  it('reads the headerless workbook snapshot without using row numbers as IDs', async () => {
    const report = await runImport('old-repo/สำเนาของ เว็บรีวิววิชา.xlsx')
    expect(report.sourceRows).toBeGreaterThan(200)
    expect(report.accepted).toBeGreaterThan(200)
    expect(report.courses[0]).toMatchObject({ code: expect.any(String), sourceRow: expect.any(Number) })
    expect(report.courses[0]).not.toHaveProperty('id')
  })

  it('normalizes fresh exports and reports duplicate and incomplete rows', async () => {
    const report = await runImport('tests/fixtures/courses-fresh.json')
    expect(report.accepted).toBe(2)
    expect(report.courses.map((course: { code: string }) => course.code)).toEqual(['JC301', 'JC303'])
    expect(report.rejected).toEqual([
      expect.objectContaining({ row: 2, reason: expect.stringContaining('duplicate code (JC301)') }),
      expect.objectContaining({ row: 3, reason: expect.stringContaining('missing') }),
    ])
  })
})
