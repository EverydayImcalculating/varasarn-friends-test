import { describe, expect, it } from 'vitest'
import { AdminService } from '../src/services/admin'

describe('AdminService', () => {
  it('uses owner-only RPCs to list verified accounts and grant administrator access', async () => {
    const calls: Array<{ name: string; args?: Record<string, unknown> }> = []
    const service = new AdminService({
      rpc: async (name, args) => {
        calls.push({ name, args })
        if (name === 'list_verified_accounts') {
          return { data: [{ id: 'user-b', name: 'B', email: 'b@example.com' }], error: null }
        }
        return { data: null, error: null }
      },
    })

    await expect(service.listVerifiedAccounts()).resolves.toEqual([
      { id: 'user-b', name: 'B', email: 'b@example.com' },
    ])
    await expect(service.grantAdministrator('user-b')).resolves.toBeUndefined()
    expect(calls).toEqual([
      { name: 'list_verified_accounts', args: undefined },
      { name: 'grant_administrator', args: { p_user_id: 'user-b' } },
    ])
  })

  it('normalizes a course code before using the administrator create RPC', async () => {
    const calls: Array<{ name: string; args?: Record<string, unknown> }> = []
    const service = new AdminService({ rpc: async (name, args) => { calls.push({ name, args }); return { data: null, error: null } } })

    await service.createCourse({ code: ' jc 101 ', nameTh: 'การเขียนข่าว', categoryId: 'category-1' })

    expect(calls).toEqual([{
      name: 'create_course',
      args: { p_code: 'JC101', p_name_th: 'การเขียนข่าว', p_category_id: 'category-1' },
    }])
  })

  it('uses the category RPCs for administrator-managed categories', async () => {
    const calls: Array<{ name: string; args?: Record<string, unknown> }> = []
    const service = new AdminService({ rpc: async (name, args) => { calls.push({ name, args }); return { data: name === 'list_categories' ? [{ id: 'cat-1', name: 'วิชาแกน' }] : null, error: null } } })
    await expect(service.listCategories()).resolves.toEqual([{ id: 'cat-1', name: 'วิชาแกน' }])
    await service.createCategory(' วิชาเลือก ')
    expect(calls).toEqual([{ name: 'list_categories', args: undefined }, { name: 'create_category', args: { p_name: 'วิชาเลือก' } }])
  })

  it('uses the protected course update and archive RPCs', async () => {
    const calls: Array<{ name: string; args?: Record<string, unknown> }> = []
    const service = new AdminService({ rpc: async (name, args) => { calls.push({ name, args }); return { data: null, error: null } } })
    await service.updateCourse('course-1', { code: ' jc 202 ', nameTh: 'ข่าวเชิงลึก', categoryId: 'category-2' })
    await service.archiveCourse('course-1')
    expect(calls).toEqual([
      { name: 'update_course', args: { p_course_id: 'course-1', p_code: 'JC202', p_name_th: 'ข่าวเชิงลึก', p_category_id: 'category-2' } },
      { name: 'archive_course', args: { p_course_id: 'course-1' } },
    ])
  })

  it('previews and confirms a course merge through administrator RPCs', async () => {
    const calls: string[] = []
    const service = new AdminService({ rpc: async (name) => { calls.push(name); return { data: name === 'preview_course_merge' ? [{ source_code: 'JC1', target_code: 'JC2', offerings_to_move: 2, reviews_preserved: 3 }] : null, error: null } } })
    await expect(service.previewCourseMerge('source', 'target')).resolves.toMatchObject({ source_code: 'JC1', offerings_to_move: 2 })
    await service.mergeCourse('source', 'target')
    expect(calls).toEqual(['preview_course_merge', 'merge_course'])
  })

  it('uses only moderation-state RPCs and requires a reason', async () => {
    const calls: Array<{ name: string; args?: Record<string, unknown> }> = []
    const service = new AdminService({ rpc: async (name, args) => { calls.push({ name, args }); return { data: name === 'list_moderation_reviews' ? [{ id: 'review-1', rating: 1, text: 'x', author_active: true, moderation_state: 'visible', created_at: '2026-01-01' }] : null, error: null } } })
    await expect(service.listModerationReviews('visible')).resolves.toHaveLength(1)
    await expect(service.moderateReview('review-1', 'hidden', '  ')).rejects.toThrow('กรุณาระบุเหตุผล')
    await service.moderateReview('review-1', 'hidden', 'ไม่เกี่ยวข้อง')
    expect(calls).toEqual([
      { name: 'list_moderation_reviews', args: { p_state: 'visible' } },
      { name: 'moderate_review', args: { p_review_id: 'review-1', p_state: 'hidden', p_reason: 'ไม่เกี่ยวข้อง' } },
    ])
  })

  it('submits structured offering rows only through the administrator batch RPC', async () => {
    const calls: Array<{ name: string; args?: Record<string, unknown> }> = []
    const service = new AdminService({ rpc: async (name, args) => { calls.push({ name, args }); return { data: [{ created_count: 1, existing_count: 0 }], error: null } } })
    await expect(service.bulkImportOfferings([{ courseCode: 'JC100', academicYear: 2569, semester: '1', section: '2', dayOfWeek: 2, startsAt: '09:00', endsAt: '11:00' }])).resolves.toEqual({ created_count: 1, existing_count: 0 })
    await expect(service.bulkImportOfferings([])).rejects.toThrow('อย่างน้อยหนึ่ง')
    expect(calls[0]?.name).toBe('bulk_import_offerings')
  })
})
