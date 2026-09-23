# 13: Timetable conflict warnings and section replacement

**What to build:** A user can compare meeting times before changing a timetable, receive a clear overlap warning, and replace a selected section without leaving two sections of one course in the plan.

Blocked by: 12 Private account-synced timetable

Status: needs-info

- [x] The timetable warns when meeting intervals overlap on the same day and explains which selected offerings conflict; end times are exclusive, so touching end/start times are not conflicts.
- [x] The same overlap result is used during preview and save; the user can deliberately confirm a warned selection, but invalid or missing intervals cannot bypass the selection rule.
- [x] A user can replace the selected offering of a course in one action; at most one offering of that course remains selected, even under repeated requests.
- [ ] Pure calculation tests cover equal, touching, contained, cross-day, and invalid intervals; browser tests cover warnings and replacement.

## Comments

### 2026-09-23 — Conflict preview and atomic replacement wired to the client

Before saving, the client obtains the approved offering meetings, compares them with account-scoped selections using the shared interval predicate, names conflicting course codes, and requires deliberate confirmation. Adjacent end/start intervals do not conflict. Missing or invalid meeting data is rejected by the approved-only meeting projection and by the selection RPC.

When the same course is already selected, the client calls the deployed `replace_my_timetable_offering` RPC, which deletes that account’s previous selections for the course and inserts the replacement in one server-side operation. Pure overlap tests currently cover touching, same-day overlap, and cross-day behavior; more cases and browser acceptance remain.

### 2026-09-23 — Found and fixed a real selection-rule bypass in `replace_my_timetable_offering`; pure calculation tests confirmed complete

**Real behavioral gap found, not just a grant gap.** `add_my_timetable_offering` (migration `0013`) rejects a pending, rejected, or meetingless offering, or one under an archived course — but `replace_my_timetable_offering` (migration `0014`) only ever checked `offerings.status='approved'`, never the course's status or whether the offering had any meeting rows. A user could bypass item 2's "invalid or missing intervals cannot bypass the selection rule" simply by using replace instead of add whenever they already had another section of the same course selected. Migration `0030_fix_replace_timetable_offering_validation.sql` makes `replace_my_timetable_offering` require the same `offerings.status='approved' AND courses.status='approved' AND EXISTS(offering_meetings)` condition as add, keeping its existing atomic delete-then-insert behavior and error message (`approved offering with meeting time required`) unchanged otherwise.

Pure calculation tests were already complete as of an earlier session (`tests/timetable.test.ts`, commit `c29c0d1`): touching (non-conflict), contained, equal, cross-day, and invalid/malformed/reversed intervals are all covered — the first half of item 4 is done.

Verified on an isolated branch (`test-timetable-20260923`, `br-ancient-leaf-b33rjgzr`, migrated through `0030`) by extending `scripts/verify-timetable.mjs` (`npm run test:timetable`) with two new checks, run in the same rolled-back transaction as the rest of the script:
- `replace_my_timetable_offering` now rejects a pending, rejected, archived-course, and meetingless offering with the same message as `add_my_timetable_offering`, verifiable without a real session because the rejection fires before the identity-scoped write.
- A valid offering clears replace's validation and reaches the identity-scoped insert, failing only on the same `NOT NULL user_id` constraint `add_my_timetable_offering` fails on without a real signed-in identity — confirming the fix doesn't change replace's behavior for a legitimately valid offering.

All 9 checks in `verify-timetable.mjs` passed, including the pre-existing isolation, merge-preservation, and grant checks (now also covering `replace_my_timetable_offering` and `list_approved_offering_meetings` by name). `npm test -- --run` passed 30 tests, `npm run build` passed, `git diff --check` passed.

**Not yet applied to production** — migration `0030` exists locally and is verified on the isolated branch only. Item 4's browser-acceptance half (warnings and replacement exercised in a real browser) still needs a real Google session, the same blocker as every other open ticket. Status stays `needs-info`.

### 2026-09-23 — Migration 0030 applied to production; grants and live function body confirmed

The owner ran `npm run db:migrate` against production (`drizzle.__drizzle_migrations` row count went from 30 to 31) and `neon data-api refresh-schema --project-id soft-surf-84712820 --branch production`. A read-only check against production confirms `api.replace_my_timetable_offering`'s live body now requires `courses.status='approved'` and `EXISTS(offering_meetings)` alongside `offerings.status='approved'`, closing the bypass described above. All six timetable functions (`list_my_timetable`, `add_my_timetable_offering`, `remove_my_timetable_offering`, `clear_my_timetable`, `replace_my_timetable_offering`, `list_approved_offering_meetings`) are granted only to `authenticated` and `db_owner`, with no `PUBLIC` grant on any of them. The deployed app at `https://varasarn-friends-test-tau.vercel.app/` serves `assets/index-AamsPgHY.js` and `assets/index-yJJw95GY.css`, matching a local build of commit `27b9c82`.

Live browser acceptance (conflict warnings, deliberate confirmation, and section replacement exercised in a real browser) still needs a real Google session. Status stays `needs-info`.
