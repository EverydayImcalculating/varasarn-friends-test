# Add a class to the personal timetable from a review

Status: needs-info

## Problem Statement

The original course dialog let a signed-in student add the class shown beside a review to their personal timetable, then immediately view the timetable. The rebuilt dialog shows reviews with student-reported class details, but the add action disappears unless an administrator has separately created an approved offering with exactly matching course, year, term, and section. The user's AP164 review with a valid reported class schedule therefore has no add button. Review details are unverified student reports and must not silently become shared official offerings.

## Solution

Restore the original review-to-timetable journey in the course dialog. A visible review with a valid reported day and time has an “เพิ่มลงตาราง” action even without an approved offering. If its course, academic year, term, and normalized section uniquely match an approved offering with meetings, use that official offering and its official times. Otherwise, save a private, account-scoped snapshot of the review's reported class details in the student's timetable, clearly labeled as student-reported. Check the current timetable, confirm section replacement or time overlap, then offer to open the personal timetable. A personal selection never approves a shared offering or changes the review.

## User Stories

1. As a signed-in reader, I want to add a class while reading its review, so that I can plan without searching for the section again.
2. As a signed-in reader, I want the course, year, semester, and section shown at the action, so that I know which class I am choosing.
3. As a signed-in reader, I want official and student-reported meeting details labeled distinctly, so that I know the source of the timetable entry.
4. As a signed-in reader, I want a review with valid reported class details to offer an add action without administrative approval, so that I can follow the original flow.
5. As a signed-in reader, I want a unique matching approved offering to use official meeting times, so that verified schedule data takes precedence.
6. As a signed-in reader, I want an unmatched or ambiguous review to add only a private reported selection, so that the app neither guesses an offering nor shares unverified schedule data.
7. As a signed-in reader, I want to know if the course is already in my timetable and which section would be replaced, so that I can cancel or confirm the change.
8. As a signed-in reader, I want an overlap warning that names the conflicting courses, so that I can decide whether to continue.
9. As a signed-in reader, I want an already-selected section to show its current state rather than appear to add a duplicate.
10. As a signed-in reader, I want a successful add or replacement to offer a route to my personal timetable, so that I can check the result immediately.
11. As a signed-in reader, I want the newly selected class to appear in the existing colored timetable grid and remain there after a fresh account read, so that the action is reliable.
12. As a signed-in reader, I want save failures displayed in the dialog without losing my place or claiming success, so that I can retry.
13. As a student writing a review, I want my report to remain independent of the official offerings catalog, so that publishing a review does not silently create a selectable class.
14. As a user on desktop or mobile, I want the review action and its prompts to follow the original purple dialog, green add button, and timetable styling, so that the flow feels continuous with the original site.

## Implementation Decisions

- Place the action with the review's class details in the existing course dialog. Keep the existing approved-offering list and its action. The review card itself is not an offering and must not become one as a side effect of adding.
- Match a visible review to the current approved-offering list by the dialog's course plus exact academic year and semester and normalized section. Use the official offering only when the match is unique and has valid meetings. If there is no eligible match, use the review's valid reported meeting as a private personal timetable entry.
- Keep review-backed selections in a new private, account-scoped table with a snapshot of year, term, section, teacher, day, and times. Expose only task-specific self-scoped Data API operations to list, add, and remove them. No client role gets direct table access. Do not copy review author identity into the selection.
- List official and review-backed selections together in the timetable. Label reported entries and allow removing them. Clearing the timetable clears both kinds. Replacing a section updates the account's single-course choice across both kinds. Course merge preserves review-backed selections and resolves duplicate choices deterministically.
- Use the approved offering ID with existing account-scoped operations when there is a unique official match. Never save the review ID, reported teacher, reported day/time, or author as an official offering. Label reported and official details distinctly.
- Recheck offering eligibility and the current account timetable when the action is pressed. Warn before replacing another section of the course or accepting an overlap. Use the existing atomic replacement operation for same-course changes. Keep the server's eligibility and account-scope checks authoritative if data changes after the dialog opened.
- If approved meeting times change while the dialog is open, show the new official times and require another press after the reader has reviewed them.
- After a successful write, reload the timetable and show an acknowledgement with an option to open it, matching the original confirm-and-view flow. Canceling the view prompt leaves the user in the course dialog with the saved selection visible.
- Keep the original visual language in this existing interface: purple modal header, white review card, green timetable action, and colored timetable grid. Make the action and state usable with a keyboard and on narrow screens.
- Treat the review's creation date as optional display data; malformed or missing dates must never render “Invalid Date” or block the timetable action.
- Apply the additive private-table migration on an isolated Neon branch first, verify account isolation and direct-grant restrictions, then apply and refresh the production Data API before deploying the frontend that calls its new task RPCs.

