// Dev-only fake session + RPC fixtures for `npm run dev:mock`.
// Aliased in place of `src/neon.ts` by vite.mock.config.ts so agent/browser sessions
// can exercise every signed-in screen without a real Google sign-in. Never used by
// `npm run build` (that command uses the default vite.config.ts).

type RpcResult<T> = { data: T; error: { message: string } | null }

const sessionUser = { id: 'user-mock-1', name: 'แอดมิน ม็อค', email: 'admin@example.com' }

// Seed a legacy timetable in localStorage (matches the shape read by
// src/services/legacy-timetable-import.ts) so the "legacy import" panel on the
// timetable page has something to show.
try {
  const key = `my_tu_schedule_${sessionUser.email}`
  if (!window.localStorage.getItem(key)) {
    window.localStorage.setItem(
      key,
      JSON.stringify([
        { code: 'JC232', name: 'เทคนิคการถ่ายทำ', sec: '320001', teacher: 'อ. อ้อม', day: 'พฤหัสบดี', start: '09:30', end: '12:30' },
        { code: 'JC999', name: 'วิชาที่ไม่มีในระบบ', sec: '1', teacher: 'อ. ไม่ทราบชื่อ', day: 'จันทร์', start: '13:00', end: '15:00' },
      ]),
    )
  }
} catch {
  /* ignore in non-browser contexts */
}

let categories = [
  { id: 'cat-1', name: 'วิชาแกน' },
  { id: 'cat-2', name: 'วิชาเอก' },
  { id: 'cat-3', name: 'วิชาโท' },
  { id: 'cat-4', name: 'วิชาศึกษาทั่วไป' },
]

let catalog = [
  { id: 'course-1', code: 'JC100', name_th: 'หลักการวารสารศาสตร์เบื้องต้นและการสื่อสารมวลชนในยุคดิจิทัล', category_name: 'วิชาแกน', review_count: 1, average_rating: 5 },
  { id: 'course-2', code: 'JC232', name_th: 'เทคนิคการถ่ายทำและตัดต่อวิดีโอ', category_name: 'วิชาเอก', review_count: 2, average_rating: 3.5 },
  { id: 'course-3', code: 'JC301', name_th: 'การเขียนข่าวขั้นสูง', category_name: 'วิชาเอก', review_count: 0, average_rating: null },
  { id: 'course-4', code: 'BJM210', name_th: 'International Media Studies', category_name: 'วิชาโท', review_count: 1, average_rating: 2 },
  { id: 'course-5', code: 'GE101', name_th: 'ทักษะการใช้ชีวิตในศตวรรษที่ 21', category_name: 'วิชาศึกษาทั่วไป', review_count: 0, average_rating: null },
]

let managedCourses = catalog.map((course, index) => ({
  id: course.id,
  code: course.code,
  name_th: course.name_th,
  category_id: categories[index % categories.length].id,
  category_name: course.category_name,
  status: index === 4 ? 'archived' : 'approved',
}))

const offeringsByCourse: Record<string, Array<{ id: string; section: string; academic_year: number; semester: string; instructor_name: string | null }>> = {
  'course-1': [{ id: 'offering-1', section: '320001', academic_year: 2568, semester: '1', instructor_name: 'อ. อ้อม' }],
  'course-2': [
    { id: 'offering-2', section: '320001', academic_year: 2568, semester: '1', instructor_name: 'อ. อ้อม' },
    { id: 'offering-3', section: '320002', academic_year: 2568, semester: '1', instructor_name: 'อ. บอย' },
  ],
  'course-3': [{ id: 'offering-4', section: '310001', academic_year: 2568, semester: '2', instructor_name: null }],
  'course-4': [],
  'course-5': [{ id: 'offering-5', section: '010001', academic_year: 2568, semester: '1', instructor_name: 'อ. เจน' }],
}

const meetingsByOffering: Record<string, Array<{ day_of_week: number; starts_at: string; ends_at: string }>> = {
  'offering-1': [{ day_of_week: 4, starts_at: '09:30:00', ends_at: '12:30:00' }],
  'offering-2': [{ day_of_week: 4, starts_at: '09:30:00', ends_at: '12:30:00' }],
  'offering-3': [{ day_of_week: 2, starts_at: '13:00:00', ends_at: '16:00:00' }],
  'offering-4': [{ day_of_week: 3, starts_at: '08:00:00', ends_at: '11:00:00' }],
  'offering-5': [{ day_of_week: 1, starts_at: '13:00:00', ends_at: '16:00:00' }],
}

