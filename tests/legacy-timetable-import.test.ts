import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import LegacyTimetableImport from '../src/components/LegacyTimetableImport.vue'

const legacyKey = 'my_tu_schedule_student@example.com'
const oldClass = { code: 'JC100', name: 'วารสารศาสตร์', sec: '1', teacher: 'อาจารย์เก่า', day: 'จันทร์', start: '09:00', end: '11:00' }
const catalog = [{ id: 'course-1', code: 'JC100', name_th: 'วารสารศาสตร์', category_name: 'วิชาแกน' }]

type TimetableFixture = {
  offerings?: Array<{ id: string; section: string; academic_year: number; semester: string; instructor_name: string | null }>
  meetings?: Array<{ day_of_week: number; starts_at: string; ends_at: string }>
  current?: Array<{ offering_id: string; course_code: string; course_name: string; section: string; day_of_week: number; starts_at: string; ends_at: string }>
  failFirstAdd?: boolean
}

function timetableClient(fixture: TimetableFixture = {}) {
  const calls: string[] = []
  const selections = [...(fixture.current ?? [])]
  let addAttempts = 0
  const rpc = vi.fn(async (name: string, args?: Record<string, unknown>) => {
    calls.push(name)
    if (name === 'list_my_timetable') return { data: selections, error: null }
    if (name === 'list_approved_offerings') return { data: args?.p_course_id === 'course-1' ? fixture.offerings ?? [{ id: 'offering-1', section: '1', academic_year: 2569, semester: '1', instructor_name: 'อาจารย์ใหม่' }] : [], error: null }
    if (name === 'list_approved_offering_meetings') return { data: (fixture.offerings ?? [{ id: 'offering-1' }]).some((offering) => offering.id === args?.p_offering_id) ? fixture.meetings ?? [{ day_of_week: 1, starts_at: '09:00:00', ends_at: '11:00:00' }] : [], error: null }
    if (name === 'add_my_timetable_offering') {
      addAttempts++
      if (fixture.failFirstAdd && addAttempts === 1) return { data: null, error: { message: 'temporary failure' } }
      selections.push({ offering_id: String(args?.p_offering_id), course_code: 'JC100', course_name: 'วารสารศาสตร์', section: '1', day_of_week: 1, starts_at: '09:00:00', ends_at: '11:00:00' })
      return { data: null, error: null }
    }
    throw new Error(`Unexpected RPC: ${name}`)
  })
  return { client: { rpc }, calls, selections }
}