## Testing Decisions

- Test at the signed-in course-dialog-to-timetable seam: load a review with no approved matching offering, activate its add action, and verify its private selection appears after an account timetable read and in the grid. Also test the unique official-match path. Use the existing Vue app tests and timetable service tests as prior art.
- In the same seam, cover valid and invalid reported meetings, ambiguous official matches, already selected, replacement cancellation/confirmation across both entry kinds, overlap cancellation/confirmation, API failure, removal, clearing, and the post-save view prompt. Assert visible behavior and calls to task-specific account-scoped operations, not internal helper details.
- Verify a reported selection does not create an offering or become visible in another account's timetable. Verify changed/withdrawn review or official approval before the click fails safely.
- Run the production build and meaningful automated tests. Do a signed-in browser acceptance pass on the deployed test site using the original screenshots as the visual and interaction reference, including a narrow viewport.

## Out of Scope

- Promoting student-reported review details into a shared official offering.
- Changing the review submission or official-offering approval rules.
- Importing old browser timetables; that is covered by the separate legacy timetable import spec.
- Redesigning the course dialog or personal timetable.

## Further Notes

- The supplied original-site screenshots show the green “เพิ่มลงตาราง” action beside the review's class details, a replace-section confirmation, a success prompt offering to view the timetable, and the new class in the colored grid. This is the acceptance reference for the flow.
- The current Vue dialog already offers “เพิ่มลงตาราง” for approved offerings. The private reported-selection path fills the gap when a review has valid schedule details but no eligible official match.

## Comments

### 2026-09-23 — Local implementation complete; deployed browser acceptance pending

The review card now shows the reported class context beside the approved offering's official meeting details and a green “เพิ่มลงตาราง” action when exactly one approved offering matches the course, year, term, and normalized section. Missing, ambiguous, or meetingless matches remain readable without an add action. The app rechecks the approved offering and account timetable when clicked, confirms replacement or time conflicts, uses the existing self-scoped add/replace operation, refreshes the timetable, and offers to open it after a successful review-initiated save. The original approved-offering action remains available. Malformed review dates are omitted instead of showing “Invalid Date”.

The signed-in Vue flow test covers add and view, unavailable and ambiguous matches, official versus reported time, meetingless offerings, already-selected state, changed approval or period, replacement cancellation and confirmation, overlap cancellation, declining the view prompt, and save failure. `npm test -- --run` passed 66 tests in 12 files; `npm run build` and `git diff --check` passed. A real signed-in browser pass on the deployed site, including narrow-screen visual comparison with the supplied screenshots, remains open.

### 2026-09-23 — Deployed bundle verified; browser acceptance remains open

Commit `e448242` is on `origin/main`. The test site at `https://varasarn-friends-test-tau.vercel.app/` serves `index-Dt-nCbNd.js` and `index-DVHZ35z7.css`; the downloaded assets' SHA-256 hashes exactly match the local production build. The browser connection available to this session reported no connected browsers, so it could not inspect an authenticated Google session or compare the review dialog and timetable visually. The user was asked to connect a browser or provide screenshots. Keep `Status: needs-info` until that acceptance pass is recorded.

### 2026-09-23 — Stale official meeting guard

A review-linked add now compares fresh approved meeting rows with the times displayed in the open dialog. If they changed, the card updates the official times and asks the reader to review them before pressing add again. The signed-in flow test covers that the first click makes no write and the second click can save after the updated time is visible.

`npm test -- --run` passed 67 tests in 12 files, `npm run build` passed, and `git diff --check` passed. The real signed-in browser acceptance remains open.

### 2026-09-23 — User screenshot corrected the acceptance rule

