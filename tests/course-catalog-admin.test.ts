import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../src/App.vue'

const fixture = vi.hoisted(() => ({
  role: null as 'owner' | 'administrator' | null,
  categories: [{ id: 'cat-1', name: 'วิชาศึกษาทั่วไป' }],
  catalog: [{ id: 'course-1', code: 'JC100', name_th: 'วารสารศาสตร์', category_name: 'วิชาแกน' }],
  calls: [] as Array<{ name: string; args?: Record<string, unknown> }>,
}))

vi.mock('../src/neon', () => ({
  neon: {
    auth: { getSession: async () => ({ data: { user: { id: 'user-1', email: 'admin@example.com', name: 'Admin' } } }), signOut: async () => undefined },
    rpc: async (name: string, args?: Record<string, unknown>) => {
      fixture.calls.push({ name, args })
      if (name === 'list_approved_catalog') return { data: fixture.catalog, error: null }
      if (name === 'list_categories') return { data: fixture.categories, error: null }
      if (name === 'current_access') return { data: [{ role: fixture.role }], error: null }
      if (name === 'create_course') {
        const code = String((args as { p_code?: string })?.p_code ?? '')
        if (fixture.catalog.some((course) => course.code === code)) return { data: null, error: { message: `รหัสวิชา ${code} มีอยู่แล้ว` } }
        return { data: null, error: null }
      }
      throw new Error(`Unexpected RPC: ${name}`)
    },
  },
  signInWithGoogle: async () => undefined,
}))

describe('add-course button on the catalog page', () => {
  afterEach(() => vi.unstubAllGlobals())
  beforeEach(() => { fixture.role = null; fixture.calls.length = 0 })

  it('is hidden for a signed-in reader with no admin role', async () => {
    const wrapper = mount(App)
    await flushPromises()
    expect(wrapper.find('.add-course-btn').exists()).toBe(false)
    wrapper.unmount()
  })

  it('opens a modal and creates a course for an administrator', async () => {
    fixture.role = 'administrator'
    const wrapper = mount(App)
    await flushPromises()
    const addButton = wrapper.get('.add-course-btn')
    expect(addButton.text()).toContain('เพิ่มรายวิชาใหม่')
    await addButton.trigger('click')
    await flushPromises()
    await wrapper.get('#new-course-code').setValue('JC200')
    await wrapper.get('#new-course-name').setValue('วิชาใหม่')
    await wrapper.get('.course-modal-body button.btn-purple').trigger('click')
    await flushPromises()
    expect(fixture.calls).toContainEqual({ name: 'create_course', args: { p_code: 'JC200', p_name_th: 'วิชาใหม่', p_category_id: 'cat-1' } })
    expect(wrapper.find('.course-modal-body').exists()).toBe(false)
    expect(wrapper.get('.toast-banner').text()).toContain('เพิ่มรายวิชาสำเร็จ')
    wrapper.unmount()
  })

  it('shows a friendly error and keeps the modal open for a duplicate course code', async () => {
    fixture.role = 'administrator'
    const wrapper = mount(App)
    await flushPromises()
    await wrapper.get('.add-course-btn').trigger('click')
    await flushPromises()
    await wrapper.get('#new-course-code').setValue('JC100')
    await wrapper.get('#new-course-name').setValue('วารสารศาสตร์ (ซ้ำ)')
    await wrapper.get('.course-modal-body button.btn-purple').trigger('click')
    await flushPromises()
    expect(wrapper.get('.course-modal-body .alert-danger').text()).toContain('JC100 มีอยู่แล้ว')
    expect(wrapper.find('.course-modal-body').exists()).toBe(true)
    expect(wrapper.find('.toast-banner').exists()).toBe(false)
    wrapper.unmount()
  })
})
