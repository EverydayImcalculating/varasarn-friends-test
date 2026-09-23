# 11: Review moderation and audit

**What to build:** An administrator can find and moderate reviews while review authorship remains absent from ordinary moderation screens and authored content cannot be rewritten.

Blocked by: 02 Owner and administrator access

Status: needs-info

- [x] The administrator dashboard can search reviews and inspect visible, hidden, removed, and author-withdrawn states without routinely displaying author ID or email.
- [x] Administrators can hide, restore, or remove a review with a required reason; each transition records actor, reason, time, and prior/new state in an append-only audit record.
- [x] Hidden and removed reviews disappear from shared reads; restoring a withdrawn review does not make it public until its author republishes.
- [x] Administrators cannot change review rating or text, permanently erase a review through the normal dashboard, or read individual timetables.
- [x] Automated tests cover each state transition, reason validation, audit integrity, and denied ordinary-user and administrator actions.

## Comments

### 2026-09-23 — Moderation dashboard rendered

The administrator dashboard now filters reviews by moderation state, searches review text, and provides hide, restore, and remove actions. Each action requires the existing reason field and calls only the typed `moderate_review` Data API client. Cards intentionally show review text, state, and author-withdrawn status without author ID or email. `npm test -- --run` passed (22 tests) and `npm run build` passed. A deployed administrator acceptance pass and database permission/audit evidence remain required.

### 2026-09-23 — Moderation list was broken since 0012; audit trail was write-only

Probing every PL/pgSQL table-returning `api` function on an isolated branch found that `api.list_moderation_reviews` has failed on **every** call since `0012_review_moderation.sql` with `column reference "id" is ambiguous`. Its unqualified column names collide with its own `RETURNS TABLE` output names, and PL/pgSQL rejects that by default. So the moderation dashboard described in the previous comment rendered its controls but never loaded a single review. It was the only function with this defect (the other set-returning PL/pgSQL functions ran cleanly). Because `openDashboard()` loads sections one after another in one `try`, the failure also stopped the owner's role-management lists from loading (see Ticket 02). Nothing caught it because the existing tests mock the RPC client and never execute the SQL.

Separately, `moderate_review` has appended actor, reason, prior/new state, and time to `review_moderation_audit`, but nothing could read it back. An administrator could not see why or by whom a review was hidden, restored, or removed.

Migration `0028_list_review_moderation_audit.sql`:
- Redefines `list_moderation_reviews` with the same signature and behavior, every column qualified.
- Adds `api.list_review_moderation_audit(p_review_id)`: administrator-only, newest-first, returning prior/new state, reason, time, and the acting administrator's **name**. It never returns an email, an ID, or the review's author (the table doesn't store the author and the query doesn't join to it).
- Explicitly revokes `PUBLIC` execute on all three moderation functions (the schema-wide default revoke never took effect; see Ticket 10 and task `task_3ac0b026`).

Added `AdminService.listModerationAudit`, a unit test, and a "ประวัติการตรวจสอบ" toggle on each dashboard moderation card that lists every transition with time, actor, `prior → new`, and reason. The panel refreshes after a moderation action.

Verified with [scripts/verify-review-moderation.mjs](../../../scripts/verify-review-moderation.mjs) (`npm run test:review-moderation`) on a fresh branch forked from production with `0027` and `0028` applied through the migration runner (`test-review-moderation-20260923`, `br-royal-violet-b3uwxsxi`), in one rolled-back transaction. All 9 checks passed:
- All three RPCs are denied without an administrator identity, and are granted to `authenticated` but not `PUBLIC`.
- `review_moderation_audit` has no table grant to `PUBLIC`/`authenticated`/`anonymous`, `authenticated` has no `USAGE` on `app_private`, and no function in `api` or `app_private` updates or deletes audit rows, so it is append-only.
- No `api` function hard-deletes a review, and all 5 functions touching `timetable_selections` are scoped to `auth.user_id()`, so administrators have no timetable read.
- `list_moderation_reviews` now loads, filters by state, and shows author withdrawal with exactly `id, rating, text, author_active, moderation_state, created_at` (no author field).
- A blank reason and an unknown state are both rejected.
- `visible → hidden → removed → visible` removes the review from, then returns it to, `list_visible_reviews`. Rating and text never change, and each step appends exactly one audit row with the right prior/new state, a trimmed reason, and a time.
- Hiding then restoring an author-withdrawn review leaves `author_active = false` and keeps it out of shared reads until the author republishes.
- `list_review_moderation_audit` returns the full trail newest-first with the administrator's name, and neither the author's ID nor the administrator's email appears anywhere in the response.

Ticket 10's `scripts/verify-review-lifecycle.mjs` also re-passed on this branch, now with `0027` applied by the migration runner instead of by hand. `npm test -- --run` passed 28 tests, `npm run build` passed, and `git diff --check` passed. All checklist items are checked off.

**Not yet done:** `0027` and `0028` are not applied to production, so production still has the broken moderation list. A live administrator pass in a browser also still needs a signed-in Google session (same blocker as Tickets 01 and 06–10). Status stays `needs-info`.
