# 14: Legacy review migration

**What to build:** The project owner can import historical spreadsheet reviews and have readers see them anonymously without falsely assigning authorship or trusting unverified schedule details.

Blocked by: 04 Course import and reconciliation; 06 Approved offerings and academic periods

Status: needs-info

- [ ] A repeatable dry run and confirmed import normalize legacy rating, date, course, section, semester, and year values and report source counts, duplicates, and unmatched relationships.
- [ ] Imported reviews retain text, rating, date, and historical course/section context, but no account owns them and stored unverified email values are discarded rather than matched to Google users.
- [ ] Historical schedule details remain explicitly unverified and cannot become selectable current offerings until an administrator approves them.
- [ ] Signed-in readers see imported reviews in the anonymous projection; no user can edit, withdraw, or claim an ownerless legacy review through ordinary controls.
- [ ] Tests cover the repository's four-review snapshot and a fresh-export fixture, including count reconciliation, unmatched references, and absence of legacy emails from target data.
