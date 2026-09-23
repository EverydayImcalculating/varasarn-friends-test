# 12: Private account-synced timetable

**What to build:** A signed-in user can select approved offerings for a personal timetable that follows their account across devices and is hidden from every other account, including administrators.

Blocked by: 05 Merge duplicate courses; 06 Approved offerings and academic periods

Status: ready-for-agent

- [ ] A user can add an approved offering, view the selected sections with their meeting times, remove one selection, and clear the timetable.
- [ ] The timetable keeps the old colored-grid visual language on desktop and has a readable mobile presentation; removing a selection uses an explicit control, not an accidental click on the whole class block.
- [ ] Timetable changes persist under the verified provider user ID and are visible after sign-out and sign-in on another browser or device.
- [ ] Pending, rejected, archived, or invalid-time offerings cannot be newly selected; no spreadsheet row or typed email is used as ownership.
- [ ] Other users and administrators cannot list or mutate an individual's timetable through the UI or direct data requests; no support override exists.
- [ ] Browser and data-interface tests cover persistence, remove/clear behavior, invalid selection, and denied cross-account access.
- [ ] Course merge preserves existing timetable selections without making them visible to administrators.
