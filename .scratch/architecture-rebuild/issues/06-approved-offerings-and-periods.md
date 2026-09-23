# 06: Approved offerings and academic periods

**What to build:** Administrators can maintain approved offerings and academic periods independently of student reviews, and signed-in users can inspect current section details on a course.

Blocked by: 03 Course and category management

Status: needs-info

- [x] Administrators can maintain academic years and semester labels through the dashboard, preserving user-facing Thai terminology.
- [x] Administrators can add an offering for an active course with year, semester, section, instructor, and a valid meeting interval.
- [x] Active offerings are unique by course, academic year, semester, and normalized section; a factual correction updates the shared offering without editing linked review text.
- [x] Archived courses cannot receive new offerings; invalid meeting times and duplicate active offerings are rejected before commit.
- [ ] Signed-in users can inspect approved offering details, while ordinary users cannot change them through direct data requests; changes are audited and tested.

## Comments

### 2026-09-23 — Academic-period and offering dashboard controls deployed

Added the authenticated `list_academic_periods` projection in migration `0017_list_academic_periods.sql`; it is applied to Neon and the Data API cache has been refreshed. Administrators can now create Thai academic-period labels and add an approved active-course section with instructor and a validated day/time interval from the dashboard. Server-side administrator checks, active-course checks, time constraints, and offer creation remain the enforcement boundary.

`npm test -- --run` passed 14 tests and `npm run build` passed. Multi-meeting editing, factual correction, audit records, and direct-request acceptance remain outstanding.

### 2026-09-23 — Offering audit and academic-period enforcement added

Migration `0020_offering_audit.sql` is applied to Neon and the Data API cache is refreshed. Offering creation now requires an existing academic period and valid day/time interval, then records the authenticated administrator, action, offering, and time in a private audit table. The local suite passes 18 tests and the Vite production build passes. Multi-meeting correction and direct-request acceptance still need evidence.

### 2026-09-23 — Uniqueness and duplicate/archived rejection confirmed already live; offering correction added

A read-only check of the production database (`app_private.offerings`) confirms `offerings_normalized_section_unique` (a unique index on course, academic year, semester, and `lower(btrim(section))`, from migration `0022_normalized_offering_sections.sql`) is already applied, and `api.create_offering` (from `0022`, layered on `0020`'s academic-period and interval checks) already rejects an offering for a non-`approved` course, an interval where `end <= start`, an academic period that doesn't exist, and a duplicate normalized active offering, all before any row commits. This closes the first two remaining checklist items; they were done by earlier work in this ticket and are now confirmed against production, not new code.

What was genuinely missing was a way to correct an offering's factual details at all — no `update`/`correct` RPC existed, only `create_offering`. Added migration `0025_correct_offering.sql` with `api.update_offering(p_offering_id, p_academic_year, p_semester, p_section, p_instructor_name, p_day, p_starts, p_ends)`: administrator-only (`require_administrator()`), requires the offering to exist and the new academic period to exist, validates the section and meeting interval the same way `create_offering` does, replaces the offering's single meeting row, and records an `update_offering` row in `offering_audit` alongside the existing `create_offering` audit trail. It relies on the existing `offerings_normalized_section_unique` index to reject a correction that would collide with another active offering, and never reads or writes `reviews`: since `0024_student_reported_reviews.sql`, reviews are course-scoped and self-reported, not linked to a specific offering, so no linked review text can be touched by an offering correction by construction.

Added `AdminService.updateOffering` and `AdminService.listOfferings` (reusing the existing `list_approved_offerings` read RPC) in [src/services/admin.ts](../../../src/services/admin.ts), a unit test asserting both the read and the trimmed/normalized `update_offering` call in [tests/admin-service.test.ts](../../../tests/admin-service.test.ts), and dashboard UI in [src/App.vue](../../../src/App.vue): selecting a course under "ภาคการศึกษาและกลุ่มเรียน" now lists its existing offerings with a "แก้ไข" (edit) action that loads the offering's current fields and meeting time into the same add-offering form (mirroring the existing course-edit pattern), and the save button submits through `update_offering` instead of `create_offering` while editing. `npm test -- --run` passed 24 tests, `npm run build` passed, and `git diff --check` passed.

**Not yet done:** migration `0025_correct_offering.sql` has **not** been applied to the production Neon branch and the Data API schema cache has **not** been refreshed — applying a migration against production was denied by this session's sandbox as a production-deploy action requiring explicit user approval. Until it's applied, `update_offering` doesn't exist in the deployed API and the dashboard's edit path will fail live. Live acceptance of the audit trail and of denied direct-request access to `update_offering` (non-administrator, signed-out) also remains open. Status stays `needs-info`.
