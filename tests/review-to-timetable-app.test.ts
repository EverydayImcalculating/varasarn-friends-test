import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../src/App.vue'

const fixture = vi.hoisted(() => ({
  offerings: [{ id: 'offering-1', section: '320001', academic_year: 2568, semester: '1', instructor_name: 'อ. อ้อม' }],
  reviews: [{ id: 'review-1', rating: 5, text: 'สนุกมาก', created_at: '2026-09-23T10:00:00Z', section: '320001', semester: '1', academic_year: 2568, instructor_name: 'อ. อ้อม', day_of_week: 4, starts_at: '09:30:00', ends_at: '12:30:00' }],
  meetings: [{ day_of_week: 4, starts_at: '09:30:00', ends_at: '12:30:00' }],
  timetable: [] as Array<{ offering_id: string; course_code: string; course_name: string; section: string; day_of_week: number; starts_at: string; ends_at: string }>,
  reported: [] as Array<{ review_id: string; course_code: string; course_name: string; section: string; day_of_week: number; starts_at: string; ends_at: string }>,
  writeError: null as string | null,
  calls: [] as Array<{ name: string; args?: Record<string, unknown> }>,
}))

vi.mock('../src/neon', () => ({
  neon: {
    auth: { getSession: async () => ({ data: { user: { id: 'user-1', email: 'student@example.com', name: 'Student' } } }), signOut: async () => undefined },
    rpc: async (name: string, args?: Record<string, unknown>) => {
      fixture.calls.push({ name, args })
      if (name === 'list_approved_catalog') return { data: [{ id: 'course-1', code: 'JC232', name_th: 'เทคนิคการถ่ายทำ', category_name: 'วิชาเอก' }], error: null }
      if (name === 'list_approved_offerings') return { data: fixture.offerings, error: null }
      if (name === 'list_visible_reviews') return { data: fixture.reviews, error: null }
      if (name === 'list_approved_offering_meetings') return { data: fixture.meetings, error: null }
      if (name === 'list_my_timetable') return { data: fixture.timetable, error: null }
      if (name === 'list_my_reported_timetable') return { data: fixture.reported, error: null }
      if (name === 'add_my_timetable_review') {
        if (fixture.writeError) return { data: null, error: { message: fixture.writeError } }
        fixture.timetable = fixture.timetable.filter((entry) => entry.course_code !== 'JC232')
        fixture.reported = [{ review_id: String(args?.p_review_id), course_code: 'JC232', course_name: 'เทคนิคการถ่ายทำ', section: '320001', day_of_week: 4, starts_at: '09:30:00', ends_at: '12:30:00' }]
        return { data: null, error: null }
      }
      if (name === 'remove_my_timetable_review') {
        fixture.reported = fixture.reported.filter((entry) => entry.review_id !== args?.p_review_id)
        return { data: null, error: null }
      }
      if (name === 'add_my_timetable_offering' || name === 'replace_my_timetable_offering') {
        if (fixture.writeError) return { data: null, error: { message: fixture.writeError } }
        fixture.timetable = [...fixture.timetable.filter((entry) => name !== 'replace_my_timetable_offering' || entry.course_code !== 'JC232'), { offering_id: String(args?.p_offering_id), course_code: 'JC232', course_name: 'เทคนิคการถ่ายทำ', section: '320001', day_of_week: 4, starts_at: '09:30:00', ends_at: '12:30:00' }]
        return { data: null, error: null }
      }
      if (name === 'list_categories') return { data: [], error: null }
      if (name === 'current_access') return { data: [{ role: null }], error: null }
      if (name === 'list_my_offering_proposals') return { data: [], error: null }
      throw new Error(`Unexpected RPC: ${name}`)
    },
  },
  signInWithGoogle: async () => undefined,
}))

async function openReview() {
  const wrapper = mount(App)
  await flushPromises()
  await wrapper.get('.course-card').trigger('click')
  await flushPromises()
  return wrapper
}

