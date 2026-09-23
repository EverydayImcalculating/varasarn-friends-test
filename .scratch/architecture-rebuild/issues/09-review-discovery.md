# 09: Review discovery and filtering

**What to build:** Signed-in users can evaluate a course from anonymous reviews containing student-reported class details and narrow results by rating and academic period.

Blocked by: 06 Approved offerings and academic periods

Status: needs-info

- [x] Course screens show visible reviews with rating, text, date, semester, academic year, section, and clearly labeled student-reported teacher and time context.
- [x] Readers can filter by overall rating, semester, and academic year without exposing author identity or private revision data in any data response.
- [x] Review filters and student-reported class context remain readable and operable on narrow mobile screens; the old cramped three-column mobile filter layout is not repeated.
- [x] Review submission works for an approved course without an official offering and permits distinct reviews for different terms or sections, while enforcing one review per authenticated user per course, academic year, term, and normalized section.
- [x] Reviews on archived courses remain readable; student-reported class details never become official timetable offerings merely by being reviewed.
- [ ] Data-interface and browser tests cover filtering, cross-offering reviews, anonymous projection, and denied author-data access.

## Comments

### 2026-09-23 — Anonymous review filters rendered

Course detail now exposes rating, semester, and academic-year filters through the typed `list_visible_reviews` client. Returned cards display maintained offering context only when the anonymous projection provides it, without author fields. The controls use responsive Bootstrap columns consistent with the existing course screen. `npm test -- --run` passed (22 tests) and `npm run build` passed; live data-interface and browser acceptance remain required.

### 2026-09-23 — Review source changed by owner

The owner removed approval as a prerequisite for reviews. Review detail and filters must move from official offering references to student-reported course, academic year, term, and section context. Earlier implementation comments describe the old design and remain as history.

### 2026-09-23 — Course-scoped anonymous reviews implemented

The anonymous review RPC now reads by approved course and returns only rating, text, date, and student-reported class context. Rating, term, and academic-year filters run against that context. The review composer no longer needs an official offering and cards label the teacher and schedule as student-reported. Migration `0024_student_reported_reviews.sql` was applied to production and the Data API schema cache refreshed; an isolated Neon branch confirmed projected context and normalized duplicate rejection. `npm test` passed (23 tests), `npm run build` passed, and `git diff --check` passed. Narrow-screen and two-account browser acceptance remain open.

### 2026-09-23 — Deployed test app confirmed current; account-dependent acceptance still blocked

The public test deployment (`varasarn-friends-test-tau.vercel.app`) was confirmed to serve commit `ef6f116` exactly, by matching its served asset filenames against a local build of the same commit (see the matching Ticket 01 comment for detail). `npm test -- --run` (23 tests) and `npm run build` re-passed on HEAD. Static review of `api.list_visible_reviews` in `db/drizzle/0024_student_reported_reviews.sql` confirms the filtered projection exposes only rating, text, date, and student-reported section/semester/academic-year/instructor/time context, with no author identity, and is granted only to `authenticated` (revoked from `PUBLIC`).

**Blocker:** the remaining acceptance items — filtering, cross-offering reviews, and denied author-data access exercised through two real signed-in Google accounts, plus narrow-mobile browser acceptance of the filter controls — need a live authenticated session. No Google test-account credentials are available to this session, and this agent will not enter account credentials into a sign-in form. Status remains `needs-info` pending the owner (or someone the owner hands credentials to) running the two-account and narrow-mobile browser checks and recording results here.

### 2026-09-23 — Data-interface behavior verified end to end on an isolated branch; mobile layout confirmed by code

Live, unauthenticated checks against the production Data API confirm `rpc/list_visible_reviews`, and a `GET` on the raw `reviews` table directly, are both rejected the same way as every other protected endpoint (`HTTP 400`, missing credentials; malformed bearer token also rejected).

Wrote [scripts/verify-review-discovery.mjs](../../../scripts/verify-review-discovery.mjs) (`npm run test:review-discovery`), following the same isolated-branch pattern as Tickets 07/08's verification scripts. Ran it against a fresh branch (`test-review-discovery-20260923`, `br-long-forest-b3u006ay`) forked from current production (27 migrations), inside a single rolled-back transaction:
- A review with section `Sec1` and a duplicate attempt with section `sec 1` (same user/course/academic year/semester, differing only by case and spacing) was rejected by `reviews_author_course_class_unique`, while a different section for the same user/course was accepted as a separate review — cross-section reviews work, normalized duplicates don't.
- `list_visible_reviews` returned exactly the two author-active, moderation-visible reviews for the course, excluded one hidden-by-moderation and one withdrawn-by-author review, and every returned row's columns were exactly `id, rating, text, created_at, section, semester, academic_year, instructor_name, day_of_week, starts_at, ends_at` — no `author_user_id` or other identity field.
- The rating, semester, and academic-year filter arguments each correctly narrowed the result set, including a non-matching year returning zero rows.
- A review on an archived course was still returned by `list_visible_reviews` for that course.
- No row was ever inserted into `offerings` as a side effect of inserting reviews with class-detail columns.

All six checks passed. For the narrow-mobile filter layout: the original page's filters used `<div class="col-4">` for rating/semester/year (`git show 0b1b1c8^:index.html`), a fixed three-across grid at every width — the literal "cramped three-column mobile filter layout" this ticket says not to repeat. The rebuilt filters in `src/App.vue` use `class="col-sm-4"` with no bare `col`/`col-12`, and Bootstrap's own `.row > *` rule defaults every column to `width: 100%` until the `sm` breakpoint (≥576px) applies `.col-sm-4`'s 33% width — so on a phone-width viewport the three filters stack full-width instead of being squeezed three-across, and only become a 3-up row at tablet width and above.

`npm test -- --run` passed 25 tests, `npm run build` passed, and `git diff --check` passed (no application code changed — this ticket's items were already correctly implemented; what was missing was verification). Checked off every checklist item that's now verified: the review-detail content and labeling, the filters' anonymous-projection safety, the mobile layout, submission/cross-section/duplicate behavior, and archived-course readability. Left the browser half of the last item unchecked — the RPC-level and Data-API-level behavior is fully verified above, but exercising it through two real signed-in Google accounts still needs test-account credentials, which remain unavailable to this session (same blocker recorded on Tickets 01, 06, and 07). Status stays `needs-info` for that reason alone.
