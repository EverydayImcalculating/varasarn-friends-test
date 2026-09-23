# 13: Timetable conflict warnings and section replacement

**What to build:** A user can compare meeting times before changing a timetable, receive a clear overlap warning, and replace a selected section without leaving two sections of one course in the plan.

Blocked by: 12 Private account-synced timetable

Status: ready-for-agent

- [ ] The timetable warns when meeting intervals overlap on the same day and explains which selected offerings conflict; end times are exclusive, so touching end/start times are not conflicts.
- [ ] The same overlap result is used during preview and save; the user can deliberately confirm a warned selection, but invalid or missing intervals cannot bypass the selection rule.
- [ ] A user can replace the selected offering of a course in one action; at most one offering of that course remains selected, even under repeated requests.
- [ ] Pure calculation tests cover equal, touching, contained, cross-day, and invalid intervals; browser tests cover warnings and replacement.