describe('legacy timetable import in the signed-in timetable', () => {
  beforeEach(() => window.localStorage.clear())

  it('previews a unique approved section and imports only after confirmation', async () => {
    window.localStorage.setItem(legacyKey, JSON.stringify([oldClass]))
    const { client, calls, selections } = timetableClient()
    const wrapper = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog, client } })
    await flushPromises()

    expect(wrapper.text()).toContain('พบตารางเรียนเดิม')
    expect(calls).toEqual([])
    await wrapper.get('button[data-test="preview-import"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('เทอม 1/2569')
    expect(wrapper.text()).toContain('อาจารย์ใหม่')
    expect(calls).not.toContain('add_my_timetable_offering')

    await wrapper.get('button[data-test="confirm-import"]').trigger('click')
    await flushPromises()
    expect(selections).toHaveLength(1)
    expect(selections[0]?.offering_id).toBe('offering-1')
    expect(wrapper.text()).toContain('นำเข้าสำเร็จ')
    expect(window.localStorage.getItem(legacyKey)).toBe(JSON.stringify([oldClass]))
    expect(wrapper.emitted('imported')).toHaveLength(1)
  })

  it('does not guess between terms with the same course and section', async () => {
    window.localStorage.setItem(legacyKey, JSON.stringify([oldClass]))
    const { client, calls } = timetableClient({ offerings: [
      { id: 'offering-1', section: '1', academic_year: 2569, semester: '1', instructor_name: null },
      { id: 'offering-2', section: '1', academic_year: 2568, semester: '2', instructor_name: null },
    ] })
    const wrapper = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog, client } })
    await flushPromises()
    await wrapper.get('button[data-test="preview-import"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('พบหลายภาคหรือปีการศึกษา')
    expect(wrapper.text()).toContain('เทอม 1/2569')
    expect(wrapper.text()).toContain('เทอม 2/2568')
    expect(wrapper.get('button[data-test="confirm-import"]').attributes('disabled')).toBeDefined()
    expect(calls).not.toContain('add_my_timetable_offering')
  })

  it('shows existing section conflicts without overwriting the account timetable', async () => {
    window.localStorage.setItem(legacyKey, JSON.stringify([oldClass]))
    const { client, calls, selections } = timetableClient({ current: [{ offering_id: 'other-offering', course_code: 'JC100', course_name: 'วารสารศาสตร์', section: '2', day_of_week: 2, starts_at: '13:00:00', ends_at: '15:00:00' }] })
    const wrapper = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog, client } })
    await flushPromises()
    await wrapper.get('button[data-test="preview-import"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('มีอีกกลุ่มของวิชานี้อยู่แล้ว')
    expect(selections).toHaveLength(1)
    expect(calls).not.toContain('add_my_timetable_offering')
  })

  it('does not import a section that overlaps an existing course', async () => {
    window.localStorage.setItem(legacyKey, JSON.stringify([oldClass]))
    const { client, calls } = timetableClient({ current: [{ offering_id: 'other-offering', course_code: 'BJM200', course_name: 'สื่อสาร', section: '1', day_of_week: 1, starts_at: '10:00:00', ends_at: '12:00:00' }] })
    const wrapper = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog, client } })
    await flushPromises()
    await wrapper.get('button[data-test="preview-import"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('เวลาเรียนชนกับตารางปัจจุบัน')
    expect(calls).not.toContain('add_my_timetable_offering')
  })

  it('reports a missing approved section and a meetingless section instead of importing them', async () => {
    window.localStorage.setItem(legacyKey, JSON.stringify([oldClass]))
    const missing = timetableClient({ offerings: [] })
    const missingView = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog, client: missing.client } })
    await flushPromises()
    await missingView.get('button[data-test="preview-import"]').trigger('click')
    await flushPromises()
    expect(missingView.text()).toContain('ไม่พบกลุ่มเรียนทางการที่อนุมัติแล้ว')
    missingView.unmount()

    const meetingless = timetableClient({ meetings: [] })
    const meetinglessView = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog, client: meetingless.client } })
    await flushPromises()
    await meetinglessView.get('button[data-test="preview-import"]').trigger('click')
    await flushPromises()
    expect(meetinglessView.text()).toContain('กลุ่มเรียนทางการไม่มีเวลาเรียนที่ใช้ได้')
    expect(meetingless.calls).not.toContain('add_my_timetable_offering')
  })

  it('keeps a failed entry available for retry and keeps the browser copy', async () => {
    window.localStorage.setItem(legacyKey, JSON.stringify([oldClass]))
    const { client, calls, selections } = timetableClient({ failFirstAdd: true })
    const wrapper = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog, client } })
    await flushPromises()
    await wrapper.get('button[data-test="preview-import"]').trigger('click')
    await flushPromises()
    await wrapper.get('button[data-test="confirm-import"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('temporary failure')
    expect(wrapper.get('button[data-test="confirm-import"]').attributes('disabled')).toBeUndefined()
    await wrapper.get('button[data-test="confirm-import"]').trigger('click')
    await flushPromises()
    expect(calls.filter((name) => name === 'add_my_timetable_offering')).toHaveLength(2)
    expect(selections).toHaveLength(1)
    expect(window.localStorage.getItem(legacyKey)).toBe(JSON.stringify([oldClass]))
  })

  it('keeps each course result visible after a partial failure and retry', async () => {
    window.localStorage.setItem(legacyKey, JSON.stringify([oldClass, { code: 'BJM200', name: 'สื่อสาร', sec: '1', teacher: 'อาจารย์ ข', day: 'อังคาร', start: '13:00', end: '15:00' }]))
    const catalogWithTwo = [...catalog, { id: 'course-2', code: 'BJM200', name_th: 'สื่อสาร', category_name: 'วิชาแกน' }]
    const selections: Array<{ offering_id: string; course_code: string; course_name: string; section: string; day_of_week: number; starts_at: string; ends_at: string }> = []
    let firstAddFailed = false
    const client = { rpc: vi.fn(async (name: string, args?: Record<string, unknown>) => {
      if (name === 'list_my_timetable') return { data: selections, error: null }
      if (name === 'list_approved_offerings') return { data: [{ id: args?.p_course_id === 'course-1' ? 'offering-1' : 'offering-2', section: '1', academic_year: 2569, semester: '1', instructor_name: null }], error: null }
      if (name === 'list_approved_offering_meetings') return { data: args?.p_offering_id === 'offering-1' ? [{ day_of_week: 1, starts_at: '09:00:00', ends_at: '11:00:00' }] : [{ day_of_week: 2, starts_at: '13:00:00', ends_at: '15:00:00' }], error: null }
      if (name === 'add_my_timetable_offering') {
        if (args?.p_offering_id === 'offering-1' && !firstAddFailed) { firstAddFailed = true; return { data: null, error: { message: 'temporary failure' } } }
        const second = args?.p_offering_id === 'offering-2'
        selections.push({ offering_id: String(args?.p_offering_id), course_code: second ? 'BJM200' : 'JC100', course_name: second ? 'สื่อสาร' : 'วารสารศาสตร์', section: '1', day_of_week: second ? 2 : 1, starts_at: second ? '13:00:00' : '09:00:00', ends_at: second ? '15:00:00' : '11:00:00' })
        return { data: null, error: null }
      }
      throw new Error(`Unexpected RPC: ${name}`)
    }) }
    const wrapper = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog: catalogWithTwo, client } })
    await flushPromises()
    await wrapper.get('button[data-test="preview-import"]').trigger('click')
    await flushPromises()
    await wrapper.get('button[data-test="confirm-import"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('temporary failure')
    expect(wrapper.text()).toContain('นำเข้าสำเร็จ')
    await wrapper.get('button[data-test="confirm-import"]').trigger('click')
    await flushPromises()
    expect(selections).toHaveLength(2)
    expect(wrapper.text().match(/นำเข้าสำเร็จ/g)).toHaveLength(2)
    expect(window.localStorage.getItem(legacyKey)).not.toBeNull()
  })

  it('skips a match that changed between preview and confirmation', async () => {
    window.localStorage.setItem(legacyKey, JSON.stringify([oldClass]))
    const offerings = [{ id: 'offering-1', section: '1', academic_year: 2569, semester: '1', instructor_name: 'อาจารย์ใหม่' }]
    const { client, calls } = timetableClient({ offerings })
    const wrapper = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog, client } })
    await flushPromises()
    await wrapper.get('button[data-test="preview-import"]').trigger('click')
    await flushPromises()
    offerings[0] = { ...offerings[0], id: 'offering-changed' }
    await wrapper.get('button[data-test="confirm-import"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('ข้อมูลกลุ่มเรียนเปลี่ยนไป')
    expect(calls).not.toContain('add_my_timetable_offering')
  })

  it('does not show another typed-email timetable or write to the account', async () => {
    window.localStorage.setItem(legacyKey, JSON.stringify([oldClass]))
    const { client, calls } = timetableClient()
    const wrapper = mount(LegacyTimetableImport, { props: { email: 'other@example.com', catalog, client } })
    await flushPromises()
    expect(wrapper.text()).toContain('ไม่พบตารางเรียนเดิมในเบราว์เซอร์นี้')
    expect(wrapper.text()).not.toContain('JC100')
    expect(calls).toEqual([])
  })

  it('reports malformed local data without deleting it or calling the data API', async () => {
    window.localStorage.setItem(legacyKey, '{broken')
    const { client, calls } = timetableClient()
    const wrapper = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog, client } })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('ข้อมูลตารางเรียนเดิม')
    expect(window.localStorage.getItem(legacyKey)).toBe('{broken')
    expect(calls).toEqual([])
  })

  it('skips an invalid old row while allowing a valid row in the same browser copy', async () => {
    window.localStorage.setItem(legacyKey, JSON.stringify([{ code: '', name: '<img src=x onerror=alert(1)>', sec: '', day: 'bad', start: '29:00', end: '30:00' }, oldClass]))
    const { client, calls } = timetableClient()
    const wrapper = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog, client } })
    await flushPromises()
    await wrapper.get('button[data-test="preview-import"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('ข้อมูลวิชา กลุ่ม หรือเวลาเรียนเดิมไม่ถูกต้อง')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('button[data-test="confirm-import"]').text()).toContain('1 วิชา')
    await wrapper.get('button[data-test="confirm-import"]').trigger('click')
    await flushPromises()
    expect(calls.filter((name) => name === 'add_my_timetable_offering')).toHaveLength(1)
    expect(wrapper.text()).toContain('นำเข้าสำเร็จ')
  })

  it('matches the old typed-email key without relying on letter case', async () => {
    window.localStorage.setItem('my_tu_schedule_Student@Example.com', JSON.stringify([oldClass]))
    const { client } = timetableClient()
    const wrapper = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog, client } })
    await flushPromises()
    expect(wrapper.text()).toContain('พบตารางเรียนเดิม')
  })

  it('does not choose between two browser copies for the same typed email', async () => {
    window.localStorage.setItem(legacyKey, JSON.stringify([oldClass]))
    window.localStorage.setItem('my_tu_schedule_Student@Example.com', JSON.stringify([oldClass]))
    const { client, calls } = timetableClient()
    const wrapper = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog, client } })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('หลายรายการ')
    expect(calls).toEqual([])
  })

  it('reports inaccessible local storage without calling the data API', async () => {
    const storage = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('blocked') })
    try {
      const { client, calls } = timetableClient()
      const wrapper = mount(LegacyTimetableImport, { props: { email: 'student@example.com', catalog, client } })
      await flushPromises()
      expect(wrapper.get('[role="alert"]').text()).toContain('อ่านข้อมูลตารางเรียนเดิม')
      expect(calls).toEqual([])
    } finally { storage.mockRestore() }
  })
})