The deployed AP164 review for group `test`, term 1/2569, reported Wednesday 09:30–11:30, shows the unavailable message and no add button. That matches the first implementation's approved-only rule but fails the original add-from-review journey the user wants. The spec now requires a private review-backed timetable choice for valid reported class details when there is no unique approved offering. The shared official offerings catalog remains unchanged. A signed-in Vue regression test reproduces the missing button and fails before this correction is implemented.

### 2026-09-23 — Private add path implemented; signed-in deployment acceptance pending

Migration `0032_review_backed_timetable` adds account-scoped review selections and list/add/remove RPCs without granting browser roles direct table access. On the isolated Neon branch, rolled-back database checks passed for add, account isolation, no shared offering creation, replacement between official and reported choices, remove, clear, and hidden-review denial. The existing timetable branch checks also passed. The same migration is applied on the production branch (33 migrations), and the production Data API schema cache has been refreshed; the three new RPCs grant execution to `authenticated` and not `anonymous`.

The Vue dialog now shows the green add action for a valid reported time even when the official match is missing or ambiguous. It saves only to the signed-in account, labels the timetable entry “ข้อมูลจากรีวิว”, and supports removal. `npm test` passed 69 tests in 12 files, `npm run build` passed, and `git diff --check` passed. A fresh signed-in screenshot of the deployed AP164 review and resulting timetable is still needed for browser acceptance, so this spec remains `needs-info`.

Commit `1388280` was pushed to `origin/main`. The test URL `https://varasarn-friends-test-tau.vercel.app/` now serves `index-B__722L_.js`; its SHA-256 hash (`8526dae81467478846406459557b3f186e6890e9cefc75ce68ce3f77a6896891`) matches the local build. Browser acceptance should use the AP164 review shown in the user's screenshot, then check the success prompt and timetable entry after pressing its add button. A narrow-screen dialog check remains useful.

### 2026-09-23 — Review card restyled to match the original icon-based layout

The user compared a signed-in AP164 screenshot on the deployed test site against the legacy pre-rebuild interface (the parent of commit `0b1b1c8`, per [docs/original-ui-reference.md](../../docs/original-ui-reference.md)) and reported the review card's class-details row did not match: the rebuild rendered a plain, dot-separated text line (`ข้อมูลที่ผู้รีวิวระบุ · ...`) instead of the original's purple section badge, monitor-icon teacher name, and calendar-icon day/time row (e.g. `320001 อ.อ.ป็อบ`, then a calendar-icon day line and clock-icon time).

`320001` in the legacy screenshot is not a computed or normalized value — it is the free-text `section` a reviewer typed when submitting their review (the `offering.section` / `review.section` column has always been an unconstrained non-empty `text` field, confirmed against `db/drizzle/0022_normalized_offering_sections.sql` and `0032_review_backed_timetable.sql`). It happens to look like a real registrar section code because that's what the reviewer entered.

Restyled the review card's class-details block in [`src/App.vue`](../../src/App.vue) (the `review-schedule` block) to reuse the original's visual tokens: the section is now a `badge bg-purple` pill, the reviewer-reported teacher name gets a `bi-person-video3` icon, and the reviewer-reported day/time gets a `bi-calendar-event` icon, matching `git show 0b1b1c8^:index.html`'s `renderReviews()` structure. Added the missing `.badge.bg-purple` and `.schedule-line` rules to [`src/styles.css`](../../src/styles.css). The distinct "official offering" vs "reported, unverified" source paragraphs this rebuild added (per the spec's Implementation Decisions) are unchanged and kept beneath the restyled row — the correction was visual/structural only, not a change to the official/reported matching logic.

`npm test` passed 69 tests in 12 files (unchanged pass count — the existing `.review-card` text assertions, including the exact `dayNames`+time interpolation, were preserved verbatim) and `npm run build` passed with only the pre-existing >500 kB bundle-size warning. Verified the restyled markup against the compiled CSS in a throwaway static preview (not committed) rendered in the browser pane; not yet verified against the live, signed-in deployed site. This spec remains `needs-info` pending the original signed-in AP164 browser-acceptance screenshots requested above, now against the restyled card.

### 2026-09-23 — Section label de-emphasized

