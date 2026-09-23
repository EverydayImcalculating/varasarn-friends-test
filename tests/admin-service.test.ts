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
})
