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
