# 08: Bulk offering import

**What to build:** An administrator can load many offerings in one operation and inspect errors before the approved catalog changes.

Blocked by: 06 Approved offerings and academic periods

Status: needs-info

- [ ] The dashboard accepts a structured offering import, previews normalized course references, academic periods, sections, instructors, and meeting intervals, and reports row-level errors.
- [ ] Unknown or archived courses, invalid times, and duplicate active offerings are surfaced before confirmation; repeated import does not create duplicates.
- [ ] A confirmed import creates or updates only valid approved offerings under administrator authority and records an audit summary.
- [ ] Signed-in users see imported offerings on their courses; ordinary users cannot invoke the import through direct requests.
- [ ] Automated tests cover valid batches, partial invalid input, duplicate detection, and idempotent reruns.
