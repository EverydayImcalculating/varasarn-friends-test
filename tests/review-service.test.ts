import { describe, expect, it } from 'vitest'
import { ReviewService } from '../src/services/reviews'

describe('ReviewService', () => {
  it('uses only the anonymous review RPC for a signed-in reader', async () => {
    const calls: string[] = []
    const service = new ReviewService({
      rpc: async (name) => {
        calls.push(name)
        return { data: [{ id: 'review-1', rating: 5, text: 'มีประโยชน์มาก', created_at: '2026-01-01' }], error: null }
      },
    })

    await expect(service.listVisible('offering-1')).resolves.toEqual([
      { id: 'review-1', rating: 5, text: 'มีประโยชน์มาก', createdAt: '2026-01-01' },
    ])
    expect(calls).toEqual(['list_visible_reviews'])
  })

  it('rejects a blank review before reaching the data interface', async () => {
    const rpc = async () => ({ data: null, error: null })
    const service = new ReviewService({ rpc })

    await expect(service.create('offering-1', 4, '   ')).rejects.toThrow('กรุณาเขียนรีวิว')
  })

  it('rejects ratings outside the 1 to 5 range before reaching the data interface', async () => {
    const service = new ReviewService({ rpc: async () => ({ data: null, error: null }) })

    await expect(service.create('offering-1', 6, 'เนื้อหาดี')).rejects.toThrow('เลือกระดับคะแนน 1 ถึง 5')
  })
})
