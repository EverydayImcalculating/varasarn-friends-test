import type { RpcClient } from './reviews'
import { TimetableService } from './timetable-client'
import { isValidMeeting, overlaps, type Meeting } from './timetable'

const legacyPrefix = 'my_tu_schedule_'
export const weekdays = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์']

export type CatalogCourse = { id: string; code: string }
export type LegacyClass = {
  index: number
  code: string
  name: string
  section: string
  teacher: string
  day: string
  start: string
  end: string
  invalidReason?: string
}
export type LegacySource =
  | { kind: 'none' }
  | { kind: 'error'; message: string }
  | { kind: 'found'; entries: LegacyClass[] }

export type TimetableEntry = {
  offering_id: string
  course_code: string
  section: string
  day_of_week: number
  starts_at: string
  ends_at: string
}
export type OfficialOffering = {
  id: string
  section: string
  academic_year: number
  semester: string
  instructor_name: string | null
}
export type ImportStatus = 'ready' | 'invalid' | 'missing' | 'ambiguous' | 'no-meeting' | 'already' | 'section-conflict' | 'time-conflict' | 'error'
export type ImportPreview = {
  legacy: LegacyClass
  status: ImportStatus
  message: string
  offering?: OfficialOffering
  candidates?: OfficialOffering[]
  meetings?: Meeting[]
  differsFromOld?: boolean
}
export type ImportResult = { index: number; status: 'added' | 'already' | 'skipped' | 'failed'; message: string }

function normalizedCode(value: string) { return value.replace(/\s+/g, '').toUpperCase() }
function normalizedSection(value: string) { return value.replace(/\s+/g, '').toLowerCase() }
function validTime(value: string) { return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value) }
function timePart(value: string) { return value.slice(0, 5) }
function stringField(value: unknown): string { return typeof value === 'string' ? value.trim() : '' }
function meetingOf(entry: TimetableEntry): Meeting {
  return { day: entry.day_of_week, start: timePart(entry.starts_at), end: timePart(entry.ends_at) }
}

function parseEntry(value: unknown, index: number): LegacyClass {
  const row = value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const entry = {
    index,
    code: stringField(row.code),
    name: stringField(row.name),
    section: stringField(row.sec),
    teacher: stringField(row.teacher),
    day: stringField(row.day),
    start: stringField(row.start),
    end: stringField(row.end),
  }
  const dayIndex = weekdays.indexOf(entry.day) + 1
  const meeting = { day: dayIndex, start: entry.start, end: entry.end }
  return {
    ...entry,
    ...(!entry.code || !entry.section || !validTime(entry.start) || !validTime(entry.end) || !isValidMeeting(meeting)
      ? { invalidReason: 'ข้อมูลวิชา กลุ่ม หรือเวลาเรียนเดิมไม่ถูกต้อง' }
      : {}),
  }
}

export function readLegacyTimetable(email: string, storage: Pick<Storage, 'length' | 'key' | 'getItem'>): LegacySource {
  if (!email.trim()) return { kind: 'none' }
  try {
    const matches: string[] = []
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (key?.startsWith(legacyPrefix) && key.slice(legacyPrefix.length).trim().toLowerCase() === email.trim().toLowerCase()) matches.push(key)
    }
    if (matches.length > 1) return { kind: 'error', message: 'พบตารางเรียนเดิมหลายรายการสำหรับอีเมลนี้ กรุณาตรวจสอบข้อมูลในเบราว์เซอร์' }
    const key = matches[0]
    if (!key) return { kind: 'none' }
    const raw = storage.getItem(key)
    if (raw === null) return { kind: 'none' }
    let parsed: unknown
    try { parsed = JSON.parse(raw) }
    catch { return { kind: 'error', message: 'รูปแบบข้อมูลตารางเรียนเดิมไม่ถูกต้อง ข้อมูลเดิมยังอยู่ในเบราว์เซอร์' } }
    if (!Array.isArray(parsed)) return { kind: 'error', message: 'ข้อมูลตารางเรียนเดิมไม่ใช่รายการวิชา' }
    if (parsed.length === 0) return { kind: 'none' }
    return { kind: 'found', entries: parsed.map((value, index) => parseEntry(value, index + 1)) }
  } catch {
    return { kind: 'error', message: 'อ่านข้อมูลตารางเรียนเดิมจากเบราว์เซอร์ไม่ได้ ข้อมูลเดิมยังอยู่' }
  }
}

async function rpcRows<T>(client: RpcClient, name: string, args?: Record<string, unknown>): Promise<T[]> {
  const { data, error } = await client.rpc(name, args)
  if (error) throw new Error(error.message)
  return (data ?? []) as T[]
}

function conflictStatus(offeringId: string, courseCode: string, meetings: Meeting[], current: TimetableEntry[]): ImportStatus | null {
  if (current.some((entry) => entry.offering_id === offeringId)) return 'already'
  if (current.some((entry) => normalizedCode(entry.course_code) === normalizedCode(courseCode))) return 'section-conflict'
  if (current.some((entry) => meetings.some((meeting) => overlaps(meeting, meetingOf(entry))))) return 'time-conflict'
  return null
}

