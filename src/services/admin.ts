import type { RpcClient } from './reviews'

export type VerifiedAccount = { id: string; name: string; email: string }
export type RoleAssignment = VerifiedAccount & { role: 'owner' | 'administrator'; grantedAt: string }
export type CourseDraft = { code: string; nameTh: string; categoryId: string }

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

  private async changeRole(name: string, userId: string): Promise<void> {
    const { error } = await this.client.rpc(name, { p_user_id: userId })
    if (error) throw new Error(error.message)
  }
}
