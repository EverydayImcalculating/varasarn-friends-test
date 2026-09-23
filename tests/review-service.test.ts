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

  it('passes filters and maps approved-offering context', async () => {
    const calls: Array<{ name: string; args?: Record<string, unknown> }> = []
    const service = new ReviewService({ rpc: async (name, args) => { calls.push({ name, args }); return { data: [{ id: 'review-1', rating: 4, text: 'ชัดเจน', created_at: '2026-01-01', section: '2', semester: '1', academic_year: 2569, instructor_name: 'อาจารย์ ก' }], error: null } } })
    await expect(service.listVisible('offering-1', { rating: 4, semester: '1', academicYear: 2569 })).resolves.toMatchObject([{ section: '2', semester: '1', academicYear: 2569, instructorName: 'อาจารย์ ก' }])
    expect(calls[0]).toEqual({ name: 'list_visible_reviews', args: { p_offering_id: 'offering-1', p_rating: 4, p_semester: '1', p_academic_year: 2569 } })
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
