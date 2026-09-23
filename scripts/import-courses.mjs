import XLSX from 'xlsx'

const [file, mode = '--dry-run'] = process.argv.slice(2)
if (!file) throw new Error('Usage: npm run import:courses -- <workbook.xlsx> [--commit]')
const rows = XLSX.utils.sheet_to_json(XLSX.readFile(file).Sheets.Courses, { header: 1, defval: '' })
const seen = new Map(); const accepted = []; const rejected = []
rows.forEach((row, index) => {
  const [rawCode, rawName, rawCategory] = row
  if (!String(rawCode).trim() && !String(rawName).trim() && !String(rawCategory).trim()) return
  const code = String(rawCode).trim().toUpperCase().replace(/\s+/g, '')
  const name = String(rawName).trim(); const category = String(rawCategory).trim()
  if (!code || !name || !category) rejected.push({ row: index + 1, reason: 'missing code, name, or category' })
  else if (seen.has(code)) rejected.push({ row: index + 1, reason: `duplicate code (${code}); first at row ${seen.get(code)}` })
  else { seen.set(code, index + 1); accepted.push({ code, name, category, sourceRow: index + 1 }) }
})
console.log(JSON.stringify({ mode, sourceRows: rows.length, accepted: accepted.length, rejected, courses: accepted }, null, 2))
if (mode === '--commit') throw new Error('Commit mode requires owner-approved database reconciliation and is intentionally unavailable until Ticket 04 review UI is complete.')
