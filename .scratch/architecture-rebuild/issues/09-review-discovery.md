# 09: Review discovery and filtering

**What to build:** Signed-in users can evaluate a course from anonymous reviews linked to approved offerings and narrow results by rating and academic period.

Blocked by: 06 Approved offerings and academic periods

Status: needs-info

- [ ] Course and offering screens show visible reviews with rating, text, date, semester, academic year, section, and maintained offering context.
- [ ] Readers can filter by overall rating, semester, and academic year without exposing author identity or private revision data in any data response.
- [ ] Review filters and offering context remain readable and operable on narrow mobile screens; the old cramped three-column mobile filter layout is not repeated.
- [ ] Review submission works for any approved offering and permits distinct reviews of different offerings of one course, but still enforces one review per authenticated user per offering.
- [ ] Reviews on archived courses remain readable; pending or rejected offerings cannot be review targets.
- [ ] Data-interface and browser tests cover filtering, cross-offering reviews, anonymous projection, and denied author-data access.

## Comments

### 2026-09-23 — Anonymous review filters rendered

Course detail now exposes rating, semester, and academic-year filters through the typed `list_visible_reviews` client. Returned cards display maintained offering context only when the anonymous projection provides it, without author fields. The controls use responsive Bootstrap columns consistent with the existing course screen. `npm test -- --run` passed (22 tests) and `npm run build` passed; live data-interface and browser acceptance remain required.
