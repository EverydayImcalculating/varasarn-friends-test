<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { neon, signInWithGoogle } from './neon'
import { AdminService, type RoleAssignment, type VerifiedAccount } from './services/admin'
import { ReviewService, type VisibleReview } from './services/reviews'

type Course = { id: string; code: string; name_th: string; category_name: string }
type Offering = { id: string; section: string; academic_year: number; semester: string; instructor_name: string | null }
const courses = ref<Course[]>([]); const offerings = ref<Offering[]>([]); const reviews = ref<VisibleReview[]>([])
const selected = ref<Course | null>(null); const rating = ref(5); const text = ref(''); const error = ref(''); const loading = ref(true); const signedIn = ref(false)
const service = computed(() => neon ? new ReviewService(neon as any) : null)
const adminService = computed(() => neon ? new AdminService(neon as any) : null)
const accessRole = ref<'owner' | 'administrator' | null>(null); const dashboard = ref(false)
const members = ref<RoleAssignment[]>([]); const verifiedAccounts = ref<VerifiedAccount[]>([])
async function loadCatalog() {
  if (!neon) { loading.value = false; error.value = 'ตั้งค่า Neon endpoint ใน .env.local ก่อนใช้งาน'; return }
  const { data, error: apiError } = await (neon as any).rpc('list_approved_catalog')
  if (apiError) error.value = apiError.message; else courses.value = data ?? []
  loading.value = false
}
async function openCourse(course: Course) {
  selected.value = course; error.value = ''
  const { data, error: apiError } = await (neon as any).rpc('list_approved_offerings', { p_course_id: course.id })
  if (apiError) { error.value = apiError.message; return }; offerings.value = data ?? []
  if (offerings.value[0]) reviews.value = await service.value!.listVisible(offerings.value[0].id)
}
async function publish() {
  if (!offerings.value[0] || !service.value) return
  error.value = ''
  try { await service.value.create(offerings.value[0].id, rating.value, text.value); text.value = ''; reviews.value = await service.value.listVisible(offerings.value[0].id) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถเผยแพร่รีวิวได้' }
}
async function enter() { try { await signInWithGoogle() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถเริ่มการเข้าสู่ระบบได้' } }
async function loadAccess() {
  const { data, error: apiError } = await (neon as any).rpc('current_access')
  if (apiError) throw new Error(apiError.message)
  accessRole.value = data?.[0]?.role ?? null
}
async function openDashboard() {
  if (!accessRole.value) return
  dashboard.value = true; error.value = ''
  if (accessRole.value === 'owner' && adminService.value) {
    try {
      ;[members.value, verifiedAccounts.value] = await Promise.all([adminService.value.listRoleAssignments(), adminService.value.listVerifiedAccounts()])
    } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถโหลดข้อมูลผู้ดูแลได้' }
  }
}
async function grantAdministrator(userId: string) {
  if (!adminService.value) return
  try { await adminService.value.grantAdministrator(userId); await openDashboard() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถกำหนดสิทธิ์ผู้ดูแลได้' }
}
async function revokeAdministrator(userId: string) {
  if (!adminService.value) return
  try { await adminService.value.revokeAdministrator(userId); await openDashboard() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถถอนสิทธิ์ผู้ดูแลได้' }
}
async function signOut() {
  await neon?.auth.signOut()
  signedIn.value = false
  courses.value = []
  offerings.value = []
  reviews.value = []
  selected.value = null
  accessRole.value = null
  dashboard.value = false
  members.value = []
  verifiedAccounts.value = []
  error.value = ''
}
onMounted(async () => { if (!neon) { loading.value = false; return }; const session = await (neon.auth as any).getSession(); signedIn.value = Boolean(session?.data?.user); if (signedIn.value) { await Promise.all([loadCatalog(), loadAccess()]) } else loading.value = false })
</script>

<template>
  <main>
    <nav class="navbar navbar-custom"><div class="container"><span class="navbar-brand">Varasarn Close Friends</span><div v-if="signedIn" class="d-flex gap-2"><button v-if="accessRole" class="btn btn-outline-light rounded-pill" @click="openDashboard">แดชบอร์ด</button><button class="btn btn-light rounded-pill" @click="signOut">ออกจากระบบ</button></div></div></nav>
    <section v-if="!signedIn" class="sign-in container"><div class="auth-card text-center"><h1>รีวิววิชาเรียนที่ไว้ใจได้</h1><p>เข้าสู่ระบบด้วย Google เพื่อดูรายวิชาและเขียนรีวิวแบบไม่แสดงตัวตน</p><button class="btn btn-purple px-4" @click="enter">เข้าสู่ระบบด้วย Google</button><p v-if="error" class="text-danger mt-3" role="alert">{{ error }}</p></div></section>
    <section v-else class="container py-4"><section v-if="dashboard" class="review-box"><button class="btn btn-link text-purple p-0 mb-3" @click="dashboard = false">← กลับหน้ารายวิชา</button><h1>แดชบอร์ดผู้ดูแล</h1><p v-if="accessRole === 'administrator'">คุณเป็นผู้ดูแลระบบ สามารถเข้าถึงเครื่องมือดูแลเนื้อหาได้เมื่อพร้อมใช้งาน ผู้ดูแลไม่สามารถเปลี่ยนสิทธิ์สมาชิกได้</p><template v-else><p>ผู้ดูแลโครงการเท่านั้นที่กำหนดหรือถอนสิทธิ์ผู้ดูแลได้</p><p v-if="error" class="text-danger" role="alert">{{ error }}</p><h2 class="h4 mt-4">สมาชิกที่มีสิทธิ์</h2><ul class="list-group mb-4"><li v-for="member in members" :key="member.id" class="list-group-item d-flex justify-content-between align-items-center"><span>{{ member.name }} · {{ member.email }} <strong>({{ member.role }})</strong></span><button v-if="member.role === 'administrator'" class="btn btn-sm btn-outline-danger" @click="revokeAdministrator(member.id)">ถอนสิทธิ์</button></li></ul><h2 class="h4">บัญชี Google ที่ยืนยันแล้ว</h2><ul class="list-group"><li v-for="account in verifiedAccounts" :key="account.id" class="list-group-item d-flex justify-content-between align-items-center"><span>{{ account.name }} · {{ account.email }}</span><button v-if="!members.some((member) => member.id === account.id)" class="btn btn-sm btn-purple" @click="grantAdministrator(account.id)">กำหนดเป็นผู้ดูแล</button></li></ul></template></section><template v-else><div class="about mb-4"><h2>เกี่ยวกับ Varasarn Close Friends</h2><p>พื้นที่รวบรวมความคิดเห็นจากนักศึกษาคณะวารสารศาสตร์และสื่อสารมวลชน</p></div><p v-if="loading">กำลังโหลดข้อมูล...</p><p v-else-if="error" class="text-danger" role="alert">{{ error }}</p><div v-else-if="!selected" class="row g-3"><article v-for="course in courses" :key="course.id" class="col-md-6 col-lg-4"><button class="course-card text-start w-100 p-4" @click="openCourse(course)"><span class="badge">{{ course.category_name }}</span><h3>{{ course.code }}</h3><p>{{ course.name_th }}</p></button></article></div><section v-else><button class="btn btn-link text-purple p-0 mb-3" @click="selected = null">← รายวิชาทั้งหมด</button><h1>{{ selected.code }} {{ selected.name_th }}</h1><p v-if="offerings[0]">กลุ่ม {{ offerings[0].section }} · {{ offerings[0].semester }}/{{ offerings[0].academic_year }} · {{ offerings[0].instructor_name }}</p><div class="review-box"><h2>เขียนรีวิว</h2><label for="rating">คะแนนรวม</label><select id="rating" v-model="rating" class="form-select mb-3"><option v-for="n in 5" :key="n" :value="n">{{ n }} ดาว</option></select><label for="review">ความคิดเห็น</label><textarea id="review" v-model="text" class="form-control" rows="4" /><button class="btn btn-purple mt-3" @click="publish">เผยแพร่รีวิว</button><p v-if="error" class="text-danger mt-2" role="alert">{{ error }}</p></div><h2>รีวิวจากเพื่อน</h2><p v-if="!reviews.length">ยังไม่มีรีวิว</p><article v-for="review in reviews" :key="review.id" class="review-box"><div class="stars">{{ '★'.repeat(review.rating) }}</div><p>{{ review.text }}</p><small>{{ review.createdAt }}</small></article></section></template></section>
  </main>
</template>
