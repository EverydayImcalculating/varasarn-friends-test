# 16: Final migration and production cutover

**What to build:** The project owner can replace the old Vercel application only after the final spreadsheet data and all critical user and administrator workflows pass a documented release gate.

Blocked by: 04 Course import and reconciliation; 05 Merge duplicate courses; 07 Student offering proposals and approval; 08 Bulk offering import; 09 Review discovery and filtering; 10 Author review lifecycle; 11 Review moderation and audit; 13 Timetable conflict warnings and section replacement; 14 Legacy review migration; 15 Repeatable deployment and recovery

Status: needs-info

- [ ] A fresh final export is taken from the live spreadsheet; its course and review counts and relationships reconcile with the new database before traffic changes.
- [ ] The old data is retained in a recoverable export, and unverified legacy schedules remain unavailable for new timetable selections.
- [ ] Release checks pass for Google sign-in, protected reads, anonymous review projection, ownership/role permissions, course and offering administration, proposals, review lifecycle/moderation, and private account-synced timetable behavior.
- [ ] A production-like build and restore exercise pass, with data-permission tests treated as a release blocker.
- [ ] The new Vercel deployment is activated only after the checks pass; the cutover record captures export counts, checks, deployment target, and the recovery decision path.

## Comments

### 2026-09-23 — Cutover evidence record added

`docs/cutover-record.md` provides the owner-facing record for final export reconciliation, restore branch, two-account checks, deployed sign-in and idle-resume validation, deployment target, and rollback path. `release:gate` runs the automated test/build/config checks then deliberately remains nonzero until this owner-controlled evidence is filled in. No production cutover has been activated.
