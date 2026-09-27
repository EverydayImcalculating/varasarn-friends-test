// Adapted from ../silent-timetable-migration/verify-automatic-migration.mjs.
// Fixture + persistent dev RPC fake only; never connect to a production origin.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const origin = 'http://127.0.0.1:5181'
const key = 'my_tu_schedule_admin@example.com' // Existing dev-only fake account.
const authentic = await readFile(new URL('../../tests/fixtures/legacy-timetable-authentic.json', import.meta.url), 'utf8')
assert.equal(createHash('sha256').update(authentic).digest('hex'), '3e12cb71b8d0f054d6a484d4e2bbf2478bf13514a317bd77cdcb32f5c447e8b2')
const originalRows = JSON.parse(authentic)
const variants = [
  { name: 'authentic-bytes', saved: authentic },
  { name: 'canonical-duplicate', saved: JSON.stringify([...originalRows, { ...originalRows[1], start: '09:30' }]) },
]
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) })
try {
  for (const variant of variants) {
    const context = await browser.newContext({ viewport: { width: 393, height: 852 } })
    try {
      // Block external network, including all production services.
      await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
      await context.addInitScript(({ key, saved, origin }) => {
        if (location.origin !== origin) return
        if (!sessionStorage.getItem('legacy-time-fixture-seeded')) {
          localStorage.setItem(key, saved)
          sessionStorage.setItem('legacy-time-fixture-seeded', '1')
        }
      }, { key, saved: variant.saved, origin })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(origin)
      for (let visit = 0; visit < 3; visit++) {
        if (visit === 1) await page.reload()
        if (visit === 2) { await page.goto('about:blank'); await page.goto(origin) }
        await page.waitForFunction(async () => {
          const { neon } = await import('/mock/neon.mock.ts')
          const { data } = await neon.rpc('list_my_legacy_timetable')
          return data?.some(row => row.course_code === 'JC232')
        })
        const state = await page.evaluate(async () => {
          const { neon } = await import('/mock/neon.mock.ts')
          return {
            official: (await neon.rpc('list_my_timetable')).data,
            legacy: (await neon.rpc('list_my_legacy_timetable')).data,
            receipts: JSON.parse(localStorage.getItem('__dev_mock_timetable_admin@example.com')).receipts.length,
          }
        })
        assert.equal(state.official.filter(row => row.course_code === 'GE101').length, 1, 'existing mock selection preserved')
        assert.equal(state.legacy.length, 2)
        assert.equal(state.receipts, 2, 'equivalent times must not create another receipt')
        for (const row of originalRows) {
          const recovered = state.legacy.filter(item => item.course_code === row.code)
          assert.equal(recovered.length, 1)
          assert.deepEqual(
            [recovered[0].course_name, recovered[0].section, recovered[0].instructor_name, recovered[0].day_of_week, recovered[0].starts_at, recovered[0].ends_at],
            [row.name, row.sec, row.teacher, 4, row.code === 'JC232' ? '09:30:00' : '13:30:00', `${row.end}:00`],
          )
        }
        assert.equal(await page.evaluate(key => localStorage.getItem(key), key), variant.saved)
        assert.equal(await page.locator('.mobile-timetable-btn .badge').count(), 0)
        assert.equal(await page.locator('.legacy-import').count(), 0)
        await page.locator('.mobile-timetable-btn').click()
        await page.locator('[aria-label="เลือกวันพฤหัสบดี"]').click()
        const jc = page.locator('.timetable-day-course').filter({ hasText: 'JC232' })
        await jc.waitFor()
        assert.equal(await jc.count(), 1)
        assert.match(await jc.innerText(), /09:30–12:30/)
        assert.doesNotMatch(await page.locator('body').innerText(), /พบตารางเรียนเดิม|ยืนยันนำเข้า|ไว้ภายหลัง|เดิม/)
        for (const viewport of [{ width: 393, height: 852 }, { width: 360, height: 780 }]) {
          await page.setViewportSize(viewport)
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
        }
      }
      assert.deepEqual(errors, [])
      console.log(JSON.stringify({ evidence: 'fixture-based / mocked backend, not real cutover', variant: variant.name, visits: 3, recovered: 2, receipts: 2, existingSelectionPreserved: true, sourceBytesPreserved: true, viewports: ['393x852', '360x780'], pageErrors: 0 }))
    } finally { await context.close() }
  }
} finally { await browser.close() }
