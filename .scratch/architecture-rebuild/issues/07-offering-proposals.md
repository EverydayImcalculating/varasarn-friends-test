# 07: Student offering proposals and approval

**What to build:** A signed-in student can optionally propose a missing official timetable section for an existing course and track its status. Review submission never waits for this proposal or its approval.

Blocked by: 05 Merge duplicate courses; 06 Approved offerings and academic periods

Status: needs-info

- [ ] A signed-in user can submit an offering proposal for an existing active course and see their own pending, approved, or rejected proposals.
- [ ] Proposing a missing official timetable offering is a separate, optional flow from writing a review, with visible validation and status feedback.
- [ ] The administrator dashboard lists pending proposals and permits approval or rejection with an auditable actor and time.
- [ ] Approval checks for an equivalent approved offering and resolves a duplicate without creating another canonical section; approval and status update are atomic.
- [ ] Pending and rejected proposals do not appear as approved timetable offerings and cannot be selected for a timetable; they do not block course reviews with student-reported class details.
- [ ] Ordinary users cannot approve, reject, or inspect another user's private proposal data through direct requests; browser and data-interface tests cover the workflow.
- [ ] Course merge preserves proposal references and the proposer's status view.

## Comments

### 2026-09-23 — Self-scoped proposal client and admin projection completed

The student client validates and normalizes proposal fields before using only `create_offering_proposal` and `list_my_offering_proposals`. The Vue component now uses that typed service rather than direct RPC calls. Administrators have a separate pending-proposal projection and resolution client, backed by the deployed atomic resolution function. Service tests cover the student request shape and self-scoped read.

The remaining work is to render the student status and administrator approval controls in the protected browser flows, then record cross-account acceptance evidence.

### 2026-09-23 — Proposal flows rendered

The course detail now has a separately labeled proposal form and a self-only status list for the selected course. The administrator dashboard renders pending proposal rows with approval and rejection controls. Both use the existing typed, protected Data API clients; no author identity is displayed. `npm test -- --run` passed (22 tests) and `npm run build` passed. Live cross-account acceptance remains needed.

### 2026-09-23 — Proposal scope narrowed by owner

The owner removed administrator approval as a prerequisite for review submission. This ticket now concerns only official timetable offerings; the proposal flow may remain optional and separate from the review composer.