let visibleReviewsByCourse: Record<string, Array<Record<string, unknown>>> = {
  'course-1': [
    { id: 'review-1', rating: 5, text: 'อาจารย์สอนสนุกมาก เนื้อหาเข้าใจง่าย แนะนำให้ลงเรียนเทอมนี้เลย', created_at: '2026-08-20T10:00:00Z', section: '320001', semester: '1', academic_year: 2568, instructor_name: 'อ. อ้อม', day_of_week: 4, starts_at: '09:30:00', ends_at: '12:30:00' },
  ],
  'course-2': [
    { id: 'review-2', rating: 4, text: 'งานเยอะแต่ได้ความรู้จริง อุปกรณ์ถ่ายทำครบ', created_at: '2026-08-15T10:00:00Z', section: '320001', semester: '1', academic_year: 2568, instructor_name: 'อ. อ้อม', day_of_week: 4, starts_at: '09:30:00', ends_at: '12:30:00' },
    { id: 'review-3', rating: 3, text: 'พอใช้ เนื้อหาซ้ำกับวิชาอื่นเล็กน้อย', created_at: '2026-07-01T10:00:00Z', section: '320002', semester: '1', academic_year: 2568, instructor_name: 'อ. บอย', day_of_week: 2, starts_at: '13:00:00', ends_at: '16:00:00' },
  ],
  'course-3': [],
  'course-4': [{ id: 'review-4', rating: 2, text: 'ไม่มีกลุ่มเรียนที่อนุมัติ รีวิวนี้รายงานเวลาเรียนเอง', created_at: '2026-06-01T10:00:00Z', section: '999', semester: '2', academic_year: 2567, instructor_name: 'Prof. Lee', day_of_week: 5, starts_at: '10:00:00', ends_at: '13:00:00' }],
  'course-5': [],
}

let myTimetable: Array<{ offering_id: string; course_code: string; course_name: string; section: string; day_of_week: number; starts_at: string; ends_at: string; instructor_name: string | null }> = [
  { offering_id: 'offering-1', course_code: 'JC100', course_name: 'หลักการวารสารศาสตร์เบื้องต้นและการสื่อสารมวลชนในยุคดิจิทัล', section: '320001', day_of_week: 4, starts_at: '09:30:00', ends_at: '12:30:00', instructor_name: 'อ. อ้อม' },
  { offering_id: 'offering-5', course_code: 'GE101', course_name: 'ทักษะการใช้ชีวิตในศตวรรษที่ 21', section: '010001', day_of_week: 1, starts_at: '13:00:00', ends_at: '16:00:00', instructor_name: 'อ. เจน' },
]
let myReportedTimetable: Array<{ review_id: string; course_code: string; course_name: string; section: string; day_of_week: number; starts_at: string; ends_at: string; instructor_name: string | null }> = []

let myReviews = [
  { id: 'review-1', course_id: 'course-1', offering_id: 'offering-1', rating: 5, text: 'อาจารย์สอนสนุกมาก เนื้อหาเข้าใจง่าย แนะนำให้ลงเรียนเทอมนี้เลย', author_active: true, created_at: '2026-08-20T10:00:00Z' },
  { id: 'review-5', course_id: 'course-3', offering_id: null, rating: 2, text: 'ถอนการเผยแพร่ไปแล้วเพราะข้อมูลเก่า', author_active: false, created_at: '2026-05-01T10:00:00Z' },
]
const myReviewRevisions: Record<string, Array<{ id: string; rating: number; text: string; revised_at: string }>> = {
  'review-1': [{ id: 'rev-1', rating: 4, text: 'เวอร์ชันก่อนแก้ไข', revised_at: '2026-08-10T10:00:00Z' }],
}

let myProposals: Array<{ id: string; course_id: string; academic_year: number; semester: string; section: string; instructor_name: string | null; status: string; created_at: string }> = []

let academicPeriods = [
  { id: 'period-1', academic_year: 2568, semester: '1' },
  { id: 'period-2', academic_year: 2568, semester: '2' },
]

let pendingProposals = [
  { id: 'proposal-1', course_code: 'JC301', academic_year: 2568, semester: '2', section: '2', instructor_name: 'อ. ใหม่' },
]

