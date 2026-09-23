# 12: Private account-synced timetable

**What to build:** A signed-in user can select approved offerings for a personal timetable that follows their account across devices and is hidden from every other account, including administrators.

Blocked by: 05 Merge duplicate courses; 06 Approved offerings and academic periods

Status: needs-info

- [x] A user can add an approved offering, view the selected sections with their meeting times, remove one selection, and clear the timetable.
- [x] The timetable keeps the old colored-grid visual language on desktop and has a readable mobile presentation; removing a selection uses an explicit control, not an accidental click on the whole class block.
- [ ] Timetable changes persist under the verified provider user ID and are visible after sign-out and sign-in on another browser or device.
- [ ] Pending, rejected, archived, or invalid-time offerings cannot be newly selected; no spreadsheet row or typed email is used as ownership.
- [ ] Other users and administrators cannot list or mutate an individual's timetable through the UI or direct data requests; no support override exists.
- [ ] Browser and data-interface tests cover persistence, remove/clear behavior, invalid selection, and denied cross-account access.
- [ ] Course merge preserves existing timetable selections without making them visible to administrators.

## Comments

### 2026-09-23 — Account-scoped timetable interface and API deployed

The signed-in course detail now offers approved sections for addition to a personal timetable. The timetable uses the original page’s colored time grid on desktop, remains horizontally readable on narrow screens, lists selected sections with meeting times, and uses separate `ลบออก` and `ล้างตาราง` controls.

Selections use only `list_my_timetable`, `add_my_timetable_offering`, `remove_my_timetable_offering`, and `clear_my_timetable` task RPCs, each scoped to `auth.user_id()` in the deployed database. Migration `0016_timetable_meeting_discovery.sql` adds an approved-only meeting projection for preselection validation and was applied to Neon; the Data API schema cache was refreshed. `npm test -- --run` passed 10 tests and `npm run build` passed. Cross-account browser/data-interface acceptance and a second-device persistence proof remain to be recorded.
