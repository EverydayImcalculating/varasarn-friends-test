import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const key = 'my_tu_schedule_admin@example.com'
const saved = JSON.stringify([
  { code: 'JC232', name: 'เทคนิคการถ่ายทำ', sec: '320001', teacher: 'อ. อ้อม', day: 'พฤหัสบดี', start: '09:30', end: '12:30' },
  { code: 'JC999', name: 'คลาสเก่าที่ไม่มีในแค็ตตาล็อก', sec: '1', teacher: 'อ. ไม่ทราบชื่อ', day: 'จันทร์', start: '09:00', end: '10:00' },
])
const browser = await chromium.launch({ headless: true })
for (const { width, height } of [{ width: 393, height: 852 }, { width: 360, height: 780 }]) {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript(({ key, saved }) => {
    if (!sessionStorage.getItem('audit-started')) {
      localStorage.setItem(key, saved)
      localStorage.setItem('audit-unrelated', 'preserve')
      sessionStorage.setItem('audit-started', '1')
    }
  }, { key, saved })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto('http://127.0.0.1:5180/?timetable=empty')
  await page.locator('.mobile-timetable-btn').waitFor()
  await page.waitForFunction(async () => {
    const { neon } = await import('/mock/neon.mock.ts')
    const result = await neon.rpc('list_my_timetable')
    return (result.data ?? []).some((entry) => entry.course_code === 'JC232')
  }, null, { timeout: 10000 })
  assert.equal(await page.locator('.mobile-timetable-btn .badge').count(), 0)
  assert.equal(await page.locator('.legacy-import').count(), 0)
  assert.doesNotMatch(await page.locator('body').innerText(), /พบตารางเรียนเดิม|ยืนยันนำเข้า|ไว้ภายหลัง/)
  await page.locator('.mobile-timetable-btn').click()
  await page.locator('[aria-label="เลือกวันพฤหัสบดี"]').click()
  await page.locator('.timetable-day-course').filter({ hasText: 'JC232' }).waitFor()
  const firstView = await page.locator('.timetable-day-course').allTextContents()
  assert.ok(firstView.some((text) => text.includes('JC232')))
  const initialOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  assert.equal(initialOverflow, false)
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), saved)
  assert.equal(await page.evaluate(() => localStorage.getItem('audit-unrelated')), 'preserve')

  await page.reload()
  await page.locator('.mobile-timetable-btn').click()
  await page.locator('[aria-label="เลือกวันพฤหัสบดี"]').click()
  await page.locator('.timetable-day-course').filter({ hasText: 'JC232' }).waitFor()
  assert.ok((await page.locator('.timetable-day-course').allTextContents()).some((text) => text.includes('JC232')))
  const stateAfterReload = await page.evaluate(async () => {
    const { neon } = await import('/mock/neon.mock.ts')
    const official = await neon.rpc('list_my_timetable')
    const legacy = await neon.rpc('list_my_legacy_timetable')
    return { official: official.data, legacy: legacy.data }
  })
  assert.equal(stateAfterReload.official.filter((entry) => entry.course_code === 'JC232').length, 1)
  assert.equal(stateAfterReload.legacy.filter((entry) => entry.course_code === 'JC999').length, 1)
  await page.evaluate(async () => {
    const { neon } = await import('/mock/neon.mock.ts')
    await neon.rpc('remove_my_timetable_offering', { p_offering_id: 'offering-2' })
  })
  await page.reload()
  const afterRemovalReload = await page.evaluate(async () => {
    const { neon } = await import('/mock/neon.mock.ts')
    return (await neon.rpc('list_my_timetable')).data
  })
  assert.equal(afterRemovalReload.some((entry) => entry.course_code === 'JC232'), false)
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), key), saved)
  assert.deepEqual(pageErrors, [])
  const finalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
  assert.equal(finalOverflow, false)
  await page.screenshot({ path: new URL(`screenshots/${width}-silent-migrated.png`, import.meta.url).pathname, fullPage: true })
  console.log(JSON.stringify({ viewport: `${width}x${height}`, officialRowsAfterReload: stateAfterReload.official.filter((entry) => entry.course_code === 'JC232').length, privateRowsAfterReload: stateAfterReload.legacy.filter((entry) => entry.course_code === 'JC999').length, removedRowsRemainRemoved: afterRemovalReload.every((entry) => entry.course_code !== 'JC232'), originalStoragePreserved: true, overflow: false, pageErrors: 0 }))
  await context.close()
}
await browser.close()
