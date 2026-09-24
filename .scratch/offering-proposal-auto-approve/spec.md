# Offering proposals: enabled, auto-approved (admin review skipped for now)

Status: needs-info

## Problem Statement

The owner asked to let students add a class section ("add course") that goes live right away, without an admin approval step, "for this stage" — explicitly framing real admin moderation as a future feature, not something needed now.

This codebase already had the underlying feature, fully built but disabled: **offering proposals**. A student can propose a section (year, semester, section, instructor) for a course from inside the course-review dialog; historically this required an administrator to call `api.resolve_offering_proposal` before the proposed section became a real, bookable offering. The entire UI for it (`.proposal-box` in [`src/App.vue`](../../src/App.vue)) was hidden behind `v-if="false"` — this rebuild built it but never turned it on.

Two things were checked before touching anything, since the first reading of "skip admin approval" was ambiguous and could have meant several different things in this codebase (see the conversation's AskUserQuestion exchange, not just this file):
- `courses.status` has no `'pending'` state at all (`CHECK ... IN ('approved','archived')`) — admin-created courses already publish instantly, so "skip course approval" had nothing to change.
- The only real approval gate anywhere in the app is `offering_proposals.status` / `api.resolve_offering_proposal`, on the hidden proposal-box feature. That's what "skip admin approval, for now" actually refers to.

## Solution

- Turn the `.proposal-box` UI on (remove `v-if="false"`).
- Change `api.create_offering_proposal()` so a submitted proposal auto-publishes: insert the `offering_proposals` row as `status='approved'` (instead of the default `'pending'`) with `resolved_at=now()`, and immediately insert the corresponding row into `offerings` (idempotent — skipped if a matching course/year/semester/section offering already exists), mirroring exactly what `resolve_offering_proposal(id, true)` already does for an admin-approved proposal.
- Deliberately did **not** touch `api.resolve_offering_proposal` or the `offering_proposals.status` check constraint (still allows `'pending'`) — real admin moderation is meant to come back later, and reverting just the `create_offering_proposal` function (plus no longer auto-approving new rows) is enough to restore the review step without further schema changes.

## Implementation Decisions

- Migration [`db/drizzle/0034_auto_approve_offering_proposals.sql`](../../db/drizzle/0034_auto_approve_offering_proposals.sql): `CREATE OR REPLACE FUNCTION api.create_offering_proposal(...)` — same signature/return type as before (`uuid`), so no grants needed re-issuing (unlike a `DROP FUNCTION`, `CREATE OR REPLACE` keeps existing grants) and no TypeScript service changes needed.
- Frontend ([`src/App.vue`](../../src/App.vue)): extracted the offerings-loading logic out of `openCourse()` into a reusable `loadOfferings(courseId)`, so `submitProposal()` can refresh the offerings list (not just `myProposals`) after a successful submit — the whole point of "right away" is that the new section shows up immediately in the "เพิ่มลงตาราง" list, not just in a private "my proposals" log.
- Copy updated to stop promising an admin review that no longer happens: "เสนอข้อมูลกลุ่มเรียนเพื่อให้ผู้ดูแลตรวจสอบ" (propose for admin review) → "เพิ่มข้อมูลกลุ่มเรียนที่ต้องการได้ทันที" (add it immediately); button "ส่งข้อเสนอกลุ่มเรียน" (submit proposal) → "เพิ่มกลุ่มเรียน" (add section); status list heading "ข้อเสนอของฉัน" (my proposals) → "กลุ่มเรียนที่ฉันเพิ่ม" (sections I've added); the `approved` status label "อนุมัติแล้ว" (approved) → "เพิ่มแล้ว" (added). The `pending`/`rejected` branches of that ternary were left alone rather than removed — harmless, and keeps the display correct if `resolve_offering_proposal`-driven rows ever exist again later.
- No new offering-meeting (day/time) row is created by this path, same as the pre-existing `resolve_offering_proposal` approval path — the proposal form never collected day/start/end, only year/semester/section/instructor. A section added this way appears in the offerings list but without a bookable meeting time; that's an existing gap in the underlying feature, not something introduced here.

## Testing Decisions

New test in [`tests/review-to-timetable-app.test.ts`](../../tests/review-to-timetable-app.test.ts): fills in the proposal box, submits, asserts `create_offering_proposal` is called with the expected args, that the offerings list grows from 1 to 2 cards without any extra admin action, and that the status line reads "เพิ่มแล้ว".

## Comments

### 2026-09-24 — Implemented and migrated to production

Clarified scope via three rounds of AskUserQuestion in chat before writing any code or touching the database — the owner's first phrasing ("skip the approve from admin") could have meant opening course-creation to non-admins (it didn't — admin-only stays, and there was nothing to change there anyway since course creation was already instant) or this offering-proposal feature (it did). Implemented as described above. `npm test` (77/77, +1 new) and `npm run build` passed. Verified visually with a throwaway, uncommitted static HTML file against the compiled CSS (removed afterward) — the box renders correctly with the app's existing form/card styling, no new CSS needed. Applied migration `0034_auto_approve_offering_proposals.sql` to the production Neon branch (owner confirmed first, per this repo's constraint) using `.env.local`'s existing credentials, sourced into a subshell and never printed; verified directly against the database via `pg_get_functiondef` that the auto-approve logic (`'approved', now()`) is present in the live function definition. Live signed-in browser acceptance remains open — nobody has submitted a real proposal as a signed-in student against the deployed site yet.