describe('review to personal timetable', () => {
  afterEach(() => vi.unstubAllGlobals())
  beforeEach(() => {
    fixture.offerings = [{ id: 'offering-1', section: '320001', academic_year: 2568, semester: '1', instructor_name: 'อ. อ้อม' }]
    fixture.reviews = [{ id: 'review-1', rating: 5, text: 'สนุกมาก', created_at: '2026-09-23T10:00:00Z', section: '320001', semester: '1', academic_year: 2568, instructor_name: 'อ. อ้อม', day_of_week: 4, starts_at: '09:30:00', ends_at: '12:30:00' }]
    fixture.meetings = [{ day_of_week: 4, starts_at: '09:30:00', ends_at: '12:30:00' }]
    fixture.timetable = []
    fixture.reported = []
    fixture.writeError = null
    fixture.calls.length = 0
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('adds the approved offering from the review and offers to show the timetable', async () => {
    const wrapper = await openReview()
    const review = wrapper.get('.review-card')
    expect(review.text()).toContain('320001')
    expect(review.text()).toContain('พฤหัสบดี')
    await review.get('button').trigger('click')
    await flushPromises()
    expect(fixture.calls).toContainEqual({ name: 'add_my_timetable_offering', args: { p_offering_id: 'offering-1' } })
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('ตารางเรียน'))
    expect(wrapper.get('.timetable-course').text()).toContain('JC232 (320001)')
    wrapper.unmount()
  })

  it('adds a review-backed personal selection when there is no approved matching class', async () => {
    fixture.offerings = []
    fixture.reviews[0].created_at = 'invalid'
    const wrapper = await openReview()
    const review = wrapper.get('.review-card')
    expect(review.text()).toContain('สนุกมาก')
    expect(review.text()).not.toContain('Invalid Date')
    expect(review.get('button').text()).toContain('เพิ่มลงตาราง')
    await review.get('button').trigger('click')
    await flushPromises()
    expect(fixture.calls).toContainEqual({ name: 'add_my_timetable_review', args: { p_review_id: 'review-1' } })
    expect(wrapper.get('.timetable-course').text()).toContain('JC232 (320001)')
    wrapper.unmount()
  })

  it('can remove a private review schedule from the timetable', async () => {
    fixture.offerings = []
    fixture.reported = [{ review_id: 'review-1', course_code: 'JC232', course_name: 'เทคนิคการถ่ายทำ', section: '320001', day_of_week: 4, starts_at: '09:30:00', ends_at: '12:30:00' }]
    const wrapper = await openReview()
    expect(wrapper.get('.review-card').text()).toContain('อยู่ในตารางแล้ว')
    await wrapper.get('nav .btn-light').trigger('click')
    await flushPromises()
    expect(wrapper.get('.timetable-course').text()).toContain('ข้อมูลจากรีวิว')
    await wrapper.get('.review-box button.btn-outline-danger').trigger('click')
    await flushPromises()
    expect(fixture.calls).toContainEqual({ name: 'remove_my_timetable_review', args: { p_review_id: 'review-1' } })
    expect(wrapper.find('.timetable-course').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows a private selection save failure without claiming success', async () => {
    fixture.offerings = []
    fixture.writeError = 'save failed'
    const wrapper = await openReview()
    await wrapper.get('.review-card button').trigger('click')
    await flushPromises()
    expect(wrapper.get('.course-review-body [role="alert"]').text()).toContain('save failed')
    expect(fixture.reported).toHaveLength(0)
    wrapper.unmount()
  })

  it('shows the approved meeting when the review reports a different time', async () => {
    fixture.meetings = [{ day_of_week: 2, starts_at: '13:00:00', ends_at: '15:00:00' }]
    const wrapper = await openReview()
    const review = wrapper.get('.review-card')
    expect(review.text()).toContain('อังคาร 13:00–15:00')
    expect(review.text()).toContain('วันพฤหัสบดี')
    expect(review.text()).toContain('09:30 - 12:30 น.')
    wrapper.unmount()
  })

  it('offers a private review schedule when the approved class has no meeting', async () => {
    fixture.meetings = []
    const wrapper = await openReview()
    expect(wrapper.get('.review-card').text()).not.toContain('ข้อมูลกลุ่มเรียนที่อนุมัติ')
    expect(wrapper.find('.review-card button').exists()).toBe(true)
    wrapper.unmount()
  })

  it('offers only a private review schedule when multiple approved classes match a review', async () => {
    fixture.offerings.push({ id: 'offering-2', section: '320001', academic_year: 2568, semester: '1', instructor_name: 'อ. อ้อม' })
    const wrapper = await openReview()
    expect(wrapper.get('.review-card').text()).not.toContain('ข้อมูลกลุ่มเรียนที่อนุมัติ')
    expect(wrapper.find('.review-card button').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows the selected state instead of adding the same class twice', async () => {
    fixture.timetable = [{ offering_id: 'offering-1', course_code: 'JC232', course_name: 'เทคนิคการถ่ายทำ', section: '320001', day_of_week: 4, starts_at: '09:30:00', ends_at: '12:30:00' }]
    const wrapper = await openReview()
    expect(wrapper.get('.review-card').text()).toContain('อยู่ในตารางแล้ว')
    expect(wrapper.find('.review-card button').exists()).toBe(false)
    wrapper.unmount()
  })

  it('does not add a class if approval changes after the dialog opens', async () => {
    const wrapper = await openReview()
    fixture.offerings = []
    await wrapper.get('.review-card button').trigger('click')
    await flushPromises()
    expect(wrapper.get('.course-review-body [role="alert"]').text()).toContain('ไม่ได้เปิดให้เพิ่มลงตาราง')
    expect(fixture.calls.some(({ name }) => name === 'add_my_timetable_offering')).toBe(false)
    wrapper.unmount()
  })

  it('uses the private reported schedule if the approved period changes before selection', async () => {
    const wrapper = await openReview()
    fixture.offerings[0].semester = '2'
    await wrapper.get('.review-card button').trigger('click')
    await flushPromises()
    expect(fixture.calls.some(({ name }) => name === 'add_my_timetable_offering')).toBe(false)
    expect(fixture.calls.some(({ name }) => name === 'add_my_timetable_review')).toBe(true)
    wrapper.unmount()
  })

  it('shows a changed official meeting before allowing a review-linked selection', async () => {
    const wrapper = await openReview()
    fixture.meetings = [{ day_of_week: 2, starts_at: '13:00:00', ends_at: '15:00:00' }]
    await wrapper.get('.review-card button').trigger('click')
    await flushPromises()
    expect(fixture.calls.some(({ name }) => name === 'add_my_timetable_offering')).toBe(false)
    expect(wrapper.get('.review-card').text()).toContain('อังคาร 13:00–15:00')
    expect(wrapper.get('.course-review-body [role="alert"]').text()).toContain('เวลาเรียนทางการเปลี่ยนไป')
    await wrapper.get('.review-card button').trigger('click')
    await flushPromises()
    expect(fixture.calls.some(({ name }) => name === 'add_my_timetable_offering')).toBe(true)
    wrapper.unmount()
  })

  it('asks before replacing an existing section and leaves it alone when canceled', async () => {
    fixture.timetable = [{ offering_id: 'old-offering', course_code: 'JC232', course_name: 'เทคนิคการถ่ายทำ', section: '320002', day_of_week: 4, starts_at: '13:00:00', ends_at: '15:00:00' }]
    vi.stubGlobal('confirm', vi.fn(() => false))
    const wrapper = await openReview()
    await wrapper.get('.review-card button').trigger('click')
    await flushPromises()
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('เปลี่ยนเป็นกลุ่ม 320001'))
    expect(fixture.calls.some(({ name }) => name === 'replace_my_timetable_offering')).toBe(false)
    expect(fixture.timetable[0].section).toBe('320002')
    wrapper.unmount()
  })

  it('replaces the selected section after confirmation', async () => {
    fixture.timetable = [{ offering_id: 'old-offering', course_code: 'JC232', course_name: 'เทคนิคการถ่ายทำ', section: '320002', day_of_week: 4, starts_at: '13:00:00', ends_at: '15:00:00' }]
    const wrapper = await openReview()
    await wrapper.get('.review-card button').trigger('click')
    await flushPromises()
    expect(fixture.calls).toContainEqual({ name: 'replace_my_timetable_offering', args: { p_offering_id: 'offering-1' } })
    expect(fixture.timetable.map((entry) => entry.section)).toEqual(['320001'])
    wrapper.unmount()
  })

  it('warns about another course that overlaps and saves only after confirmation', async () => {
    fixture.timetable = [{ offering_id: 'other-offering', course_code: 'AP164', course_name: 'เศรษฐศาสตร์', section: '1', day_of_week: 4, starts_at: '10:00:00', ends_at: '11:00:00' }]
    vi.stubGlobal('confirm', vi.fn(() => false))
    const wrapper = await openReview()
    await wrapper.get('.review-card button').trigger('click')
    await flushPromises()
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('AP164'))
    expect(fixture.calls.some(({ name }) => name === 'add_my_timetable_offering')).toBe(false)
    wrapper.unmount()
  })

  it('keeps the dialog open after saving when the user declines the timetable view', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    const wrapper = await openReview()
    await wrapper.get('.review-card button').trigger('click')
    await flushPromises()
    expect(fixture.timetable[0].offering_id).toBe('offering-1')
    expect(wrapper.get('.review-card').text()).toContain('อยู่ในตารางแล้ว')
    expect(wrapper.find('.course-review-modal').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows a save error in the dialog without claiming success', async () => {
    fixture.writeError = 'save failed'
    const wrapper = await openReview()
    await wrapper.get('.review-card button').trigger('click')
    await flushPromises()
    expect(wrapper.get('.course-review-body [role="alert"]').text()).toContain('save failed')
    expect(fixture.timetable).toHaveLength(0)
    expect(wrapper.find('.course-review-modal').exists()).toBe(true)
    wrapper.unmount()
  })
})