const messageFor: Record<ImportStatus, string> = {
  ready: 'พร้อมนำเข้า',
  invalid: 'ข้อมูลเดิมไม่ถูกต้อง',
  missing: 'ไม่พบกลุ่มเรียนทางการที่อนุมัติแล้ว',
  ambiguous: 'พบหลายภาคหรือปีการศึกษา ต้องเลือกเอง',
  'no-meeting': 'กลุ่มเรียนทางการไม่มีเวลาเรียนที่ใช้ได้',
  already: 'มีอยู่ในตารางเรียนของคุณแล้ว',
  'section-conflict': 'มีอีกกลุ่มของวิชานี้อยู่แล้ว กรุณาเปลี่ยนเอง',
  'time-conflict': 'เวลาเรียนชนกับตารางปัจจุบัน กรุณาจัดการเอง',
  error: 'ตรวจสอบกลุ่มเรียนไม่ได้ กรุณาลองใหม่',
}

export async function previewLegacyTimetable(client: RpcClient, entries: LegacyClass[], catalog: CatalogCourse[]): Promise<ImportPreview[]> {
  const current = await new TimetableService(client).list() as TimetableEntry[]
  const courseByCode = new Map(catalog.map((course) => [normalizedCode(course.code), course]))
  const offeringsByCourse = new Map<string, OfficialOffering[]>()
  const preview: ImportPreview[] = []
  for (const legacy of entries) {
    if (legacy.invalidReason) { preview.push({ legacy, status: 'invalid', message: legacy.invalidReason }); continue }
    const course = courseByCode.get(normalizedCode(legacy.code))
    if (!course) { preview.push({ legacy, status: 'missing', message: messageFor.missing }); continue }
    try {
      let offerings = offeringsByCourse.get(course.id)
      if (!offerings) {
        offerings = await rpcRows<OfficialOffering>(client, 'list_approved_offerings', { p_course_id: course.id })
        offeringsByCourse.set(course.id, offerings)
      }
      const matching = offerings.filter((offering) => normalizedSection(offering.section) === normalizedSection(legacy.section))
      if (!matching.length) { preview.push({ legacy, status: 'missing', message: messageFor.missing }); continue }
      if (matching.length > 1) { preview.push({ legacy, status: 'ambiguous', message: messageFor.ambiguous, candidates: matching }); continue }
      const offering = matching[0]
      const officialMeetings = await rpcRows<{ day_of_week: number; starts_at: string; ends_at: string }>(client, 'list_approved_offering_meetings', { p_offering_id: offering.id })
      const meetings = officialMeetings.map((meeting) => ({ day: meeting.day_of_week, start: timePart(meeting.starts_at), end: timePart(meeting.ends_at) }))
      if (!meetings.length || meetings.some((meeting) => !validTime(meeting.start) || !validTime(meeting.end) || !isValidMeeting(meeting))) {
        preview.push({ legacy, status: 'no-meeting', message: messageFor['no-meeting'], offering }); continue
      }
      const status = conflictStatus(offering.id, course.code, meetings, current) ?? 'ready'
      const differsFromOld = !meetings.some((meeting) => weekdays[meeting.day - 1] === legacy.day && meeting.start === legacy.start && meeting.end === legacy.end)
        || Boolean(legacy.teacher && offering.instructor_name && legacy.teacher !== offering.instructor_name)
      preview.push({ legacy, status, message: messageFor[status], offering, meetings, differsFromOld })
    } catch {
      preview.push({ legacy, status: 'error', message: messageFor.error })
    }
  }

  const ready = preview.filter((row) => row.status === 'ready')
  for (const row of ready) {
    const collides = ready.some((other) => other !== row && (
      normalizedCode(other.legacy.code) === normalizedCode(row.legacy.code)
      || row.meetings!.some((meeting) => other.meetings!.some((otherMeeting) => overlaps(meeting, otherMeeting)))
    ))
    if (collides) { row.status = 'time-conflict'; row.message = 'รายการเดิมชนกันหรือซ้ำวิชา กรุณาเลือกเอง' }
  }
  return preview
}

export async function importLegacyTimetable(client: RpcClient, entries: LegacyClass[], catalog: CatalogCourse[], displayed: ImportPreview[], selectedIndices: number[]): Promise<ImportResult[]> {
  const selected = new Set(selectedIndices)
  const fresh = await previewLegacyTimetable(client, entries, catalog)
  const timetable = new TimetableService(client)
  const results: ImportResult[] = []
  for (const row of displayed) {
    if (!selected.has(row.legacy.index)) { results.push({ index: row.legacy.index, status: 'skipped', message: 'ไม่ได้เลือกนำเข้า' }); continue }
    const latest = fresh.find((item) => item.legacy.index === row.legacy.index)
    if (!latest || !row.offering || !latest.offering || row.offering.id !== latest.offering.id) {
      results.push({ index: row.legacy.index, status: 'skipped', message: 'ข้อมูลกลุ่มเรียนเปลี่ยนไป กรุณาตรวจสอบอีกครั้ง' })
      continue
    }
    if (latest.status !== 'ready') {
      results.push({ index: row.legacy.index, status: latest.status === 'already' ? 'already' : 'skipped', message: latest.message })
      continue
    }
    try {
      const current = await timetable.list() as TimetableEntry[]
      const status = conflictStatus(latest.offering.id, latest.legacy.code, latest.meetings!, current)
      if (status) {
        results.push({ index: row.legacy.index, status: status === 'already' ? 'already' : 'skipped', message: messageFor[status] })
        continue
      }
      await timetable.add(latest.offering.id)
      results.push({ index: row.legacy.index, status: 'added', message: 'นำเข้าสำเร็จ' })
    } catch (cause) {
      results.push({ index: row.legacy.index, status: 'failed', message: cause instanceof Error ? cause.message : 'นำเข้าไม่สำเร็จ กรุณาลองใหม่' })
    }
  }
  return results
}
