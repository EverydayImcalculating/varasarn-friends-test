<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { RpcClient } from '../services/reviews'
import {
  importLegacyTimetable,
  previewLegacyTimetable,
  readLegacyTimetable,
  weekdays,
  type CatalogCourse,
  type ImportPreview,
  type ImportResult,
  type LegacySource,
} from '../services/legacy-timetable-import'

const props = defineProps<{ email: string; catalog: CatalogCourse[]; client: RpcClient }>()
const emit = defineEmits<{ imported: [] }>()
const source = ref<LegacySource>({ kind: 'none' })
const rows = ref<ImportPreview[]>([])
const selected = ref<number[]>([])
const results = ref<ImportResult[]>([])
const dismissed = ref(false)
const busy = ref(false)
const error = ref('')

onMounted(() => {
  try { source.value = readLegacyTimetable(props.email, window.localStorage) }
  catch { source.value = { kind: 'error', message: 'อ่านข้อมูลตารางเรียนเดิมจากเบราว์เซอร์ไม่ได้' } }
})

function resultFor(index: number) { return results.value.find((result) => result.index === index) }
function officialTime(row: ImportPreview) {
  return row.meetings?.map((meeting) => `${weekdays[meeting.day - 1]} ${meeting.start}–${meeting.end}`).join(' · ') ?? ''
}

async function preview() {
  if (source.value.kind !== 'found') return
  busy.value = true
  error.value = ''
  results.value = []
  try {
    if (!props.catalog.length) throw new Error('ยังไม่สามารถโหลดรายวิชาได้ กรุณาลองใหม่')
    rows.value = await previewLegacyTimetable(props.client, source.value.entries, props.catalog)
    selected.value = rows.value.filter((row) => row.status === 'ready').map((row) => row.legacy.index)
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'ตรวจสอบตารางเรียนเดิมไม่ได้' }
  finally { busy.value = false }
}

async function confirmImport() {
  if (source.value.kind !== 'found' || !selected.value.length) return
  busy.value = true
  error.value = ''
  try {
    const outcomes = await importLegacyTimetable(props.client, source.value.entries, props.catalog, rows.value, selected.value)
    const byIndex = new Map(results.value.map((result) => [result.index, result]))
    for (const outcome of outcomes) {
      if (outcome.status !== 'skipped' || outcome.message !== 'ไม่ได้เลือกนำเข้า' || !byIndex.has(outcome.index)) byIndex.set(outcome.index, outcome)
    }
    results.value = rows.value.flatMap((row) => byIndex.has(row.legacy.index) ? [byIndex.get(row.legacy.index)!] : [])
    selected.value = outcomes.filter((result) => result.status === 'failed').map((result) => result.index)
    if (outcomes.some((result) => result.status === 'added')) emit('imported')
  } catch (cause) { error.value = cause instanceof Error ? cause.message : 'นำเข้าตารางเรียนเดิมไม่ได้' }
  finally { busy.value = false }
}
</script>

<template>
  <div v-if="source.kind === 'error'" class="review-box" role="alert">{{ source.message }} ข้อมูลเดิมจะไม่ถูกลบ</div>
  <template v-else-if="source.kind === 'none'"></template>
  <div v-else-if="dismissed" class="mb-3"><button class="btn btn-sm btn-outline-purple" @click="dismissed = false">ดูตารางเรียนเดิมที่พบ</button></div>
  <section v-else class="review-box legacy-import" aria-label="นำเข้าตารางเรียนเดิม">
    <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
      <div>
        <h2 class="h5 text-purple mb-1">พบตารางเรียนเดิมในเบราว์เซอร์นี้</h2>
        <p class="text-muted mb-2">ตรวจสอบรายวิชาและกลุ่มเรียนก่อนนำเข้า ข้อมูลเดิมใช้อีเมลที่เคยพิมพ์ไว้ จึงไม่ใช่หลักฐานยืนยันตัวตน</p>
      </div>
      <button class="btn btn-sm btn-outline-purple" @click="dismissed = true">ไว้ภายหลัง</button>
    </div>
    <button data-test="preview-import" class="btn btn-outline-purple mb-3" :disabled="busy" @click="preview">{{ busy ? 'กำลังตรวจสอบ...' : rows.length ? 'ตรวจสอบอีกครั้ง' : 'ตรวจสอบตารางเดิม' }}</button>
    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
    <template v-if="rows.length">
      <p class="small text-muted">ระบบใช้กลุ่มเรียนและเวลาเรียนทางการสำหรับตารางใหม่ ข้อมูลเดิมจะอยู่ในเบราว์เซอร์จนกว่าคุณจะตรวจสอบผล</p>
      <ul class="list-unstyled mb-3">
        <li v-for="row in rows" :key="row.legacy.index" class="legacy-import-row">
          <div class="d-flex align-items-start gap-2">
            <input v-if="row.status === 'ready'" :id="`legacy-import-${row.legacy.index}`" v-model="selected" class="form-check-input mt-1" type="checkbox" :value="row.legacy.index" :disabled="busy || resultFor(row.legacy.index)?.status === 'added'">
            <span v-else class="legacy-import-spacer" aria-hidden="true"></span>
            <div class="flex-grow-1">
              <label :for="row.status === 'ready' ? `legacy-import-${row.legacy.index}` : undefined" class="fw-semibold d-block">{{ row.legacy.code || `รายการ ${row.legacy.index}` }} · กลุ่ม {{ row.legacy.section || 'ไม่ระบุ' }} <span v-if="row.legacy.name" class="fw-normal">{{ row.legacy.name }}</span></label>
              <small class="d-block text-muted">ข้อมูลเดิม: {{ row.legacy.teacher || 'ไม่ระบุผู้สอน' }} · {{ row.legacy.day || 'ไม่ระบุวัน' }} {{ row.legacy.start || '--:--' }}–{{ row.legacy.end || '--:--' }}</small>
              <small v-if="row.offering" class="d-block">ทางการ: เทอม {{ row.offering.semester }}/{{ row.offering.academic_year }} · กลุ่ม {{ row.offering.section }} · {{ row.offering.instructor_name || 'ไม่ระบุผู้สอน' }}<span v-if="row.meetings?.length"> · {{ officialTime(row) }}</span></small>
              <small v-if="row.candidates?.length" class="d-block">กลุ่มเรียนที่พบ: {{ row.candidates.map((candidate) => `เทอม ${candidate.semester}/${candidate.academic_year}`).join(' · ') }}</small>
              <small v-if="row.differsFromOld" class="d-block text-warning-emphasis">ผู้สอนหรือเวลาเรียนต่างจากข้อมูลเดิม โปรดตรวจสอบ</small>
              <small class="d-block" :class="row.status === 'ready' ? 'text-success' : 'text-muted'">{{ row.message }}</small>
              <small v-if="resultFor(row.legacy.index)" class="d-block" role="status">ผลนำเข้า: {{ resultFor(row.legacy.index)?.message }}</small>
            </div>
          </div>
        </li>
      </ul>
      <button data-test="confirm-import" class="btn btn-purple" :disabled="busy || !selected.length" @click="confirmImport">{{ busy ? 'กำลังนำเข้า...' : `ยืนยันนำเข้า ${selected.length} วิชา` }}</button>
      <p v-if="results.length" class="small text-muted mt-2 mb-0">ข้อมูลเดิมยังอยู่ในเบราว์เซอร์ ตรวจสอบตารางเรียนใหม่ก่อนจัดการข้อมูลเดิม</p>
    </template>
  </section>
</template>
