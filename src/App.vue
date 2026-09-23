<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { neon, signInWithGoogle } from './neon'
import { AdminService, type Category, type ManagedCourse, type RoleAssignment, type VerifiedAccount } from './services/admin'
import { ReviewService, type VisibleReview } from './services/reviews'
import { TimetableService } from './services/timetable-client'
import { overlaps, type Meeting } from './services/timetable'

type Course = { id: string; code: string; name_th: string; category_name: string }
type Offering = { id: string; section: string; academic_year: number; semester: string; instructor_name: string | null }
type TimetableEntry = { offering_id: string; course_code: string; course_name: string; section: string; day_of_week: number; starts_at: string; ends_at: string }
const courses = ref<Course[]>([]); const offerings = ref<Offering[]>([]); const reviews = ref<VisibleReview[]>([])
const selected = ref<Course | null>(null); const rating = ref(5); const text = ref(''); const error = ref(''); const loading = ref(true); const signedIn = ref(false)
const service = computed(() => neon ? new ReviewService(neon as any) : null)
const adminService = computed(() => neon ? new AdminService(neon as any) : null)
const timetableService = computed(() => neon ? new TimetableService(neon as any) : null)
const accessRole = ref<'owner' | 'administrator' | null>(null); const dashboard = ref(false)
const timetable = ref(false); const timetableEntries = ref<TimetableEntry[]>([])
const members = ref<RoleAssignment[]>([]); const verifiedAccounts = ref<VerifiedAccount[]>([])
const categories = ref<Category[]>([]); const categoryName = ref(''); const courseCode = ref(''); const courseName = ref(''); const courseCategoryId = ref('')
const managedCourses = ref<ManagedCourse[]>([]); const editingCourseId = ref<string | null>(null)
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
async function loadTimetable() { if (!timetableService.value) return; timetableEntries.value = await timetableService.value.list() as TimetableEntry[] }
async function openTimetable() { timetable.value = true; dashboard.value = false; selected.value = null; error.value = ''; try { await loadTimetable() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถโหลดตารางเรียนได้' } }
const dayNames = ['','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์','อาทิตย์']
function timeValue(time: string) { return time.slice(0, 5) }
function courseColor(code: string) { return `timetable-color-${(code.charCodeAt(0) + code.charCodeAt(code.length - 1)) % 6}` }
function timetableStyle(entry: TimetableEntry) { const start = Number(timeValue(entry.starts_at).slice(0,2)) * 60 + Number(timeValue(entry.starts_at).slice(3)); const end = Number(timeValue(entry.ends_at).slice(0,2)) * 60 + Number(timeValue(entry.ends_at).slice(3)); return { left: `${Math.max(0, ((start - 480) / 720) * 100)}%`, width: `${Math.min(100, ((end - start) / 720) * 100)}%` } }
async function addToTimetable(offering: Offering) {
  if (!timetableService.value || !selected.value) return
  try {
    const result = await (neon as any).rpc('list_approved_offering_meetings', { p_offering_id: offering.id })
    if (result.error) throw new Error(result.error.message)
    const meetings = (result.data ?? []) as Array<{ day_of_week: number; starts_at: string; ends_at: string }>
    if (!meetings.length) throw new Error('รายวิชานี้ไม่มีเวลาเรียนที่ใช้งานได้')
    await loadTimetable()
    const currentCourse = timetableEntries.value.filter((entry) => entry.course_code === selected.value!.code)
    const conflicts = timetableEntries.value.filter((entry) => meetings.some((meeting) => overlaps({ day: meeting.day_of_week, start: timeValue(meeting.starts_at), end: timeValue(meeting.ends_at) }, { day: entry.day_of_week, start: timeValue(entry.starts_at), end: timeValue(entry.ends_at) })))
    const messages = [currentCourse.length ? `มี ${selected.value.code} อยู่แล้ว ระบบจะเปลี่ยนเป็นกลุ่ม ${offering.section}` : '', conflicts.length ? `เวลาเรียนชนกับ ${[...new Set(conflicts.map((entry) => entry.course_code))].join(', ')}` : ''].filter(Boolean)
    if (messages.length && !window.confirm(`${messages.join('\n')}\nต้องการดำเนินการต่อหรือไม่?`)) return
    if (currentCourse.length) await timetableService.value.replace(offering.id); else await timetableService.value.add(offering.id)
    await loadTimetable(); timetable.value = true; selected.value = null
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถเพิ่มลงตารางเรียนได้' }
}
async function removeFromTimetable(offeringId: string) { if (!timetableService.value) return; try { await timetableService.value.remove(offeringId); await loadTimetable() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถลบรายวิชาได้' } }
async function clearTimetable() { if (!timetableService.value || !window.confirm('ต้องการล้างตารางเรียนทั้งหมดใช่หรือไม่?')) return; try { await timetableService.value.clear(); await loadTimetable() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถล้างตารางเรียนได้' } }
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
      managedCourses.value = await adminService.value.listManageableCourses()
      if (!courseCategoryId.value && categories.value[0]) courseCategoryId.value = categories.value[0].id
      if (accessRole.value === 'owner') {
        ;[members.value, verifiedAccounts.value] = await Promise.all([adminService.value.listRoleAssignments(), adminService.value.listVerifiedAccounts()])
      }
    } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถโหลดข้อมูลผู้ดูแลได้' }
  }
}
async function addCategory() { if (!adminService.value || !categoryName.value.trim()) return; try { await adminService.value.createCategory(categoryName.value); categoryName.value = ''; await openDashboard() } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถเพิ่มหมวดหมู่ได้' } }
async function renameCategory(category: Category) { const name = window.prompt('ชื่อหมวดหมู่', category.name); if (!adminService.value || !name?.trim()) return; try { await adminService.value.updateCategory(category.id, name); await Promise.all([openDashboard(), loadCatalog()]) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถแก้ไขหมวดหมู่ได้' } }
async function addCourse() { if (!adminService.value) return; try { const draft = { code: courseCode.value, nameTh: courseName.value, categoryId: courseCategoryId.value }; if (editingCourseId.value) await adminService.value.updateCourse(editingCourseId.value, draft); else await adminService.value.createCourse(draft); courseCode.value = ''; courseName.value = ''; editingCourseId.value = null; await Promise.all([openDashboard(), loadCatalog()]) } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ไม่สามารถบันทึกรายวิชาได้' } }
function editCourse(course: ManagedCourse) { editingCourseId.value = course.id; courseCode.value = course.code; courseName.value = course.name_th; courseCategoryId.value = course.category_id }
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
  timetable.value = false
  members.value = []
  verifiedAccounts.value = []
  error.value = ''
}
onMounted(async () => { if (!neon) { loading.value = false; return }; const session = await (neon.auth as any).getSession(); signedIn.value = Boolean(session?.data?.user); if (signedIn.value) { await Promise.all([loadCatalog(), loadAccess(), adminService.value?.listCategories().then((items) => { categories.value = items })]) } else loading.value = false })
</script>

<template>
  <main>
    <nav class="navbar navbar-custom"><div class="container"><button class="navbar-brand border-0 bg-transparent" @click="timetable = false; dashboard = false; selected = null">Varasarn Close Friends</button><div v-if="signedIn" class="d-flex gap-2"><button class="btn btn-light rounded-pill text-purple" @click="openTimetable">ตารางเรียน</button><button v-if="accessRole" class="btn btn-outline-light rounded-pill" @click="openDashboard">แดชบอร์ด</button><button class="btn btn-light rounded-pill" @click="signOut">ออกจากระบบ</button></div></div></nav>
    <section v-if="!signedIn" class="sign-in container"><div class="auth-card text-center"><h1>รีวิววิชาเรียนที่ไว้ใจได้</h1><p>เข้าสู่ระบบด้วย Google เพื่อดูรายวิชาและเขียนรีวิวแบบไม่แสดงตัวตน</p><button class="btn btn-purple px-4" @click="enter">เข้าสู่ระบบด้วย Google</button><p v-if="error" class="text-danger mt-3" role="alert">{{ error }}</p></div></section>
    <section v-else class="container py-4">
      <section v-if="dashboard" class="review-box">
        <button class="btn btn-link text-purple p-0 mb-3" @click="dashboard = false">← กลับหน้ารายวิชา</button>
        <h1>แดชบอร์ดผู้ดูแล</h1><p v-if="error" class="text-danger" role="alert">{{ error }}</p>
        <h2 class="h4 mt-4">เพิ่มหมวดหมู่</h2><div class="input-group mb-3"><input v-model="categoryName" class="form-control" aria-label="ชื่อหมวดหมู่"><button class="btn btn-purple" @click="addCategory">เพิ่ม</button></div><div class="category-menu"><button v-for="category in categories" :key="category.id" class="btn category-btn btn-outline-purple" @click="renameCategory(category)">{{ category.name }} · แก้ไข</button></div>
        <h2 class="h4">{{ editingCourseId ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชา' }}</h2><div class="row g-2"><div class="col-md-3"><input v-model="courseCode" class="form-control" placeholder="รหัสวิชา"></div><div class="col-md-4"><input v-model="courseName" class="form-control" placeholder="ชื่อรายวิชา"></div><div class="col-md-3"><select v-model="courseCategoryId" class="form-select"><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></div><div class="col-md-2"><button class="btn btn-purple w-100" @click="addCourse">{{ editingCourseId ? 'บันทึก' : 'เพิ่มรายวิชา' }}</button></div></div>
        <h2 class="h4 mt-4">รายวิชา</h2><ul class="list-group"><li v-for="course in managedCourses" :key="course.id" class="list-group-item d-flex justify-content-between align-items-center"><span><strong>{{ course.code }}</strong> · {{ course.name_th }} <small class="text-muted">{{ course.category_name }} · {{ course.status }}</small></span><span class="d-flex gap-2"><button class="btn btn-sm btn-outline-purple" @click="editCourse(course)">แก้ไข</button><button v-if="course.status === 'approved'" class="btn btn-sm btn-outline-danger" @click="archiveCourse(course.id)">เก็บเข้าคลัง</button></span></li></ul>
      </section>
      <section v-else-if="timetable">
        <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3"><div><h1 class="h3 text-purple">ตารางเรียนส่วนตัว</h1><p class="text-muted mb-0">ตารางนี้ผูกกับบัญชีของคุณ</p></div><div class="d-flex gap-2"><button class="btn btn-outline-danger" @click="clearTimetable">ล้างตาราง</button><button class="btn btn-purple" @click="timetable = false">หน้าหลัก</button></div></div>
        <p v-if="error" class="text-danger" role="alert">{{ error }}</p>
        <div v-if="!timetableEntries.length" class="review-box text-center py-5"><h2 class="h4 text-purple">ตารางเรียนยังว่างเปล่า</h2><p class="text-muted">กลับไปที่หน้าหลัก แล้วเพิ่มกลุ่มเรียนที่ต้องการ</p><button class="btn btn-purple" @click="timetable = false">ไปเลือกวิชาเรียน</button></div>
        <template v-else><div class="timetable-container"><div class="timetable-grid"><div class="time-header-row"><div v-for="hour in 12" :key="hour" class="time-header-slot">{{ String(hour + 7).padStart(2, '0') }}:00</div></div><div v-for="day in [1,2,3,4,5,6,7]" :key="day" class="day-row"><div class="day-label">{{ dayNames[day] }}</div><div class="day-track"><div v-for="entry in timetableEntries.filter((item) => item.day_of_week === day)" :key="`${entry.offering_id}-${day}`" class="timetable-course" :class="courseColor(entry.course_code)" :style="timetableStyle(entry)"><strong>{{ entry.course_code }} ({{ entry.section }})</strong><span>{{ timeValue(entry.starts_at) }}–{{ timeValue(entry.ends_at) }}</span></div></div></div></div></div><div class="review-box"><h2 class="h5">รายวิชาที่เลือก</h2><div v-for="entry in timetableEntries.filter((item, index, items) => items.findIndex((other) => other.offering_id === item.offering_id) === index)" :key="entry.offering_id" class="d-flex justify-content-between align-items-center border-bottom py-2"><span><strong>{{ entry.course_code }}</strong> {{ entry.course_name }} · กลุ่ม {{ entry.section }}</span><button class="btn btn-sm btn-outline-danger" @click="removeFromTimetable(entry.offering_id)">ลบออก</button></div></div></template>
      </section>
      <template v-else>
        <div class="about mb-4"><h2>เกี่ยวกับ Varasarn Close Friends</h2><p>พื้นที่รวบรวมความคิดเห็นจากนักศึกษาคณะวารสารศาสตร์และสื่อสารมวลชน</p></div>
        <p v-if="loading">กำลังโหลดข้อมูล...</p><p v-else-if="error" class="text-danger" role="alert">{{ error }}</p>
        <template v-else-if="!selected"><div class="search-wrap mb-3"><input v-model="searchTerm" class="form-control" placeholder="ค้นหารหัสหรือชื่อรายวิชา"><span class="search-icon">⌕</span></div><div class="category-menu"><button class="btn category-btn" :class="categoryFilter ? 'btn-outline-purple' : 'btn-purple'" @click="categoryFilter = ''">ทั้งหมด</button><button v-for="category in categories" :key="category.id" class="btn category-btn" :class="categoryFilter === category.name ? 'btn-purple' : 'btn-outline-purple'" @click="categoryFilter = category.name">{{ category.name }}</button></div><div class="row g-3"><article v-for="course in filteredCourses" :key="course.id" class="col-md-6 col-lg-4"><button class="course-card text-start w-100 p-4" @click="openCourse(course)"><span class="badge">{{ course.category_name }}</span><h3>{{ course.code }}</h3><p>{{ course.name_th }}</p></button></article></div><p v-if="!filteredCourses.length" class="text-muted">ไม่พบรายวิชาที่ตรงกับการค้นหา</p></template>
        <section v-else><button class="btn btn-link text-purple p-0 mb-3" @click="selected = null">← รายวิชาทั้งหมด</button><h1>{{ selected.code }} {{ selected.name_th }}</h1><div v-for="offering in offerings" :key="offering.id" class="review-box d-flex justify-content-between align-items-center"><span>กลุ่ม {{ offering.section }} · {{ offering.semester }}/{{ offering.academic_year }} · {{ offering.instructor_name }}</span><button class="btn btn-outline-purple" @click="addToTimetable(offering)">เพิ่มลงตาราง</button></div><div class="review-box"><h2>เขียนรีวิว</h2><label for="rating">คะแนนรวม</label><select id="rating" v-model="rating" class="form-select mb-3"><option v-for="n in 5" :key="n" :value="n">{{ n }} ดาว</option></select><label for="review">ความคิดเห็น</label><textarea id="review" v-model="text" class="form-control" rows="4" /><button class="btn btn-purple mt-3" @click="publish">เผยแพร่รีวิว</button></div><h2>รีวิวจากเพื่อน</h2><p v-if="!reviews.length">ยังไม่มีรีวิว</p><article v-for="review in reviews" :key="review.id" class="review-box"><div class="stars">{{ '★'.repeat(review.rating) }}</div><p>{{ review.text }}</p><small>{{ review.createdAt }}</small></article></section>
      </template>
    </section>
  </main>
</template>
