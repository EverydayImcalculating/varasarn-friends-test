# 07: Student offering proposals and approval

**What to build:** A signed-in student can propose a missing section for an existing course, track its status, and use it only after an administrator approves it.

Blocked by: 05 Merge duplicate courses; 06 Approved offerings and academic periods

Status: ready-for-agent

- [ ] A signed-in user can submit an offering proposal for an existing active course and see their own pending, approved, or rejected proposals.
- [ ] Proposing a missing offering is a separate, clearly labeled flow from writing a review, with visible validation and status feedback.
- [ ] The administrator dashboard lists pending proposals and permits approval or rejection with an auditable actor and time.
- [ ] Approval checks for an equivalent approved offering and resolves a duplicate without creating another canonical section; approval and status update are atomic.
- [ ] Pending and rejected proposals do not appear as approved offerings and cannot receive new reviews or timetable selections.
- [ ] Ordinary users cannot approve, reject, or inspect another user's private proposal data through direct requests; browser and data-interface tests cover the workflow.
- [ ] Course merge preserves proposal references and the proposer's status view.
