# 05: Merge duplicate courses

**What to build:** An administrator can consolidate duplicate course records without losing their offerings, reviews, or audit history.

Blocked by: 03 Course and category management

Status: ready-for-agent

- [ ] The dashboard previews the source and retained courses and the references that will move before an administrator confirms a merge.
- [ ] A merge atomically transfers existing dependent references, including offerings and reviews, keeps the retained course code unique, and leaves no orphaned record.
- [ ] The source course is no longer offered as a separate active catalog item; historical context remains traceable and the action records actor, time, and source/target IDs.
- [ ] Invalid, conflicting, or unauthorized merge attempts leave all records unchanged; tests cover populated courses and direct-request denial.
