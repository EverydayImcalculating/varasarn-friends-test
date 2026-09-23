# 07: Student offering proposals and approval

**What to build:** A signed-in student can propose a missing section for an existing course, track its status, and use it only after an administrator approves it.

Blocked by: 05 Merge duplicate courses; 06 Approved offerings and academic periods

Status: needs-info

- [ ] A signed-in user can submit an offering proposal for an existing active course and see their own pending, approved, or rejected proposals.
- [ ] Proposing a missing offering is a separate, clearly labeled flow from writing a review, with visible validation and status feedback.
- [ ] The administrator dashboard lists pending proposals and permits approval or rejection with an auditable actor and time.
- [ ] Approval checks for an equivalent approved offering and resolves a duplicate without creating another canonical section; approval and status update are atomic.
- [ ] Pending and rejected proposals do not appear as approved offerings and cannot receive new reviews or timetable selections.
- [ ] Ordinary users cannot approve, reject, or inspect another user's private proposal data through direct requests; browser and data-interface tests cover the workflow.
- [ ] Course merge preserves proposal references and the proposer's status view.

## Comments

### 2026-09-23 — Self-scoped proposal client and admin projection completed

The student client validates and normalizes proposal fields before using only `create_offering_proposal` and `list_my_offering_proposals`. The Vue component now uses that typed service rather than direct RPC calls. Administrators have a separate pending-proposal projection and resolution client, backed by the deployed atomic resolution function. Service tests cover the student request shape and self-scoped read.

The remaining work is to render the student status and administrator approval controls in the protected browser flows, then record cross-account acceptance evidence.
