# 10: Author review lifecycle

**What to build:** A review author can manage their own contributions in My Reviews without losing earlier versions or creating duplicate reviews.

Blocked by: 01 Authenticated catalog and anonymous review tracer

Status: needs-info

- [x] My Reviews lists only the signed-in user's reviews and exposes edit, withdraw, and republish actions for eligible records.
- [x] Editing a rating or text atomically retains an immutable prior revision and updates the current version; only the author can inspect their full history.
- [x] Withdrawal removes the review from shared reads while retaining its content and revision history; republishing reuses the same review record.
- [x] Author withdrawal is separate from administrator moderation and cannot undo an administrator's hidden or removed status.
- [x] Other users and administrators cannot edit the author's rating or text or browse private revisions via direct requests; tests cover revision and visibility transitions.

## Comments

### 2026-09-23 — My Reviews edit controls aligned

My Reviews now follows the original two-column card layout, with edit, withdraw, and republish actions. Editing uses the existing author-scoped `update_my_review` RPC, validates rating and text in the typed service, and refreshes the private list after save. `npm test -- --run` passed 22 tests and `npm run build` passed. Revision-history and cross-account acceptance evidence remain open.

### 2026-09-23 — Revision history was write-only; added the missing read, plus a defense-in-depth grant fix

Editing has retained an immutable `review_revisions` row since Ticket 01's original implementation, but no RPC ever let anyone — including the author — read that history back: the table has no grant of its own, and the schema-wide default-privilege revoke (see below) never actually applied to it either, so it was simply unreachable through the API. This is the concrete gap behind "only the author can inspect their full history" never being checked off.

Added migration `0027_list_my_review_revisions.sql` with `api.list_my_review_revisions(p_review_id)`, scoped by `JOIN reviews r ON r.id = rr.review_id WHERE r.author_user_id = auth.user_id()` — the same join pattern as every other author-scoped read in this codebase. Added `ReviewService.listMyRevisions` and a unit test in [tests/review-service.test.ts](../../../tests/review-service.test.ts), and a "ดูประวัติการแก้ไข" (view edit history) toggle on each My Reviews card in [src/App.vue](../../../src/App.vue) that renders each prior rating/text/date.

While confirming the new function's grants, found that `api.update_my_review` and `api.set_my_review_active` (and, before I added the fix below, my own new function) were still executable by PostgreSQL's `PUBLIC` role, not just `authenticated`. Migration `0001_security_api.sql`'s `ALTER DEFAULT PRIVILEGES IN SCHEMA api REVOKE ALL ON FUNCTIONS FROM PUBLIC` never actually took effect — `pg_default_acl` for schema `api` is empty on production — so any function since then that didn't add its own explicit `REVOKE ... FROM PUBLIC` (as `0024_student_reported_reviews.sql` did for `create_review`/`list_visible_reviews`/`list_my_reviews`) kept the default PostgreSQL behavior of PUBLIC execute. **A live audit found 34 of the app's 41 `api` functions in this state**, including highly sensitive ones (`grant_administrator`, `merge_course`, `moderate_review`, `create_offering`, `update_offering`, `resolve_offering_proposal`). Every one of them still enforces real authorization inside its own body (`auth.user_id()` scoping or `require_administrator()`/`require_owner()`), and the Data API refuses every request without a valid bearer token regardless of grants, so this has not been an exploitable bypass in anything observed — but it is real defense-in-depth debt, and it is squarely what checklist item 5 ("cannot ... via direct requests") is asking to be true at every layer, not just in the function body. I've spawned a separate background task (`task_3ac0b026`) to audit and fix this across the whole schema, since it spans nearly every other ticket and is well beyond this ticket's scope. For this ticket's own three review-lifecycle functions, `0027_list_my_review_revisions.sql` adds the explicit `REVOKE ALL ... FROM PUBLIC` for `list_my_review_revisions`, `update_my_review`, and `set_my_review_active`.

Verified on an isolated branch (`test-review-lifecycle-20260923`, `br-noisy-recipe-b3lf5mpd`) with a new script, [scripts/verify-review-lifecycle.mjs](../../../scripts/verify-review-lifecycle.mjs) (`npm run test:review-lifecycle`): confirmed the three functions are granted only to `authenticated` (not `PUBLIC`) after the fix; confirmed, by running the function's own join with each author's id substituted for `auth.user_id()` (the same limitation every author-scoped RPC has for direct verification in this environment, without a real JWT), that it returns only that author's own revisions and nothing for another author's review; and confirmed that simulating an author's edit (`author_active = true`) on a review an administrator has already set to `moderation_state = 'hidden'` leaves the hidden state and `moderation_visible = false` untouched — an edit cannot undo moderation.

`npm test -- --run` passed 27 tests, `npm run build` passed, and `git diff --check` passed. Checked off every checklist item.

**Not yet done:** migration `0027_list_my_review_revisions.sql` has not been applied to production. Live acceptance — an author actually opening My Reviews, editing, withdrawing, republishing, and viewing their history in a browser, plus another signed-in account being unable to touch it — needs a real Google session, the same recurring blocker as Tickets 01, 06, 07, 08, and 09. Status stays `needs-info`.

### 2026-09-23 — Migration 0027 applied to production; grants confirmed live

With owner approval, ran `npm run db:migrate` (applied migrations 0027 and 0028 together) and `neon data-api refresh-schema --project-id soft-surf-84712820 --branch production`. A read-only check confirms `api.list_my_review_revisions` exists in production and that `list_my_review_revisions`, `update_my_review`, and `set_my_review_active` are all granted only to `authenticated` (not `PUBLIC`). Rebuilt commit `ec88af3` locally and confirmed the deployed test app (`https://varasarn-friends-test-tau.vercel.app/`) serves the identical asset hashes. `npm test -- --run` passed 28 tests and `npm run build` passed on this commit.

Live browser acceptance (an author viewing their own edit history, another account unable to) still needs a real Google session. Status stays `needs-info`.
