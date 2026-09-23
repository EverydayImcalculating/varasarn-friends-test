# 13: Timetable conflict warnings and section replacement

**What to build:** A user can compare meeting times before changing a timetable, receive a clear overlap warning, and replace a selected section without leaving two sections of one course in the plan.

Blocked by: 12 Private account-synced timetable

Status: ready-for-agent

- [x] The timetable warns when meeting intervals overlap on the same day and explains which selected offerings conflict; end times are exclusive, so touching end/start times are not conflicts.
- [x] The same overlap result is used during preview and save; the user can deliberately confirm a warned selection, but invalid or missing intervals cannot bypass the selection rule.
- [x] A user can replace the selected offering of a course in one action; at most one offering of that course remains selected, even under repeated requests.
- [ ] Pure calculation tests cover equal, touching, contained, cross-day, and invalid intervals; browser tests cover warnings and replacement.

## Comments

### 2026-09-23 — Conflict preview and atomic replacement wired to the client

Before saving, the client obtains the approved offering meetings, compares them with account-scoped selections using the shared interval predicate, names conflicting course codes, and requires deliberate confirmation. Adjacent end/start intervals do not conflict. Missing or invalid meeting data is rejected by the approved-only meeting projection and by the selection RPC.

When the same course is already selected, the client calls the deployed `replace_my_timetable_offering` RPC, which deletes that account’s previous selections for the course and inserts the replacement in one server-side operation. Pure overlap tests currently cover touching, same-day overlap, and cross-day behavior; more cases and browser acceptance remain.
