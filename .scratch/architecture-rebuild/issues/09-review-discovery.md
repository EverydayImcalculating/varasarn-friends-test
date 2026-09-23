# 09: Review discovery and filtering

**What to build:** Signed-in users can evaluate a course from anonymous reviews containing student-reported class details and narrow results by rating and academic period.

Blocked by: 06 Approved offerings and academic periods

Status: needs-info

- [ ] Course screens show visible reviews with rating, text, date, semester, academic year, section, and clearly labeled student-reported teacher and time context.
- [ ] Readers can filter by overall rating, semester, and academic year without exposing author identity or private revision data in any data response.
- [ ] Review filters and student-reported class context remain readable and operable on narrow mobile screens; the old cramped three-column mobile filter layout is not repeated.
- [ ] Review submission works for an approved course without an official offering and permits distinct reviews for different terms or sections, while enforcing one review per authenticated user per course, academic year, term, and normalized section.
- [ ] Reviews on archived courses remain readable; student-reported class details never become official timetable offerings merely by being reviewed.
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
