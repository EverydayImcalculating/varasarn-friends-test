import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../src/App.vue'

const fixture = vi.hoisted(() => ({
  user: null as { id: string; email: string; name: string } | null,
  calls: [] as string[],
}))

vi.mock('../src/neon', () => ({
  neon: {
    auth: { getSession: async () => ({ data: { user: fixture.user } }), signOut: async () => undefined },
    rpc: async (name: string) => {
      fixture.calls.push(name)
      if (name === 'list_approved_catalog') return { data: [{ id: 'course-1', code: 'JC100', name_th: 'วารสารศาสตร์', category_name: 'วิชาแกน' }], error: null }
      if (name === 'list_approved_offerings') return { data: [{ id: 'offering-1', section: '1', academic_year: 2569, semester: '1', instructor_name: 'อาจารย์ใหม่' }], error: null }
      if (name === 'list_approved_offering_meetings') return { data: [{ day_of_week: 1, starts_at: '09:00:00', ends_at: '11:00:00' }], error: null }
      if (name === 'list_my_timetable' || name === 'list_my_reported_timetable' || name === 'list_categories') return { data: [], error: null }
      if (name === 'current_access') return { data: [{ role: null }], error: null }
      if (name === 'add_my_timetable_offering') return { data: null, error: null }
      throw new Error(`Unexpected RPC: ${name}`)
    },
  },
  signInWithGoogle: async () => undefined,
  withRange: (query: unknown) => query,
}))

describe('legacy timetable detection after authentication', () => {
  beforeEach(() => { window.localStorage.clear(); fixture.calls.length = 0; fixture.user = null })

  it('finds the old timetable after sign-in, then previews it from the account timetable', async () => {
    fixture.user = { id: 'user-1', email: 'student@example.com', name: 'Student' }
    window.localStorage.setItem('my_tu_schedule_student@example.com', JSON.stringify([{ code: 'JC100', name: 'วารสารศาสตร์', sec: '1', teacher: 'อาจารย์เก่า', day: 'จันทร์', start: '09:00', end: '11:00' }]))
    const wrapper = mount(App)
    await flushPromises()
    expect(wrapper.find('nav').text()).toContain('ตารางเรียนเดิม')
    expect(fixture.calls).not.toContain('add_my_timetable_offering')

    const timetableButton = wrapper.findAll('nav button').find((button) => button.text().includes('ตารางเรียน'))
    await timetableButton!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('พบตารางเรียนเดิมในเบราว์เซอร์นี้')
    await wrapper.get('button[data-test="preview-import"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('เทอม 1/2569')
    expect(fixture.calls).not.toContain('add_my_timetable_offering')
    wrapper.unmount()
  })

  it('does not read the old timetable while signed out', async () => {
    window.localStorage.setItem('my_tu_schedule_student@example.com', 'not-json')
    const keyRead = vi.spyOn(window.localStorage, 'key')
    try {
      const wrapper = mount(App)
      await flushPromises()
      expect(wrapper.text()).toContain('เข้าสู่ระบบด้วย Google')
      expect(wrapper.text()).not.toContain('ตารางเรียนเดิม')
      expect(keyRead).not.toHaveBeenCalled()
      wrapper.unmount()
    } finally { keyRead.mockRestore() }
  })
})
