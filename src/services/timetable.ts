export type Meeting = { day: number; start: string; end: string }
const minutes = (time: string) => { const [hours, mins] = time.split(':').map(Number); return hours * 60 + mins }
export function overlaps(a: Meeting, b: Meeting): boolean {
  return a.day === b.day && minutes(a.start) < minutes(b.end) && minutes(b.start) < minutes(a.end)
}