let moderationReviews = [
  { id: 'review-1', rating: 5, text: 'อาจารย์สอนสนุกมาก เนื้อหาเข้าใจง่าย แนะนำให้ลงเรียนเทอมนี้เลย', author_active: true, moderation_state: 'visible' as 'visible' | 'hidden' | 'removed', created_at: '2026-08-20T10:00:00Z' },
  { id: 'review-6', rating: 1, text: 'ข้อความไม่เหมาะสมที่ถูกซ่อนไว้เพื่อทดสอบ', author_active: true, moderation_state: 'hidden' as 'visible' | 'hidden' | 'removed', created_at: '2026-07-05T10:00:00Z' },
]
let moderationAudit: Record<string, Array<{ id: string; prior_state: string; new_state: string; reason: string; actor_name: string; created_at: string }>> = {
  'review-6': [{ id: 'audit-1', prior_state: 'visible', new_state: 'hidden', reason: 'รายงานว่าไม่เหมาะสม', actor_name: 'แอดมิน ม็อค', created_at: '2026-07-05T11:00:00Z' }],
}

let roleAssignments = [
  { user_id: 'user-mock-1', name: 'แอดมิน ม็อค', email: 'admin@example.com', role: 'owner' as const, granted_at: '2026-01-01T00:00:00Z' },
  { user_id: 'user-mock-2', name: 'ผู้ดูแลสอง', email: 'admin2@example.com', role: 'administrator' as const, granted_at: '2026-02-01T00:00:00Z' },
]
let verifiedAccounts = [
  { id: 'user-mock-3', name: 'บัญชีที่ยืนยันแล้ว หนึ่ง', email: 'verified1@example.com' },
  { id: 'user-mock-4', name: 'บัญชีที่ยืนยันแล้ว สอง', email: 'verified2@example.com' },
]

function ok<T>(data: T): RpcResult<T> {
  return { data, error: null }
}

