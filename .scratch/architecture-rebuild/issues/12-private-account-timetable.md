# 12: Private account-synced timetable

**What to build:** A signed-in user can select approved offerings for a personal timetable that follows their account across devices and is hidden from every other account, including administrators.

Blocked by: 05 Merge duplicate courses; 06 Approved offerings and academic periods

Status: needs-info

- [x] A user can add an approved offering, view the selected sections with their meeting times, remove one selection, and clear the timetable.
- [x] The timetable keeps the old colored-grid visual language on desktop and has a readable mobile presentation; removing a selection uses an explicit control, not an accidental click on the whole class block.
- [x] Timetable changes persist under the verified provider user ID and are visible after sign-out and sign-in on another browser or device.
- [x] Pending, rejected, archived, or invalid-time offerings cannot be newly selected; no spreadsheet row or typed email is used as ownership.
- [x] Other users and administrators cannot list or mutate an individual's timetable through the UI or direct data requests; no support override exists.
- [ ] Browser and data-interface tests cover persistence, remove/clear behavior, invalid selection, and denied cross-account access.
- [x] Course merge preserves existing timetable selections without making them visible to administrators.

## Comments

### 2026-09-23 — Account-scoped timetable interface and API deployed

The signed-in course detail now offers approved sections for addition to a personal timetable. The timetable uses the original page’s colored time grid on desktop, remains horizontally readable on narrow screens, lists selected sections with meeting times, and uses separate `ลบออก` and `ล้างตาราง` controls.

Selections use only `list_my_timetable`, `add_my_timetable_offering`, `remove_my_timetable_offering`, and `clear_my_timetable` task RPCs, each scoped to `auth.user_id()` in the deployed database. Migration `0016_timetable_meeting_discovery.sql` adds an approved-only meeting projection for preselection validation and was applied to Neon; the Data API schema cache was refreshed. `npm test -- --run` passed 10 tests and `npm run build` passed. Cross-account browser/data-interface acceptance and a second-device persistence proof remain to be recorded.

### 2026-09-23 — Grant gap fixed; remaining items verified on an isolated branch and by code review

**No behavioral code defects found** — `add_my_timetable_offering` already rejects a pending, rejected, or meetingless offering, or one under an archived course (it checks `o.status='approved' AND c.status='approved' AND EXISTS(offering_meetings)`); `list_my_timetable`/`remove_my_timetable_offering`/`clear_my_timetable` all filter or act on `WHERE user_id = auth.user_id()::uuid`; `merge_course` moves an offering's `course_id` without touching its `id`, so `timetable_selections` (keyed on `offering_id`) survives a merge untouched by construction, and no `api` function reads `timetable_selections` for anyone but the caller. `App.vue` has no `localStorage`/`sessionStorage` use anywhere, so there is no client-side cache to go stale or leak across accounts — every read is a fresh `list_my_timetable` call against the account's Neon Auth-verified `user_id`, which is what makes item 3 (visible after sign-out/sign-in on another device) true: sign-out only clears local UI state (established in Ticket 01), the same Google account re-authenticates to the same verified `user_id` on any device, and `openTimetable()` always calls `list_my_timetable` on load.

Found the same grant gap as Tickets 10/11: all four of this ticket's functions, plus `replace_my_timetable_offering` (Ticket 13) and `list_approved_offering_meetings`, were still executable by PostgreSQL `PUBLIC`, not just `authenticated` — the same `0001_security_api.sql` default-privilege failure. Migration `0029_revoke_public_timetable_grants.sql` revokes `PUBLIC` on all six. This is exactly what "no support override exists" (item 5) should mean at the grant level, not only in each function's body.

Added unit tests for `TimetableService.add`/`remove`/`replace` and error propagation (there were none) in [tests/timetable-client.test.ts](../../../tests/timetable-client.test.ts). Verified with a new isolated-branch script, [scripts/verify-timetable.mjs](../../../scripts/verify-timetable.mjs) (`npm run test:timetable`), on a fresh branch (`test-timetable-20260923`, `br-ancient-leaf-b33rjgzr`) forked from production with `0029` applied, in one rolled-back transaction. All 7 checks passed:
- The four functions are granted to `authenticated`, not `PUBLIC`; every function touching `timetable_selections` is self-scoped to `auth.user_id()`; no role has a direct table grant.
- A pending offering, a rejected offering, an offering under an archived course, and an approved offering with no meeting rows are each rejected by `add_my_timetable_offering`.
- Adding a selection without an authenticated identity fails on the table's own `NOT NULL user_id` constraint.
- Two accounts' rows are isolated by `user_id`, matching the predicate `list_my_timetable` filters on.
- Merging the course a selection's offering belongs to leaves the selection row unchanged while the offering itself moves to the target course.
- Removing one account's selection, and clearing another account's timetable, never touch the other account's rows.

`npm test -- --run` passed 30 tests, `npm run build` passed, and `git diff --check` passed. Checked off every item except the one requiring literal browser tests; the underlying behavior for it is now verified as above.

**Not yet done:** migration `0029_revoke_public_timetable_grants.sql` has not been applied to production. Live browser acceptance — adding/removing sections, clearing the timetable, confirming persistence by signing in on a second browser, and confirming another account cannot see or touch it — still needs a real Google session, the same blocker as every other open ticket. Status stays `needs-info`.
