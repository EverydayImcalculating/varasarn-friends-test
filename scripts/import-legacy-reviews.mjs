import XLSX from 'xlsx'
const [file] = process.argv.slice(2)
if (!file) throw new Error('Usage: node scripts/import-legacy-reviews.mjs <workbook.xlsx>')
const rows = XLSX.utils.sheet_to_json(XLSX.readFile(file).Sheets.Reviews, { defval: '' })
const valid = []; const rejected = []; const seen = new Set()
for (const [index, row] of rows.entries()) {
  const code = String(row.CourseCode ?? '').trim().toUpperCase().replace(/\s+/g, ''); const rating = Number(row.Rating); const text = String(row.ReviewText ?? '').trim(); const semester = String(row.Semester ?? '').trim(); const year = Number(row.Year); const section = String(row.Section ?? '').trim(); const key = `${code}/${year}/${semester}/${section}/${text}`
  if (!code || !Number.isInteger(rating) || rating < 1 || rating > 5 || !text || !semester || !Number.isInteger(year) || !section) rejected.push({ row: index + 2, reason: 'missing or invalid historical review fields' })
  else if (seen.has(key)) rejected.push({ row: index + 2, reason: 'duplicate historical review' })
  else { seen.add(key); valid.push({ sourceRow: index + 2, courseCode: code, rating, text, semester, year, section, instructorName: String(row.Teacher ?? '').trim() || null, createdAt: row.Timestamp || null, scheduleVerified: false }) }
}
console.log(JSON.stringify({ sourceRows: rows.length, accepted: valid.length, rejected, reviews: valid, discardedFields: ['CreatorEmail', 'Day', 'StartTime', 'EndTime'] }, null, 2))
