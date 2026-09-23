import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
const exec = promisify(execFile)
describe('legacy review importer', () => {
  it('normalizes the snapshot without retaining creator emails', async () => {
    const { stdout } = await exec('node', ['scripts/import-legacy-reviews.mjs', 'old-repo/สำเนาของ เว็บรีวิววิชา.xlsx'], { cwd: process.cwd() })
    const report = JSON.parse(stdout)
    expect(report.sourceRows).toBe(4); expect(report.accepted).toBe(4)
    expect(JSON.stringify(report.reviews)).not.toContain('@')
    expect(report.reviews.every((review: { scheduleVerified: boolean }) => !review.scheduleVerified)).toBe(true)
  })
})