async function rpc(name: string, args?: Record<string, unknown>): Promise<RpcResult<unknown>> {
  switch (name) {
    case 'current_access':
      return ok([{ role: 'owner' }])
    case 'list_approved_catalog':
      return ok(catalog)
    case 'list_categories':
      return ok(categories)
    case 'list_manageable_courses':
      return ok(managedCourses)
    case 'list_approved_offerings':
      return ok(offeringsByCourse[String(args?.p_course_id)] ?? [])
    case 'list_approved_offering_meetings':
      return ok(meetingsByOffering[String(args?.p_offering_id)] ?? [])
    case 'list_visible_reviews': {
      const rows = visibleReviewsByCourse[String(args?.p_course_id)] ?? []
      const rating = args?.p_rating as number | null | undefined
      const semester = args?.p_semester as string | null | undefined
      const year = args?.p_academic_year as number | null | undefined
      return ok(rows.filter((row) =>
        (!rating || row.rating === rating) &&
        (!semester || row.semester === semester) &&
        (!year || row.academic_year === year)))
    }
    case 'create_review': {
      const courseId = String(args?.p_course_id)
      const id = `review-new-${Date.now()}`
      const review = {
        id, rating: args?.p_rating, text: args?.p_text, created_at: new Date().toISOString(),
        section: args?.p_section, semester: args?.p_semester, academic_year: args?.p_academic_year,
        instructor_name: args?.p_instructor_name, day_of_week: args?.p_day, starts_at: args?.p_starts, ends_at: args?.p_ends,
      }
      visibleReviewsByCourse[courseId] = [...(visibleReviewsByCourse[courseId] ?? []), review]
      return ok(null)
    }
    case 'list_my_reviews':
      return ok(myReviews)
    case 'update_my_review': {
      myReviews = myReviews.map((review) => review.id === args?.p_review_id ? { ...review, rating: Number(args?.p_rating), text: String(args?.p_text) } : review)
      return ok(null)
    }
    case 'set_my_review_active': {
      myReviews = myReviews.map((review) => review.id === args?.p_review_id ? { ...review, author_active: Boolean(args?.p_active) } : review)
      return ok(null)
    }
    case 'list_my_review_revisions':
      return ok(myReviewRevisions[String(args?.p_review_id)] ?? [])
    case 'list_my_timetable':
      return ok(myTimetable)
    case 'list_my_reported_timetable':
      return ok(myReportedTimetable)
    case 'add_my_timetable_offering': {
      const offeringId = String(args?.p_offering_id)
      const [courseId, offering] = Object.entries(offeringsByCourse).flatMap(([cid, list]) => list.map((item) => [cid, item] as const)).find(([, item]) => item.id === offeringId) ?? []
      const course = catalog.find((item) => item.id === courseId)
      if (offering && course) myTimetable = [...myTimetable, { offering_id: offering.id, course_code: course.code, course_name: course.name_th, section: offering.section, ...toMeeting(meetingsByOffering[offering.id][0]), instructor_name: offering.instructor_name }]
      return ok(null)
    }
    case 'replace_my_timetable_offering': {
      const offeringId = String(args?.p_offering_id)
      const [courseId, offering] = Object.entries(offeringsByCourse).flatMap(([cid, list]) => list.map((item) => [cid, item] as const)).find(([, item]) => item.id === offeringId) ?? []
      const course = catalog.find((item) => item.id === courseId)
      if (offering && course) myTimetable = [...myTimetable.filter((entry) => entry.course_code !== course.code), { offering_id: offering.id, course_code: course.code, course_name: course.name_th, section: offering.section, ...toMeeting(meetingsByOffering[offering.id][0]), instructor_name: offering.instructor_name }]
      return ok(null)
    }
    case 'remove_my_timetable_offering':
      myTimetable = myTimetable.filter((entry) => entry.offering_id !== args?.p_offering_id)
      return ok(null)
    case 'add_my_timetable_review': {
      const reviewId = String(args?.p_review_id)
      const review = Object.values(visibleReviewsByCourse).flat().find((item) => item.id === reviewId) as Record<string, unknown> | undefined
      const course = Object.entries(visibleReviewsByCourse).find(([, list]) => list.some((item) => item.id === reviewId))
      const courseInfo = course ? catalog.find((item) => item.id === course[0]) : undefined
      if (review && courseInfo) myReportedTimetable = [...myReportedTimetable, { review_id: reviewId, course_code: courseInfo.code, course_name: courseInfo.name_th, section: String(review.section ?? ''), day_of_week: Number(review.day_of_week), starts_at: String(review.starts_at), ends_at: String(review.ends_at), instructor_name: (review.instructor_name as string) ?? null }]
      return ok(null)
    }
    case 'remove_my_timetable_review':
      myReportedTimetable = myReportedTimetable.filter((entry) => entry.review_id !== args?.p_review_id)
      return ok(null)
    case 'clear_my_timetable':
      myTimetable = []
      myReportedTimetable = []
      return ok(null)
    case 'list_my_offering_proposals':
      return ok(myProposals)
    case 'create_offering_proposal': {
      const proposal = { id: `proposal-new-${Date.now()}`, course_id: String(args?.p_course_id), academic_year: Number(args?.p_academic_year), semester: String(args?.p_semester), section: String(args?.p_section), instructor_name: (args?.p_instructor_name as string) || null, status: 'approved', created_at: new Date().toISOString() }
      myProposals = [...myProposals, proposal]
      return ok(proposal.id)
    }
    case 'create_course': {
      const code = String(args?.p_code)
      if (catalog.some((course) => course.code === code)) return { data: null, error: { message: `รหัสวิชา ${code} มีอยู่แล้ว` } }
      const category = categories.find((item) => item.id === args?.p_category_id)
      const id = `course-new-${Date.now()}`
      catalog = [...catalog, { id, code, name_th: String(args?.p_name_th), category_name: category?.name ?? '' }]
      managedCourses = [...managedCourses, { id, code, name_th: String(args?.p_name_th), category_id: String(args?.p_category_id), category_name: category?.name ?? '', status: 'approved' }]
      offeringsByCourse[id] = []
      return ok(null)
    }
    case 'update_course': {
      const courseId = String(args?.p_course_id)
      const category = categories.find((item) => item.id === args?.p_category_id)
      catalog = catalog.map((course) => course.id === courseId ? { ...course, code: String(args?.p_code), name_th: String(args?.p_name_th), category_name: category?.name ?? course.category_name } : course)
      managedCourses = managedCourses.map((course) => course.id === courseId ? { ...course, code: String(args?.p_code), name_th: String(args?.p_name_th), category_id: String(args?.p_category_id), category_name: category?.name ?? course.category_name } : course)
      return ok(null)
    }
    case 'archive_course':
      managedCourses = managedCourses.map((course) => course.id === args?.p_course_id ? { ...course, status: 'archived' } : course)
      return ok(null)
    case 'create_category': {
      categories = [...categories, { id: `cat-new-${Date.now()}`, name: String(args?.p_name) }]
      return ok(null)
    }
    case 'update_category':
      categories = categories.map((category) => category.id === args?.p_category_id ? { ...category, name: String(args?.p_name) } : category)
      return ok(null)
    case 'preview_course_merge':
      return ok([{ source_code: 'JC999', target_code: 'JC100', offerings_to_move: 1, reviews_preserved: 2 }])
    case 'merge_course':
      return ok(null)
    case 'list_academic_periods':
      return ok(academicPeriods)
    case 'create_academic_period':
      academicPeriods = [...academicPeriods, { id: `period-new-${Date.now()}`, academic_year: Number(args?.p_academic_year), semester: String(args?.p_semester) }]
      return ok(null)
    case 'create_offering': {
      const courseId = String(args?.p_course_id)
      const id = `offering-new-${Date.now()}`
      offeringsByCourse[courseId] = [...(offeringsByCourse[courseId] ?? []), { id, section: String(args?.p_section), academic_year: Number(args?.p_academic_year), semester: String(args?.p_semester), instructor_name: (args?.p_instructor_name as string) || null }]
      meetingsByOffering[id] = [{ day_of_week: Number(args?.p_day), starts_at: `${args?.p_starts}:00`, ends_at: `${args?.p_ends}:00` }]
      return ok(null)
    }
    case 'update_offering':
      return ok(null)
    case 'list_pending_offering_proposals':
      return ok(pendingProposals)
    case 'resolve_offering_proposal':
      pendingProposals = pendingProposals.filter((proposal) => proposal.id !== args?.p_proposal_id)
      return ok(null)
    case 'list_moderation_reviews': {
      const state = args?.p_state as string | null | undefined
      return ok(state ? moderationReviews.filter((review) => review.moderation_state === state) : moderationReviews)
    }
    case 'list_review_moderation_audit':
      return ok(moderationAudit[String(args?.p_review_id)] ?? [])
    case 'moderate_review': {
      const reviewId = String(args?.p_review_id)
      const state = args?.p_state as 'visible' | 'hidden' | 'removed'
      moderationReviews = moderationReviews.map((review) => review.id === reviewId ? { ...review, moderation_state: state } : review)
      moderationAudit[reviewId] = [...(moderationAudit[reviewId] ?? []), { id: `audit-new-${Date.now()}`, prior_state: 'visible', new_state: state, reason: String(args?.p_reason), actor_name: sessionUser.name, created_at: new Date().toISOString() }]
      return ok(null)
    }
    case 'bulk_import_offerings':
      return ok([{ created_count: (args?.p_rows as unknown[] | undefined)?.length ?? 0, updated_count: 0, existing_count: 0 }])
    case 'preview_offering_import':
      return ok(((args?.p_rows as Array<Record<string, unknown>>) ?? []).map((row, index) => ({
        row_number: index + 1, course_code: row.courseCode, academic_year: row.academicYear, semester: row.semester, section: row.section,
        instructor_name: row.instructorName ?? null, day_of_week: row.dayOfWeek, starts_at: row.startsAt, ends_at: row.endsAt,
        valid: true, action: 'create', reason: null, offering_id: null,
      })))
    case 'list_role_assignments':
      return ok(roleAssignments)
    case 'list_verified_accounts':
      return ok(verifiedAccounts)
    case 'grant_administrator':
      roleAssignments = [...roleAssignments, { user_id: String(args?.p_user_id), name: verifiedAccounts.find((account) => account.id === args?.p_user_id)?.name ?? 'ผู้ดูแลใหม่', email: verifiedAccounts.find((account) => account.id === args?.p_user_id)?.email ?? '', role: 'administrator', granted_at: new Date().toISOString() }]
      return ok(null)
    case 'revoke_administrator':
      roleAssignments = roleAssignments.filter((member) => member.user_id !== args?.p_user_id)
      return ok(null)
    default:
      throw new Error(`[dev:mock] Unhandled RPC: ${name}`)
  }
}

function toMeeting(meeting: { day_of_week: number; starts_at: string; ends_at: string }) {
  return { day_of_week: meeting.day_of_week, starts_at: meeting.starts_at, ends_at: meeting.ends_at }
}

export const neon = {
  auth: {
    getSession: async () => ({ data: { user: sessionUser } }),
    signOut: async () => undefined,
  },
  rpc,
}

export async function signInWithGoogle() {
  /* no-op: dev:mock always starts signed in */
}
