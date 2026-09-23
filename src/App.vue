<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { neon, signInWithGoogle } from './neon'
import { AdminService, type Category, type RoleAssignment, type VerifiedAccount } from './services/admin'
import { ReviewService, type VisibleReview } from './services/reviews'

type Course = { id: string; code: string; name_th: string; category_name: string }
type Offering = { id: string; section: string; academic_year: number; semester: string; instructor_name: string | null }
const courses = ref<Course[]>([]); const offerings = ref<Offering[]>([]); const reviews = ref<VisibleReview[]>([])
const selected = ref<Course | null>(null); const rating = ref(5); const text = ref(''); const error = ref(''); const loading = ref(true); const signedIn = ref(false)
const service = computed(() => neon ? new ReviewService(neon as any) : null)
const adminService = computed(() => neon ? new AdminService(neon as any) : null)
const accessRole = ref<'owner' | 'administrator' | null>(null); const dashboard = ref(false)
const members = ref<RoleAssignment[]>([]); const verifiedAccounts = ref<VerifiedAccount[]>([])
const categories = ref<Category[]>([]); const categoryName = ref(''); const courseCode = ref(''); const courseName = ref(''); const courseCategoryId = ref('')
const searchTerm = ref(''); const categoryFilter = ref('')
const filteredCourses = computed(() => courses.value.filter((course) => {
  const search = searchTerm.value.trim().toLowerCase()
  return (!search || `${course.code} ${course.name_th}`.toLowerCase().includes(search)) && (!categoryFilter.value || course.category_name === categoryFilter.value)
}))
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
  if (adminService.value) {
    try {
      categories.value = await adminService.value.listCategories()
      if (!courseCategoryId.value && categories.value[0]) courseCategoryId.value = categories.value[0].id
      if (accessRole.value === 'owner') {
        ;[members.value, verifiedAccounts.value] = await Promise.all([adminService.value.listRoleAssignments(), adminService.value.listVerifiedAccounts()])
      }
    } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถโหลดข้อมูลผู้ดูแลได้' }
  }
}
async function addCategory() { if (!adminService.value || !categoryName.value.trim()) return; try { await adminService.value.createCategory(categoryName.value); categoryName.value = ''; await openDashboard() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถเพิ่มหมวดหมู่ได้' } }
async function addCourse() { if (!adminService.value) return; try { await adminService.value.createCourse({ code: courseCode.value, nameTh: courseName.value, categoryId: courseCategoryId.value }); courseCode.value = ''; courseName.value = ''; await Promise.all([openDashboard(), loadCatalog()]) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถเพิ่มรายวิชาได้' } }
async function archiveCourse(courseId: string) { if (!adminService.value) return; try { await adminService.value.archiveCourse(courseId); await Promise.all([openDashboard(), loadCatalog()]) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถปิดใช้งานรายวิชาได้' } }
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
onMounted(async () => { if (!neon) { loading.value = false; return }; const session = await (neon.auth as any).getSession(); signedIn.value = Boolean(session?.data?.user); if (signedIn.value) { await Promise.all([loadCatalog(), loadAccess(), adminService.value?.listCategories().then((items) => { categories.value = items })]) } else loading.value = false })
</script>

<template>
  <main>
    <nav class="navbar navbar-custom"><div class="container"><span class="navbar-brand">Varasarn Close Friends</span><div v-if="signedIn" class="d-flex gap-2"><button v-if="accessRole" class="btn btn-outline-light rounded-pill" @click="openDashboard">แดชบอร์ด</button><button class="btn btn-light rounded-pill" @click="signOut">ออกจากระบบ</button></div></div></nav>
    <section v-if="!signedIn" class="sign-in container"><div class="auth-card text-center"><h1>รีวิววิชาเรียนที่ไว้ใจได้</h1><p>เข้าสู่ระบบด้วย Google เพื่อดูรายวิชาและเขียนรีวิวแบบไม่แสดงตัวตน</p><button class="btn btn-purple px-4" @click="enter">เข้าสู่ระบบด้วย Google</button><p v-if="error" class="text-danger mt-3" role="alert">{{ error }}</p></div></section>
    <section v-else class="container py-4">
      <section v-if="dashboard" class="review-box">
        <button class="btn btn-link text-purple p-0 mb-3" @click="dashboard = false">← กลับหน้ารายวิชา</button>
        <h1>แดชบอร์ดผู้ดูแล</h1><p v-if="error" class="text-danger" role="alert">{{ error }}</p>
        <h2 class="h4 mt-4">เพิ่มหมวดหมู่</h2><div class="input-group mb-3"><input v-model="categoryName" class="form-control" aria-label="ชื่อหมวดหมู่"><button class="btn btn-purple" @click="addCategory">เพิ่ม</button></div>
        <h2 class="h4">เพิ่มรายวิชา</h2><div class="row g-2"><div class="col-md-3"><input v-model="courseCode" class="form-control" placeholder="รหัสวิชา"></div><div class="col-md-4"><input v-model="courseName" class="form-control" placeholder="ชื่อรายวิชา"></div><div class="col-md-3"><select v-model="courseCategoryId" class="form-select"><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></div><div class="col-md-2"><button class="btn btn-purple w-100" @click="addCourse">เพิ่มรายวิชา</button></div></div>
      </section>
      <template v-else>
        <div class="about mb-4"><h2>เกี่ยวกับ Varasarn Close Friends</h2><p>พื้นที่รวบรวมความคิดเห็นจากนักศึกษาคณะวารสารศาสตร์และสื่อสารมวลชน</p></div>
        <p v-if="loading">กำลังโหลดข้อมูล...</p><p v-else-if="error" class="text-danger" role="alert">{{ error }}</p>
        <template v-else-if="!selected"><div class="search-wrap mb-3"><input v-model="searchTerm" class="form-control" placeholder="ค้นหารหัสหรือชื่อรายวิชา"><span class="search-icon">⌕</span></div><div class="category-menu"><button class="btn category-btn" :class="categoryFilter ? 'btn-outline-purple' : 'btn-purple'" @click="categoryFilter = ''">ทั้งหมด</button><button v-for="category in categories" :key="category.id" class="btn category-btn" :class="categoryFilter === category.name ? 'btn-purple' : 'btn-outline-purple'" @click="categoryFilter = category.name">{{ category.name }}</button></div><div class="row g-3"><article v-for="course in filteredCourses" :key="course.id" class="col-md-6 col-lg-4"><button class="course-card text-start w-100 p-4" @click="openCourse(course)"><span class="badge">{{ course.category_name }}</span><h3>{{ course.code }}</h3><p>{{ course.name_th }}</p></button></article></div><p v-if="!filteredCourses.length" class="text-muted">ไม่พบรายวิชาที่ตรงกับการค้นหา</p></template>
        <section v-else><button class="btn btn-link text-purple p-0 mb-3" @click="selected = null">← รายวิชาทั้งหมด</button><h1>{{ selected.code }} {{ selected.name_th }}</h1><p v-if="offerings[0]">กลุ่ม {{ offerings[0].section }} · {{ offerings[0].semester }}/{{ offerings[0].academic_year }} · {{ offerings[0].instructor_name }}</p><div class="review-box"><h2>เขียนรีวิว</h2><label for="rating">คะแนนรวม</label><select id="rating" v-model="rating" class="form-select mb-3"><option v-for="n in 5" :key="n" :value="n">{{ n }} ดาว</option></select><label for="review">ความคิดเห็น</label><textarea id="review" v-model="text" class="form-control" rows="4" /><button class="btn btn-purple mt-3" @click="publish">เผยแพร่รีวิว</button></div><h2>รีวิวจากเพื่อน</h2><p v-if="!reviews.length">ยังไม่มีรีวิว</p><article v-for="review in reviews" :key="review.id" class="review-box"><div class="stars">{{ '★'.repeat(review.rating) }}</div><p>{{ review.text }}</p><small>{{ review.createdAt }}</small></article></section>
      </template>
    </section>
  </main>
</template>
