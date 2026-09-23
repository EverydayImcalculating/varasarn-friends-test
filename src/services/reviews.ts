export type RpcClient = {
  rpc(name: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>
}

export type VisibleReview = { id: string; rating: number; text: string; createdAt: string }

export class ReviewService {
  constructor(private readonly client: RpcClient) {}

  async listVisible(offeringId: string): Promise<VisibleReview[]> {
    const { data, error } = await this.client.rpc('list_visible_reviews', { p_offering_id: offeringId })
    if (error) throw new Error(error.message)
    return (data as Array<{ id: string; rating: number; text: string; created_at: string }>).map((review) => ({
      id: review.id, rating: review.rating, text: review.text, createdAt: review.created_at,
    }))
  }

  async create(offeringId: string, rating: number, text: string): Promise<void> {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('เลือกระดับคะแนน 1 ถึง 5')
    if (!text.trim()) throw new Error('กรุณาเขียนรีวิว')
    const { error } = await this.client.rpc('create_review', { p_offering_id: offeringId, p_rating: rating, p_text: text.trim() })
    if (error) throw new Error(error.message)
  }
}
