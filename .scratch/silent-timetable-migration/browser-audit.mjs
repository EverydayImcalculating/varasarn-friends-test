// Isolated mock browser audit. Run with PLAYWRIGHT_MODULE and PLAYWRIGHT_BROWSERS_PATH.
import { writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const out = new URL('./', import.meta.url)
const key = 'my_tu_schedule_admin@example.com'
const old = { code: 'JC232', name: 'เทคนิคการถ่ายทำ', sec: '320001', teacher: 'อ. อ้อม', day: 'พฤหัสบดี', start: '09:30', end: '12:30' }
const browser = await chromium.launch({headless: true})
const records = []
async function run(width, height, scenario, raw, work) {
  const context = await browser.newContext({ viewport: { width, height } })
  await context.addInitScript(({key, raw}) => {
    // A fresh browser context contains no real user data. Block only the dev mock's
    // automatic legacy seed when testing absence; do not alter production code.
    if (!sessionStorage.getItem('audit-initialized')) {
      if (raw !== null) localStorage.setItem(key, raw)
      localStorage.setItem('audit-unrelated', 'preserve-me')
      sessionStorage.setItem('audit-initialized', '1')
    }
    if (raw === null) {
      const set = Storage.prototype.setItem
      Storage.prototype.setItem = function(k,v) { if (this === localStorage && k === key) return; return set.call(this,k,v) }
    }
  }, {key, raw})
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  const row = { width, height, scenario, checks: [], errors }
  try {
    await page.goto('http://127.0.0.1:5179/?timetable=empty')
    await page.locator('.mobile-timetable-btn').waitFor()
    row.badge = await page.locator('.mobile-timetable-btn .badge').count()
    await page.locator('.mobile-timetable-btn').click()
    await page.locator('.timetable-mobile-header').waitFor()
    await work(page, row)
    assert.equal(await page.evaluate(() => localStorage.getItem('audit-unrelated')), 'preserve-me')
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), raw)
    row.storageUnchanged = true
    row.layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, overflows: [...document.querySelectorAll('.legacy-import, .legacy-import button, .legacy-import-row')].filter(e=>e.getBoundingClientRect().right > innerWidth+1 || e.getBoundingClientRect().left < -1).map(e=>e.tagName) }))
    await page.screenshot({ path: new URL(`screenshots/${width}-${scenario}.png`, out).pathname, fullPage:true })
    row.text = await page.locator('body').innerText()
    row.pass = true
  } catch(e) { row.pass = false; row.failure = String(e); await page.screenshot({path:new URL(`screenshots/${width}-${scenario}-failure.png`,out).pathname,fullPage:true}) }
  records.push(row)
  console.log(JSON.stringify({width,scenario,pass:row.pass,failure:row.failure,checks:row.checks,layout:row.layout}))
  await context.close()
}
async function preview(p) { await p.locator('[data-test="preview-import"]').click(); await p.locator('.legacy-import-row').first().waitFor() }
async function rpc(p, name) { return p.evaluate(async name => { const {neon}=await import('/mock/neon.mock.ts'); return neon.rpc(name) },name) }
for (const [w,h] of [[393,852],[360,780]]) {
 await run(w,h,'absent',null,async(p,r)=>{assert.equal(r.badge,0); assert.equal(await p.locator('.legacy-import').count(),0); r.checks.push('No badge/banner with absent key')})
 await run(w,h,'valid',JSON.stringify([old]),async(p,r)=>{
   assert.equal(r.badge,1); assert.equal((await rpc(p,'list_my_timetable')).data.length,0)
   await preview(p); assert.match(await p.locator('.legacy-import').innerText(),/พร้อมนำเข้า/)
   assert.equal((await rpc(p,'list_my_timetable')).data.length,0)
   await p.screenshot({path:new URL(`screenshots/${w}-preview.png`,out).pathname,fullPage:true})
   await p.locator('[data-test="confirm-import"]').click(); await p.getByText('ผลนำเข้า: นำเข้าสำเร็จ',{exact:true}).waitFor()
   assert.equal((await rpc(p,'list_my_timetable')).data[0].offering_id,'offering-2')
   await p.getByRole('button',{name:'เลือกวันพฤหัสบดี',exact:true}).click()
   await p.locator('.timetable-day-course').waitFor(); assert.match(await p.locator('.timetable-day-course').innerText(),/JC232/)
   await p.screenshot({path:new URL(`screenshots/${w}-imported-timetable.png`,out).pathname,fullPage:true}); r.checks.push('Badge, banner, preview, explicit import, account RPC result and Thursday UI verified')
   await p.getByRole('button',{name:'กลับหน้ารายวิชา',exact:true}).click(); assert.equal(await p.locator('.mobile-timetable-btn .badge').count(),1)
   await p.locator('.mobile-timetable-btn').click(); await preview(p); assert.match(await p.locator('.legacy-import').innerText(),/มีอยู่ในตารางเรียน/)
   r.checks.push('Success still leaves badge/banner; reopening sees already imported')
   await p.reload(); await p.locator('.mobile-timetable-btn').click(); await preview(p)
   assert.equal((await rpc(p,'list_my_timetable')).data.length,0); r.checks.push('Reload resets mock account data, original localStorage survives')
 })
 await run(w,h,'later',JSON.stringify([old]),async(p,r)=>{
   await p.getByRole('button',{name:'ไว้ภายหลัง',exact:true}).click(); await p.getByRole('button',{name:'ดูตารางเรียนเดิมที่พบ',exact:true}).click()
   await p.locator('[data-test="preview-import"]').waitFor()
   await p.getByRole('button',{name:'ไว้ภายหลัง',exact:true}).click()
   await p.getByRole('button',{name:'กลับหน้ารายวิชา',exact:true}).click(); await p.locator('.mobile-timetable-btn').click()
   await p.locator('[data-test="preview-import"]').waitFor()
   await p.getByRole('button',{name:'ไว้ภายหลัง',exact:true}).click(); await p.reload(); await p.locator('.mobile-timetable-btn').click(); await p.locator('[data-test="preview-import"]').waitFor()
   r.checks.push('Later hides banner; reopen works; navigation and reload reset dismissal')
 })
 for (const [s,raw] of [['malformed','{broken'],['outdated-object',JSON.stringify({courses:[old]})]]) await run(w,h,s,raw,async(p,r)=>{await p.getByRole('alert').waitFor();assert.equal(await p.locator('[data-test="confirm-import"]').count(),0);r.checks.push('Recoverable storage alert, no import')})
 await run(w,h,'invalid-missing',JSON.stringify([{...old,sec:undefined,section:'320001'}, {...old,code:'JC999'}, {...old,sec:'999'}, old]),async(p,r)=>{
   await preview(p); const text=await p.locator('.legacy-import').innerText(); assert.match(text,/ข้อมูลวิชา กลุ่ม หรือเวลาเรียนเดิมไม่ถูกต้อง/); assert.match(text,/ไม่พบกลุ่มเรียนทางการ/)
   assert.match(await p.locator('[data-test="confirm-import"]').innerText(),/1 วิชา/)
   await p.locator('[data-test="confirm-import"]').click(); await p.getByText('ผลนำเข้า: นำเข้าสำเร็จ',{exact:true}).waitFor(); assert.equal((await rpc(p,'list_my_timetable')).data.length,1)
   r.checks.push('Outdated row, missing course/section skipped; valid row imported')
 })
 await run(w,h,'duplicates',JSON.stringify([old,old]),async(p,r)=>{await preview(p);assert.equal(await p.locator('[data-test="confirm-import"]').isDisabled(),true);assert.match(await p.locator('.legacy-import').innerText(),/รายการเดิมชนกันหรือซ้ำวิชา/);r.checks.push('Both duplicate rows blocked; no selectable row')})
 await run(w,h,'lost-acknowledgement',JSON.stringify([old]),async(p,r)=>{
   await preview(p)
   await p.evaluate(async()=>{const {neon}=await import('/mock/neon.mock.ts');const original=neon.rpc;let failed=false;neon.rpc=async(name,args)=>{const response=await original(name,args);if(name==='add_my_timetable_offering'&&!failed){failed=true;return {data:null,error:{message:'audit response lost after commit'}}}return response}})
   await p.locator('[data-test="confirm-import"]').click(); await p.getByText('ผลนำเข้า: audit response lost after commit',{exact:true}).waitFor()
   assert.equal((await rpc(p,'list_my_timetable')).data.length,1)
   await p.locator('[data-test="confirm-import"]').click(); await p.getByText('ผลนำเข้า: มีอยู่ในตารางเรียนของคุณแล้ว',{exact:true}).waitFor()
   assert.equal((await rpc(p,'list_my_timetable')).data.length,1)
   await p.getByRole('button',{name:'เลือกวันพฤหัสบดี',exact:true}).click()
   assert.equal(await p.locator('.timetable-day-course').count(),0)
   r.checks.push('Injected commit then lost response: retry avoids duplicate but timetable UI remains empty until navigation')
 })
 await run(w,h,'failure-retry',JSON.stringify([old]),async(p,r)=>{
   await preview(p)
   await p.evaluate(async()=>{const {neon}=await import('/mock/neon.mock.ts');const original=neon.rpc;let failed=false;neon.rpc=async(name,args)=>{if(name==='add_my_timetable_offering'&&!failed){failed=true;return {data:null,error:{message:'audit transient failure'}}}return original(name,args)}})
   await p.locator('[data-test="confirm-import"]').click(); await p.getByText('ผลนำเข้า: audit transient failure',{exact:true}).waitFor();assert.equal((await rpc(p,'list_my_timetable')).data.length,0)
   await p.screenshot({path:new URL(`screenshots/${w}-failure.png`,out).pathname,fullPage:true})
   await p.locator('[data-test="confirm-import"]').click(); await p.getByText('ผลนำเข้า: นำเข้าสำเร็จ',{exact:true}).waitFor();assert.equal((await rpc(p,'list_my_timetable')).data.length,1)
   r.checks.push('Browser-only injected first add failure; retry succeeds once')
 })
}
await writeFile(new URL('browser-results.json',out),JSON.stringify(records,null,2))
await browser.close()
if(records.some(r=>!r.pass)) process.exitCode=1
