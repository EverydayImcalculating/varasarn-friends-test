# 07: Student offering proposals and approval

**What to build:** A signed-in student can optionally propose a missing official timetable section for an existing course and track its status. Review submission never waits for this proposal or its approval.

Blocked by: 05 Merge duplicate courses; 06 Approved offerings and academic periods

Status: needs-info

- [x] A signed-in user can submit an offering proposal for an existing active course and see their own pending, approved, or rejected proposals.
- [x] Proposing a missing official timetable offering is a separate, optional flow from writing a review, with visible validation and status feedback.
- [x] The administrator dashboard lists pending proposals and permits approval or rejection with an auditable actor and time.
- [x] Approval checks for an equivalent approved offering and resolves a duplicate without creating another canonical section; approval and status update are atomic.
- [x] Pending and rejected proposals do not appear as approved timetable offerings and cannot be selected for a timetable; they do not block course reviews with student-reported class details.
- [ ] Ordinary users cannot approve, reject, or inspect another user's private proposal data through direct requests; browser and data-interface tests cover the workflow.
- [x] Course merge preserves proposal references and the proposer's status view.

## Comments

### 2026-09-23 — Self-scoped proposal client and admin projection completed

The student client validates and normalizes proposal fields before using only `create_offering_proposal` and `list_my_offering_proposals`. The Vue component now uses that typed service rather than direct RPC calls. Administrators have a separate pending-proposal projection and resolution client, backed by the deployed atomic resolution function. Service tests cover the student request shape and self-scoped read.

The remaining work is to render the student status and administrator approval controls in the protected browser flows, then record cross-account acceptance evidence.

### 2026-09-23 — Proposal flows rendered

The course detail now has a separately labeled proposal form and a self-only status list for the selected course. The administrator dashboard renders pending proposal rows with approval and rejection controls. Both use the existing typed, protected Data API clients; no author identity is displayed. `npm test -- --run` passed (22 tests) and `npm run build` passed. Live cross-account acceptance remains needed.

### 2026-09-23 — Proposal scope narrowed by owner

The owner removed administrator approval as a prerequisite for review submission. This ticket now concerns only official timetable offerings; the proposal flow may remain optional and separate from the review composer.

### 2026-09-23 — Two real gaps found and fixed; verified on an isolated branch

Reviewing the deployed `api.resolve_offering_proposal` and `api.merge_course` against the remaining checklist found two genuine gaps, not just missing evidence:

1. **Merge didn't carry proposals forward.** `merge_course` already reassigned `reviews.course_id` and `offerings.course_id` to the merge target and archived the source course, but left `offering_proposals.course_id` pointing at the now-archived source. A proposer's `list_my_offering_proposals` would keep resolving to an archived course.
2. **Approval could fail or double up on an equivalent offering.** `resolve_offering_proposal` compared the proposal's raw `section` text against existing offerings, not the normalized comparison `create_offering` and the `offerings_normalized_section_unique` index use. A proposal whose section differed only by case or spacing from an existing approved offering (`"Sec 1"` vs `"sec1"`) would hit the unique-index violation instead of being resolved onto the existing offering. It also never checked that the proposal's course was still `approved`, so approving a proposal for a course archived after submission (e.g. by a merge) would insert an offering under an archived course, contradicting Ticket 06's rule.

Added migration `0026_offering_proposal_fixes.sql`: `merge_course` now also updates `offering_proposals.course_id`, and `resolve_offering_proposal` now compares sections with the same `lower(regexp_replace(btrim(section), '[[:space:]]+', '', 'g'))` normalization as `create_offering`, and rejects approval with `active course required` when the proposal's course is no longer approved.

Added admin-service unit tests for `listPendingOfferingProposals`/`resolveOfferingProposal` (there were none before) in [tests/admin-service.test.ts](../../../tests/admin-service.test.ts), and a new isolated-branch verification script, [scripts/verify-offering-proposals.mjs](../../../scripts/verify-offering-proposals.mjs) (`npm run test:offering-proposals`), following the same pattern as `verify-offering-import.mjs`. Ran it against a fresh branch (`test-offering-proposals-20260923`, `br-bold-thunder-b32zlvzt`) forked from production with all 26 migrations applied, inside a single rolled-back transaction: confirmed `resolve_offering_proposal` is denied without an administrator identity; confirmed a proposal with section `sec1` resolves onto an existing `" Sec 1 "` offering without creating a duplicate, and its `status`/`resolved_at` are set correctly; confirmed approval of a proposal for an archived course is rejected with `active course required`; and confirmed `merge_course` reassigns a source-course proposal's `course_id` to the target course. All four checks passed. `npm test -- --run` passed 25 tests and `npm run build` passed.

**Not yet done:** migration `0026_offering_proposal_fixes.sql` has not been applied to the production Neon branch (the fixes only exist on the throwaway test branch so far), so production still has the two gaps above. Live browser acceptance of the workflow with two real signed-in Google accounts — a student proposing and tracking status, an administrator approving/rejecting, a non-administrator denied direct access — also remains open, for the same reason recorded on Tickets 01, 06, and 09: no Google test-account credentials are available to this session. Status stays `needs-info`.

### 2026-09-23 — Migration 0026 applied to production; fixes confirmed live

With owner approval, ran `npm run db:migrate` against the production branch and `neon data-api refresh-schema --project-id soft-surf-84712820 --branch production`. A read-only check confirms the applied-migrations log advanced from 26 to 27 rows, and the live `api.merge_course` and `api.resolve_offering_proposal` function bodies now contain the `offering_proposals` reassignment, the `regexp_replace` normalization, and the `active course required` check respectively. Rebuilt commit `9c926b9` locally and confirmed the deployed test app (`https://varasarn-friends-test-tau.vercel.app/`) serves the identical asset hashes. `npm test -- --run` passed 25 tests and `npm run build` passed on this commit.

Checked off every checklist item whose capability is now implemented and live: submission and self-scoped status, the separate optional flow, the admin listing/resolution with auditable actor and time, atomic normalized-duplicate-safe approval, and merge carry-forward. Left the direct-request/browser item unchecked — the RPC gating and data-interface behavior are verified (isolated-branch script above plus the admin-service unit tests), but the "browser" half of that item and the rest of this ticket's cross-account walkthrough still need a real signed-in Google session, which remains unavailable to this session. Status stays `needs-info` for that reason alone.
