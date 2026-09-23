# 06: Approved offerings and academic periods

**What to build:** Administrators can maintain approved offerings and academic periods independently of student reviews, and signed-in users can inspect current section details on a course.

Blocked by: 03 Course and category management

Status: needs-info

- [x] Administrators can maintain academic years and semester labels through the dashboard, preserving user-facing Thai terminology.
- [x] Administrators can add an offering for an active course with year, semester, section, instructor, and a valid meeting interval.
- [ ] Active offerings are unique by course, academic year, semester, and normalized section; a factual correction updates the shared offering without editing linked review text.
- [ ] Archived courses cannot receive new offerings; invalid meeting times and duplicate active offerings are rejected before commit.
- [ ] Signed-in users can inspect approved offering details, while ordinary users cannot change them through direct data requests; changes are audited and tested.

## Comments

### 2026-09-23 — Academic-period and offering dashboard controls deployed

Added the authenticated `list_academic_periods` projection in migration `0017_list_academic_periods.sql`; it is applied to Neon and the Data API cache has been refreshed. Administrators can now create Thai academic-period labels and add an approved active-course section with instructor and a validated day/time interval from the dashboard. Server-side administrator checks, active-course checks, time constraints, and offer creation remain the enforcement boundary.

`npm test -- --run` passed 14 tests and `npm run build` passed. Multi-meeting editing, factual correction, audit records, and direct-request acceptance remain outstanding.

### 2026-09-23 — Offering audit and academic-period enforcement added

Migration `0020_offering_audit.sql` is applied to Neon and the Data API cache is refreshed. Offering creation now requires an existing academic period and valid day/time interval, then records the authenticated administrator, action, offering, and time in a private audit table. The local suite passes 18 tests and the Vite production build passes. Multi-meeting correction and direct-request acceptance still need evidence.
