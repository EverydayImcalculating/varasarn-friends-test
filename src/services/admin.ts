import type { RpcClient } from './reviews'

export type VerifiedAccount = { id: string; name: string; email: string }
export type RoleAssignment = VerifiedAccount & { role: 'owner' | 'administrator'; grantedAt: string }
export type CourseDraft = { code: string; nameTh: string; categoryId: string }
export type Category = { id: string; name: string }
export type ManagedCourse = { id: string; code: string; name_th: string; category_id: string; category_name: string; status: string }

export class AdminService {
  constructor(private readonly client: RpcClient) {}

  async listVerifiedAccounts(): Promise<VerifiedAccount[]> {
    const { data, error } = await this.client.rpc('list_verified_accounts')
    if (error) throw new Error(error.message)
    return (data ?? []) as VerifiedAccount[]
  }

  async listRoleAssignments(): Promise<RoleAssignment[]> {
    const { data, error } = await this.client.rpc('list_role_assignments')
    if (error) throw new Error(error.message)
    return ((data ?? []) as Array<{ user_id: string; name: string; email: string; role: 'owner' | 'administrator'; granted_at: string }>).map((member) => ({
      id: member.user_id,
      name: member.name,
      email: member.email,
      role: member.role,
      grantedAt: member.granted_at,
    }))
  }

  async grantAdministrator(userId: string): Promise<void> {
    await this.changeRole('grant_administrator', userId)
  }

  async revokeAdministrator(userId: string): Promise<void> {
    await this.changeRole('revoke_administrator', userId)
  }

  async createCourse(course: CourseDraft): Promise<void> {
    const { error } = await this.client.rpc('create_course', {
      p_code: course.code.toUpperCase().replace(/\s+/g, ''),
      p_name_th: course.nameTh.trim(),
      p_category_id: course.categoryId,
    })
    if (error) throw new Error(error.message)
  }

  async listCategories(): Promise<Category[]> {
    const { data, error } = await this.client.rpc('list_categories')
    if (error) throw new Error(error.message)
    return (data ?? []) as Category[]
  }

  async createCategory(name: string): Promise<void> {
    const { error } = await this.client.rpc('create_category', { p_name: name.trim() })
    if (error) throw new Error(error.message)
  }

  async archiveCourse(courseId: string): Promise<void> {
    const { error } = await this.client.rpc('archive_course', { p_course_id: courseId })
    if (error) throw new Error(error.message)
  }

  async listManageableCourses(): Promise<ManagedCourse[]> {
    const { data, error } = await this.client.rpc('list_manageable_courses')
    if (error) throw new Error(error.message)
    return (data ?? []) as ManagedCourse[]
  }

  async updateCourse(courseId: string, course: CourseDraft): Promise<void> {
    const { error } = await this.client.rpc('update_course', {
      p_course_id: courseId,
      p_code: course.code.toUpperCase().replace(/\s+/g, ''),
      p_name_th: course.nameTh.trim(),
      p_category_id: course.categoryId,
    })
    if (error) throw new Error(error.message)
  }

  private async changeRole(name: string, userId: string): Promise<void> {
    const { error } = await this.client.rpc(name, { p_user_id: userId })
    if (error) throw new Error(error.message)
  }
}
