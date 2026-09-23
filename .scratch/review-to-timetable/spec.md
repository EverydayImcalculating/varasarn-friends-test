# Add a class to the personal timetable from a review

Status: needs-info

## Problem Statement

The original course dialog let a signed-in student add the class shown beside a review to their personal timetable, then immediately view the timetable. The rebuilt dialog shows reviews with student-reported class details and has an add button elsewhere for approved offerings, but a reader cannot add from the review they are looking at. The two kinds of class detail have different trust levels: review details are historical student reports, while the account timetable accepts only approved offerings with valid meetings.

## Solution

Restore the original review-to-timetable journey in the course dialog. When a visible review identifies exactly one approved offering for the same course, academic year, semester, and normalized section, show an “เพิ่มลงตาราง” action beside that review's class details. Identify the approved offering clearly and use its official meeting times for the selection. On activation, check the signed-in user's current timetable, explain any same-course replacement or time conflict, save only after the relevant confirmation, then offer to open the personal timetable. If the review cannot identify one eligible approved offering, explain why it cannot be added and keep the review readable. The separate approved-offering controls continue to work.

## User Stories

1. As a signed-in reader, I want to add a class while reading its review, so that I can plan without searching for the section again.
2. As a signed-in reader, I want the course, year, semester, and section shown at the action, so that I know which class I am choosing.
3. As a signed-in reader, I want the official meeting day and times shown before saving, so that a student's historical report is not mistaken for the current schedule.
4. As a signed-in reader, I want a review with a unique matching approved offering to expose the add action, so that the button has an eligible target.
5. As a signed-in reader, I want reviews without a matching eligible offering to remain readable with a clear unavailable state, so that I understand why I cannot add that class.
6. As a signed-in reader, I want ambiguous matches to require a deliberate choice through the approved-offering controls, so that an offering is never guessed from a review.
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
- Match a visible review to the current approved-offering list by the dialog's course plus exact academic year and semester and normalized section. Only a unique approved offering with valid official meeting intervals is eligible. If several offerings match, do not choose one automatically.
- Use the approved offering ID with the existing account-scoped timetable operations. Never save the review ID, reported teacher, reported day/time, or author as an official timetable selection. Label reported and official details distinctly if they differ.
- Recheck offering eligibility and the current account timetable when the action is pressed. Warn before replacing another section of the course or accepting an overlap. Use the existing atomic replacement operation for same-course changes. Keep the server's eligibility and account-scope checks authoritative if data changes after the dialog opened.
- After a successful write, reload the timetable and show an acknowledgement with an option to open it, matching the original confirm-and-view flow. Canceling the view prompt leaves the user in the course dialog with the saved selection visible.
- Keep the original visual language in this existing interface: purple modal header, white review card, green timetable action, and colored timetable grid. Make the action and state usable with a keyboard and on narrow screens.
- Treat the review's creation date as optional display data; malformed or missing dates must never render “Invalid Date” or block the timetable action.
- No new private-schema exposure or database table is needed; use the existing approved-offering and self-scoped timetable APIs unless implementation reveals a concrete gap.

## Testing Decisions

- Test at the signed-in course-dialog-to-timetable seam: load a review and an approved offering for the same course/year/term/section, activate its review action, verify the selected offering appears after an account timetable read and in the grid. Use the existing Vue app tests and timetable service tests as prior art.
- In the same seam, cover no match, ambiguous match, missing meetings, already selected, replacement cancellation/confirmation, overlap cancellation/confirmation, API failure, and the post-save view prompt. Assert visible behavior and calls to the public account-scoped operations, not internal helper details.
- Verify a review with reported details cannot create an offering or become a selection by itself. Verify changed/withdrawn approval between render and click fails safely.
- Run the production build and meaningful automated tests. Do a signed-in browser acceptance pass on the deployed test site using the original screenshots as the visual and interaction reference, including a narrow viewport.

## Out of Scope

- Adding an unapproved or missing offering directly from student-reported review details.
- Changing the review submission or official-offering approval rules.
- Importing old browser timetables; that is covered by the separate legacy timetable import spec.
- Redesigning the course dialog or personal timetable.

## Further Notes

- The supplied original-site screenshots show the green “เพิ่มลงตาราง” action beside the review's class details, a replace-section confirmation, a success prompt offering to view the timetable, and the new class in the colored grid. This is the acceptance reference for the flow.
- The current Vue dialog already offers “เพิ่มลงตาราง” for approved offerings, but review cards only display student-reported details. Reviews can exist without a matching approved offering. The review action therefore needs an eligibility state, not a direct conversion from reported schedule data.

## Comments

### 2026-09-23 — Local implementation complete; deployed browser acceptance pending

The review card now shows the reported class context beside the approved offering's official meeting details and a green “เพิ่มลงตาราง” action when exactly one approved offering matches the course, year, term, and normalized section. Missing, ambiguous, or meetingless matches remain readable without an add action. The app rechecks the approved offering and account timetable when clicked, confirms replacement or time conflicts, uses the existing self-scoped add/replace operation, refreshes the timetable, and offers to open it after a successful review-initiated save. The original approved-offering action remains available. Malformed review dates are omitted instead of showing “Invalid Date”.

The signed-in Vue flow test covers add and view, unavailable and ambiguous matches, official versus reported time, meetingless offerings, already-selected state, changed approval or period, replacement cancellation and confirmation, overlap cancellation, declining the view prompt, and save failure. `npm test -- --run` passed 66 tests in 12 files; `npm run build` and `git diff --check` passed. A real signed-in browser pass on the deployed site, including narrow-screen visual comparison with the supplied screenshots, remains open.
