import { createInternalNeonAuth } from '@neondatabase/auth'
import { NeonPostgrestClient, fetchWithToken } from '@neondatabase/postgrest-js'

const authUrl = import.meta.env.VITE_NEON_AUTH_URL
const dataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL

const auth = authUrl ? createInternalNeonAuth(authUrl) : null
const dataApi = auth && dataApiUrl
  ? new NeonPostgrestClient({
      dataApiUrl,
      options: { global: { fetch: fetchWithToken(auth.getJWTToken) } },
    })
  : null

export const neon = auth && dataApi ? { auth: auth.adapter, rpc: dataApi.rpc.bind(dataApi) } : null

// The Data API paginates RETURNS TABLE results (defaults to the first 100 rows) unless the
// caller explicitly requests a wider range. Listing RPCs whose result can plausibly exceed
// that -- the course catalog is already past 200 rows -- need this, or rows past the cutoff
// silently never reach the browser. `.range()` only exists on the real postgrest-js builder,
// not on the plain-Promise mocks used in tests, so this no-ops there instead of throwing.
export function withRange<T>(query: T, to: number): T {
  return typeof (query as { range?: unknown })?.range === 'function' ? (query as unknown as { range(from: number, to: number): T }).range(0, to) : query
}

export async function signInWithGoogle() {
  if (!neon) throw new Error('ยังไม่ได้ตั้งค่า Neon Auth และ Data API')
  await (neon.auth as any).signIn.social({ provider: 'google', callbackURL: window.location.origin })
}