The owner asked whether the reported `section` value (e.g. `320001`) needed the solid purple badge treatment, given it is unverified free text a reviewer typed, not an official registrar code. The field itself stays required — it is `NOT NULL` since `0024_student_reported_reviews.sql` and backs review dedup, official-offering matching, and distinguishing multiple reviews of the same course — but a bold badge overstated its authority. Changed the section from a `badge bg-purple` pill to plain muted text (`กลุ่ม {{ review.section }}`) in [`src/App.vue`](../../src/App.vue), consistent with the "unverified, student-reported" framing used elsewhere on the card; the term badge, which is structured (not free-text) data, keeps its badge styling. Removed the now-unused `.badge.bg-purple` rule from [`src/styles.css`](../../src/styles.css). `npm test` (69/69) and `npm run build` passed; verified visually against the compiled CSS the same way as the prior entry.

### 2026-09-23 — Review card layout follow-up: term placement, day/time format, redundant text and heading removed

Four more owner-requested corrections to the review card in [`src/App.vue`](../../src/App.vue), checked with `SearchSkills`/`SuggestSkills` first — no installed frontend-design skill matched, so the redesign used the existing original-vs-rebuild comparison method from the two prior entries above rather than a dedicated skill:

- Moved the term badge (`เทอม 1/2569`) out of the `review-schedule` box and next to the star rating in the card's top row, matching `renderReviews()` in `git show 0b1b1c8^:index.html` where the term badge sits beside the stars, not inside the section/teacher box. It is no longer duplicated in the schedule box.
- Reformatted the reviewer-reported day/time line from `{{ dayNames[review.dayOfWeek] }} {{ start }}–{{ end }}` to the legacy format `วัน{{ dayNames[review.dayOfWeek] }} | ⏰ {{ start }} - {{ end }} น.`, matching the original's exact string structure (`วัน${day} | ⏰ ${start} - ${end} น.`).
- Removed the `ข้อมูลเวลาเรียนจากรีวิว · บันทึกเฉพาะตารางของคุณ` notice paragraph (the owner found it redundant given the day/time line above it already communicates the same thing). The "no usable schedule data" fallback paragraph is unchanged; the official-offering summary paragraph is unchanged.
- Removed the `อ.` prefix the template added before `review.instructorName`. The legacy site had the same auto-prefix, which visibly double-prefixed a reviewer's self-entered `อ.ป็อบ` into `อ.อ.ป็อบ` (seen in the owner's screenshot) — an original-site bug, not a fidelity target. The raw reported value now renders as-is.
- Removed the `รีวิวจากเพื่อน` (`h2`) heading. `git show 0b1b1c8^:index.html` has no equivalent second heading — the legacy page has only the single `💬 รีวิวและเวลาเรียน` heading covering the write-review action, offerings, and the review list together. `รีวิวจากเพื่อน` was added during the Vue rebuild without a spec requirement (confirmed by grepping `.scratch/` and `docs/` for the string) and read as redundant next to the write-review heading directly above it.

Updated the two test assertions in [`tests/review-to-timetable-app.test.ts`](../../tests/review-to-timetable-app.test.ts) that depended on the old day/time string and the removed notice text, replacing them with assertions on the new format and on the absence of the official-offering paragraph (still a reliable signal that the private/reported path, not the official-offering path, is in use). `npm test` passed 69 tests in 12 files, `npm run build` passed with only the pre-existing bundle-size warning. Verified visually against the compiled CSS in a throwaway, uncommitted static preview. Live signed-in browser acceptance remains open.

### 2026-09-24 — Course dialog no longer unmounts the catalog behind it

The owner reported that opening a course's review dialog made the course-list page "completely gone" instead of staying visible, dimmed, behind the dialog like a real modal. Root cause in [`src/App.vue`](../../src/App.vue): the catalog markup was wrapped in `<template v-else-if="!selected">` and the `course-review-modal` section was its `v-else` sibling, so Vue's conditional-rendering chain unmounted the entire catalog from the DOM whenever a course was open — there was nothing behind the dialog's translucent backdrop (`rgba(42,27,71,.48)`, already correctly styled as a `position: fixed; inset: 0` overlay in `src/styles.css`) for it to dim, only the top nav bar which sits outside that conditional. This is a structural regression from the legacy site's real Bootstrap modal (`git show 0b1b1c8^:index.html`), which is an overlay layered on top of a permanently-mounted page, not a page swap.

