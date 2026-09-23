export type RpcClient = {
  rpc(name: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>
}

export type VisibleReview = { id: string; rating: number; text: string; createdAt: string; section?: string; semester?: string; academicYear?: number; instructorName?: string | null }
export type ReviewFilters = { rating?: number; semester?: string; academicYear?: number }
export type MyReview = { id: string; offeringId: string; rating: number; text: string; active: boolean; createdAt: string }

export class ReviewService {
  constructor(private readonly client: RpcClient) {}

  async listVisible(offeringId: string, filters: ReviewFilters = {}): Promise<VisibleReview[]> {
    const { data, error } = await this.client.rpc('list_visible_reviews', { p_offering_id: offeringId, p_rating: filters.rating ?? null, p_semester: filters.semester ?? null, p_academic_year: filters.academicYear ?? null })
    if (error) throw new Error(error.message)
    return (data as Array<{ id: string; rating: number; text: string; created_at: string; section?: string; semester?: string; academic_year?: number; instructor_name?: string | null }>).map((review) => ({
      id: review.id, rating: review.rating, text: review.text, createdAt: review.created_at,
      ...(review.section === undefined ? {} : { section: review.section, semester: review.semester, academicYear: review.academic_year, instructorName: review.instructor_name }),
    }))
  }

  async create(offeringId: string, rating: number, text: string): Promise<void> {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('เลือกระดับคะแนน 1 ถึง 5')
    if (!text.trim()) throw new Error('กรุณาเขียนรีวิว')
    const { error } = await this.client.rpc('create_review', { p_offering_id: offeringId, p_rating: rating, p_text: text.trim() })
    if (error) throw new Error(error.message)
  }

  async listMine(): Promise<MyReview[]> {
    const { data, error } = await this.client.rpc('list_my_reviews')
    if (error) throw new Error(error.message)
    return ((data ?? []) as Array<{ id: string; offering_id: string; rating: number; text: string; author_active: boolean; created_at: string }>).map((review) => ({ id: review.id, offeringId: review.offering_id, rating: review.rating, text: review.text, active: review.author_active, createdAt: review.created_at }))
  }

  async updateMine(id: string, rating: number, text: string): Promise<void> {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('เลือกระดับคะแนน 1 ถึง 5')
    if (!text.trim()) throw new Error('กรุณาเขียนรีวิว')
    const { error } = await this.client.rpc('update_my_review', { p_review_id: id, p_rating: rating, p_text: text.trim() })
    if (error) throw new Error(error.message)
  }

  async setMineActive(id: string, active: boolean): Promise<void> {
    const { error } = await this.client.rpc('set_my_review_active', { p_review_id: id, p_active: active })
    if (error) throw new Error(error.message)
  }
}
