import type { RpcClient } from './reviews'

export class TimetableService {
  constructor(private readonly client: RpcClient) {}
  async list() { const { data, error } = await this.client.rpc('list_my_timetable'); if (error) throw new Error(error.message); return data ?? [] }
  async add(offeringId: string) { const { error } = await this.client.rpc('add_my_timetable_offering', { p_offering_id: offeringId }); if (error) throw new Error(error.message) }
  async remove(offeringId: string) { const { error } = await this.client.rpc('remove_my_timetable_offering', { p_offering_id: offeringId }); if (error) throw new Error(error.message) }
  async clear() { const { error } = await this.client.rpc('clear_my_timetable'); if (error) throw new Error(error.message) }
  async replace(offeringId: string) { const { error } = await this.client.rpc('replace_my_timetable_offering', { p_offering_id: offeringId }); if (error) throw new Error(error.message) }
}