Fix: changed the catalog to `<template v-else>` (renders whenever not loading, regardless of `selected`) and the dialog to an independent `<section v-if="selected" class="course-review-modal">` so it now renders as an additional layer on top of the still-mounted catalog rather than replacing it. Verified with a throwaway (uncommitted) test mounting `App`, clicking a course card, and asserting `.course-card` is still present in the DOM alongside `.course-review-modal` — confirmed passing, then removed. `npm test` (69/69) and `npm run build` passed unchanged. Live signed-in browser acceptance remains open; loaded the `frontend-design:frontend-design` skill (now installed) to see if it should drive this pass, but that skill targets greenfield visual-identity design and doesn't apply to a structural DOM/CSS fix that must preserve the existing look exactly, so it was not used.

### 2026-09-24 — Dialog locks page scroll and closes on backdrop click

Follow-up to the previous entry: now that the catalog stays mounted behind the dialog, the owner asked for the two behaviors a real modal needs — the page behind stops scrolling while the dialog is open, and clicking the dimmed backdrop (outside the dialog card) closes it, matching the legacy Bootstrap modal's default behavior.

Added `watch(selected, ...)` in [`src/App.vue`](../../src/App.vue) that sets `document.body.style.overflow = 'hidden'` while a course is open and clears it when `selected` becomes `null`, covering every existing code path that opens or closes the dialog (there are several: the close button, the nav-brand link, `openTimetable()`, and the post-save "view timetable" flow) without needing to touch each one. Added `@click.self="selected = null"` on the `course-review-modal` section so a click lands on the dialog card is ignored (Vue's `.self` modifier only fires when the click originates on the element the listener is attached to, not a bubbled child), while a click on the surrounding backdrop closes the dialog.

Verified with a throwaway (uncommitted) test: `document.body.style.overflow` is `''` before opening, `'hidden'` while the dialog is open, a click on `.course-review-dialog` leaves it open, a click on `.course-review-modal` (the backdrop) closes it, and `overflow` resets to `''` after. `npm test` (69/69) and `npm run build` passed unchanged.

### 2026-09-24 — Styled confirmation dialog replaces the browser's native confirm() on add-to-timetable

The owner asked for the "เพิ่มลงตาราง" flow's confirmations to use the app's own styling instead of the browser's native `confirm()` popup, which cannot be styled and looks out of place next to the rest of the purple/white design. Both `addReviewToTimetable` and `addToTimetable` in [`src/App.vue`](../../src/App.vue) called `window.confirm()` twice each: once to warn about replacing an existing section or an overlapping course, once after a successful save to offer to open the timetable.

Added a small reusable confirm-dialog primitive instead of a real component, since the app doesn't have a component library seam for this yet: a `confirmDialog` ref holding `{ message, confirmLabel, cancelLabel, variant, resolve }`, a `showConfirm(message, confirmLabel, cancelLabel, variant)` helper that returns a `Promise<boolean>` and stores the resolver, and `resolveConfirm(value)` that settles it and clears the ref. All four `window.confirm()` call sites became `await showConfirm(...)`, unchanged in behavior (same messages, same branching), just no longer blocking synchronously and no longer browser-chrome. The dialog itself (`.confirm-overlay` / `.confirm-card` in the template, styled in `src/styles.css`) reuses the same white-card-on-dimmed-purple-backdrop treatment as the contact panel and course dialog, at `z-index: 1060` so it sits above the course dialog (`1040`) when triggered from inside it. It shows a warning-triangle icon for the replace/overlap case and a green check for the success case, and closes on backdrop click same as the course dialog.

Rewrote the confirm-dependent tests in [`tests/review-to-timetable-app.test.ts`](../../tests/review-to-timetable-app.test.ts): removed the `vi.stubGlobal('confirm', ...)` scaffolding and replaced it with reading `.confirm-message` text and clicking `.confirm-accept` / `.confirm-cancel` at the point each dialog appears, matching the same accept/decline branches the old stubs covered. `npm test` passed 69 tests in 12 files (same count, updated assertions), `npm run build` passed with only the pre-existing bundle-size warning. Verified the two dialog variants (warning icon / success icon) visually against the compiled CSS in a throwaway, uncommitted static preview. `clearTimetable()` and the admin `confirmMerge()` still use native `window.confirm()` — out of scope, since the request was specifically about the "เพิ่มลงตาราง" flow; worth revisiting for consistency if the owner wants it, but not done here. Live signed-in browser acceptance remains open.
