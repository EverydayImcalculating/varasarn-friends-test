# Varasarn Close Friends Architecture Rebuild

Status: ready-for-agent

## Problem Statement

Students use Varasarn Close Friends to discover courses, read and write reviews, and plan a timetable. The current application combines its interface and behavior in one HTML page, uses Google Apps Script to read and change spreadsheet rows, and keeps timetables only in each browser. Users enter an email address as their identity; the server does not verify it or enforce ownership before editing or deleting rows. Course offerings are embedded in reviews, so factual schedule information and student opinions cannot be maintained independently. Administrators need a safe, approachable way to manage courses and reviews without editing a live spreadsheet. The owner wants a maintainable rebuild that stays within free plans at roughly 200 total users and does not require manually resuming an idle database.

## Solution

Build a single Vue 3 and TypeScript application with Bootstrap 5 styling and BootstrapVueNext components, deployed on Vercel, with Neon PostgreSQL as the system of record, Neon Managed Better Auth for Google sign-in, and authenticated data access protected by database permissions. The sign-in, callback, and static application shell can be public, but course/review data and every protected action require sign-in. Students can browse approved courses, publish publicly anonymous reviews with their own class details without administrator approval, and keep a private timetable that follows their account across devices. Administrators use an in-app dashboard to maintain the catalog and official timetable offerings and moderate reviews without changing student-authored text. Import existing course and review data with validation and preserve the four legacy reviews without assigning their unverified email addresses to Google users.

## User Stories

1. As a visitor, I want to sign in with my Google account, so that I can access the application without a separate password.
2. As a signed-out visitor, I want a clear sign-in screen, so that I understand why course and review content is unavailable.
3. As a signed-in user, I want to sign out, so that a shared device no longer shows my account's private data.
4. As a signed-in user, I want my identity to be verified by Google rather than typed into a prompt, so that another person cannot act as me by entering my email address.
5. As a signed-in user, I want to browse the approved course catalog, so that I can find courses relevant to my studies.
6. As a signed-in user, I want to search by course code or name and filter by category, so that I can narrow the catalog quickly.
7. As a signed-in user, I want to see a course's official timetable offerings and visible reviews, so that I can evaluate the course and available sections.
8. As a signed-in user, I want to filter reviews by overall rating, semester, and academic year, so that I can find experiences relevant to me.
9. As a signed-in user, I want review authors to appear anonymous, so that students can share candid experiences without exposing their Google identity to readers.
10. As a signed-in user, I want to see a review's rating, text, and student-reported term, section, teacher, and meeting time, so that I understand the experience being described and know those details are unverified.
11. As a student, I want to submit one overall rating from 1 to 5 and written review text for an approved course, entering the class details I experienced, without waiting for an administrator to create an offering.
12. As a student, I want to review another section or term of the same course, so that distinct experiences remain separate.
13. As a student, I want to be prevented from creating a second review for the same course, academic year, term, and normalized section, so that my feedback is not counted twice.
14. As a review author, I want to edit my own rating and text, so that I can correct or update my account of the experience.
15. As a review author, I want the prior versions of my review retained, so that changes do not silently erase its history.
16. As a review author, I want to withdraw my review, so that it is no longer visible while its history remains available for integrity and moderation.
17. As a signed-in user, I want only my own reviews listed in My Reviews, so that I can manage my contributions.
18. As a signed-in user, I want to propose a missing official timetable offering for an existing course, so that an administrator can add it to the shared schedule catalog.
19. As a student proposer, I want to see whether my official offering proposal is pending, approved, or rejected; review submission does not depend on that status.
20. As a signed-in user, I want student-reported review details to remain distinct from official timetable offerings, so that unverified details do not become shared schedule facts.
21. As a signed-in user, I want to add an approved offering to my timetable, so that I can plan my classes.
22. As a signed-in user, I want to be warned when a proposed timetable entry overlaps an existing entry, so that I do not create a conflicting plan.
23. As a signed-in user, I want to replace the selected section of a course, so that my timetable contains only one planned offering for that course.
24. As a signed-in user, I want to remove one offering or clear my timetable, so that my plan stays current.
25. As a signed-in user, I want my timetable to sync across devices, so that I do not lose it when changing browsers.
26. As a signed-in user, I want other users and administrators to be unable to browse my individual timetable, so that my study plan stays private.
27. As an administrator, I want to add, edit, archive, and merge courses through an in-app dashboard, so that the catalog remains accurate without editing spreadsheet rows.
28. As an administrator, I want to maintain course categories and available academic periods through the dashboard, so that routine catalog changes do not require code changes.
29. As an administrator, I want to add, edit, and bulk import offerings, so that official course information can be maintained efficiently.
30. As an administrator, I want to review and approve or reject student offering proposals, so that proposed details do not become canonical without review.
31. As an administrator, I want to correct an offering's factual details without changing linked review text, so that schedules and student opinions retain separate ownership.
32. As an administrator, I want to search and inspect reviews and their moderation status, so that I can maintain the platform responsibly.
33. As an administrator, I want to hide, restore, or remove a review with a required reason, so that harmful content can be kept out of view without rewriting the author's words.
34. As an administrator, I want moderation and catalog changes to record who acted and when, so that decisions can be audited.
35. As an administrator, I want review-author identity absent from ordinary review screens, so that moderation does not routinely expose private identities.
36. As a project owner, I want to grant and revoke administrator access using verified accounts, so that committee membership can change without sharing credentials.
37. As a project owner, I want existing courses and reviews imported with row-count and relationship checks, so that the rebuild preserves the available content.
38. As a signed-in reader, I want old reviews to remain visible without an attributed Google author, so that the system does not make an unverified ownership claim.
39. As a project owner, I want a repeatable deployment and recovery procedure, so that the application can be maintained with limited time.

## Implementation Decisions

- Restore the original review-to-timetable journey using an eligible approved offering rather than the review's self-reported schedule. See the [review-to-timetable spec](../review-to-timetable/spec.md) for the interaction and acceptance cases.

- Build one Vue 3, TypeScript, and Vite frontend using Bootstrap 5 CSS and selectively imported BootstrapVueNext components for interactive controls. Preserve the existing page's recognizable visual direction and custom styling; replace the old Bootstrap JavaScript and imperative DOM handlers with Vue-managed behavior rather than loading two competing controllers. Add routing only for the user and administrator screens; avoid a separate frontend application for administrators.
- Deploy the frontend on Vercel. Use Neon PostgreSQL as the authoritative datastore, Neon Managed Better Auth with Google as the only sign-in provider, and Neon's authenticated Data API. Disable alternative sign-in methods in the auth service rather than merely hiding their buttons. Prove the Vue SDK integration, Google callback, and browser cookie behavior in a deployed preview before treating this stack as settled. Do not keep Google Sheets or Apps Script in the live request path.
- Treat a successfully authenticated Google account as a signed-in user, not as proof of student enrollment. Student-domain verification, including any `@dome.tu.ac.th` restriction, is deferred. An email string supplied by the browser never establishes identity or permissions. Sign-out clears the local session and private displayed data; the first release does not promise immediate revocation of a previously copied, unexpired bearer token. Measure and document its actual validity window in the tracer.
- Use stable database identifiers for users, courses, offerings, reviews, proposals, and timetable entries. Do not use spreadsheet row positions as identifiers. Associate records with the validated Neon Auth user ID carried in the Neon token, not the raw Google provider subject or mutable email text.
- Model a course separately from its offerings. A course has a normalized unique code, names, category, and active or archived state. An offering identifies a course, academic year, semester, and section; it holds instructor information and one or more meeting times. The course code, academic year, semester, and normalized section distinguish active offerings. Factual corrections update the offering without editing reviews.
- Only administrators create or change courses. Archived courses remain readable with their historical reviews and are not available for new offerings. A merge transfers references to the retained course and records the action; duplicate codes are rejected.
- Administrators create or import official offerings for the shared timetable. A signed-in user may propose a missing official offering; approval is required before it appears in the shared timetable catalog. Review submission does not depend on an official offering or proposal approval. Only official approved offerings can be selected for the timetable.
- Store one review record per authenticated user per approved course, academic year, semester, and normalized section, with an integer overall rating from 1 through 5 and nonempty text. Accept the student's teacher and meeting details as self-reported context; validate their shape and time interval but do not present them as official schedule data. Enforce uniqueness across all review states. Another term or section of the same course permits a separate review. Editing creates an immutable prior revision and updates the current version atomically. An author may withdraw and later republish the same record; both transitions retain its history and never create a duplicate.
- Track author withdrawal separately from administrator moderation. A review is shown to other signed-in users only when it is author-active and moderation-visible. Shared review reads for signed-in users use an anonymous projection containing rating, text, self-reported class context, and dates; they never expose author IDs, email addresses, auth tokens, or private revision details. Enforce that projection through restricted database grants, exposed schemas, and task-oriented read interfaces: row-level security alone does not hide columns. An author can access only their own review history. Administrators can moderate content without gaining a normal browse view of author identity.
- Moderation states are visible, hidden, and removed. Hide and remove require a reason; restore records the reason and actor. Every transition is append-only in the audit record. Administrators cannot edit review ratings or text. Permanent erasure is reserved for privacy or legal handling by the technical owner and has no ordinary administrator action in the first release.
- Store timetable selections per authenticated user. Users can read and change only their own selections; administrators have no individual timetable view or support override in the first release. A course can have one selected offering per timetable. Conflicts are determined by overlap of meeting intervals on the same day, with end times treated as exclusive; invalid or missing meeting times cannot be added.
- Keep administrator membership in a protected application role assignment, separate from email-domain checks and Neon's built-in Auth Admin role; application administrators must not receive impersonation capability. Initialize the project owner from a verified account under owner control. Only the owner can grant or revoke administrator access through the dashboard; audit every role change. Enforce every permission in the data layer, including when requests bypass the Vue interface.
- Keep catalog, review, proposal, schedule, revision, and audit operations behind a small set of task-oriented interfaces. Use database constraints and access policies for invariant ownership and uniqueness; use trusted transactional operations for multi-record changes such as review revision, offering approval, moderation, and course merge.
- Migrate from a fresh final export of the production spreadsheet, not solely the workbook copy in the repo. Normalize course codes, academic periods, ratings, and time values; detect duplicates and unmatched references; reconcile record counts before cutover. The local workbook inspected during discovery contains 208 courses and four reviews and is only a snapshot.
- Import legacy reviews as anonymous, ownerless records. Discard their unverified stored email values rather than matching them to newly authenticated users. Preserve their text, rating, date, and historical course and section context. Mark imported schedule details as historical and unverified until an administrator confirms them; do not offer those details for new timetable selections before approval.
- Replace the old deployment only after the migrated catalog and review display, Google sign-in, permissions, administrator workflows, and timetable behavior pass acceptance checks. Keep a recoverable export of the old data and a documented way to restore the new database. Arrange automated data export or another recovery mechanism before production cutover so recovery does not depend on routine manual action.

## UI Design Direction

- Treat the current `index.html` as the visual reference, not as code to copy. Keep its purple gradient header, pale-purple page background, Kanit headings, Prompt body text, rounded white course cards, pill-shaped category filters, amber review stars, banner/about content, and colored timetable blocks. Carry these into Bootstrap 5 styles and shared design tokens; use BootstrapVueNext where Vue-managed dialogs, menus, forms, and tables are useful without replacing the page with another library's default design.
- Keep student navigation consistent on desktop and mobile: catalog, timetable, My Reviews, and account/sign-out remain reachable from every signed-in screen. Give administrators a clearly identified dashboard in the same visual language. The sign-in screen should use the same branding while keeping protected content hidden.
- Separate tasks that the old interface mixed together. The student catalog must not show an Add Course action; course management belongs in the administrator dashboard. A course detail shows official offerings and anonymous reviews as distinct information. Writing a review collects the student's term, academic year, section, teacher, day, and time as unverified experience details and works even if no official offering exists. Proposing a missing official timetable offering is a separate optional action with its own status. The review form must not imply that its entries change the official schedule.
- Polish responsive behavior without losing the original feel: readable course cards and review text, usable filter controls on narrow screens, visible labels and validation, and a timetable that retains the desktop grid but offers a usable mobile presentation rather than only a wide horizontal scroll. Removing timetable entries uses an explicit control rather than a click anywhere on a class block.
- Define loading, empty, error, and success states for catalog, reviews, proposals, and timetable. Keep keyboard focus visible, dialogs and menus operable by keyboard, and text/controls readable at common mobile sizes. Review anonymity applies to displayed content and data responses, including the administrator dashboard.
- Preserve the existing banner and contact affordance only after checking the external image and the conflicting Instagram destinations in the old page; do not silently choose one of the two handles or make a broken external dependency a core navigation path.

## Testing Decisions

- The primary test seam is the authenticated application-to-data flow against an isolated database branch. Verify behavior through the same read and write interfaces used by the frontend, using signed-out, ordinary-user, review-author, and administrator identities. Test externally visible results and denied actions rather than private implementation details.
- Begin with a thin end-to-end proof that Google sign-in succeeds in the deployed Vue preview, a signed-in user can read an approved course, a signed-out user cannot read protected data, and an authenticated user can write a review that another user cannot edit. Check session refresh and sign-out in common browsers, including Safari or restrictive-cookie conditions; if direct browser integration fails, decide explicitly whether a same-origin trusted backend is needed. This is the first build milestone approved during design.
- Test catalog search and filtering, official offering approval, duplicate prevention per author/course/year/term/section, review revisions, withdrawal, moderation, course archive and merge, private timetable access, and administrator role changes through their public interfaces.
- Test anonymous review projections directly: another user cannot retrieve author identity through direct tables, alternate exposed schemas, relationships, or task-oriented responses; an author can retrieve their own history; an administrator cannot browse individual timetables. Test with separate verified accounts and malformed, missing, and expired credentials.
- Test timetable conflict calculations at the pure calculation seam for equal, touching, contained, cross-day, and invalid intervals. Confirm the app gives the same result when saving the timetable.
- Test the importer with the workbook snapshot and a fresh export fixture. Verify record counts, source-to-target references, duplicate handling, time normalization, and that legacy email values do not become account ownership.
- Run browser acceptance checks for sign-in, course browsing, review submission/editing without an official offering, optional official offering proposal and approval, moderation, and account-synced timetable behavior. Include desktop and narrow-mobile layouts, keyboard navigation, visible status/error states, and confirmation that the rebuilt UI retains the current page's visual identity. The current repo has no automated test suite to reuse as prior art.
- Verify a production-like build and a restore exercise before cutover. Keep permissions tests in the release gate because the old app's email and row-index authorization failures are the highest-risk regressions.

## Out of Scope

- Student verification by university email domain or another enrollment source.
- Public access without Google sign-in, alternative sign-in providers, or native mobile applications.
- Student proposals for new courses or direct student edits to approved courses and official offerings. Self-reported review details do not modify either record.
- Administrator editing of student-authored review text or ratings.
- Individual timetable access for administrators, temporary support access, and identity-linked schedule analytics.
- Review moderation notifications, appeals, public author profiles, comments, and social interactions.
- Live synchronization with Google Sheets or continued use of Apps Script as the application backend.
- Permanent review erasure through the ordinary administrator dashboard.
- New rating dimensions beyond one overall 1-to-5 score.

## Further Notes

- The current application presents courses for the Faculty of Journalism and Mass Communication, including JC and BJM, and uses Thai academic years and semester labels. Preserve user-facing Thai terminology during migration.
- The existing workbook copy has 208 distinct course codes and four reviews. Its `Courses` sheet has no header row; its `Reviews` sheet has 12 columns. Final import counts must come from the production export taken at cutover.
- The current timetable is browser-local and keyed by a typed email address. There is no trustworthy way to move each browser's private timetable to a verified account automatically; the new account timetable starts empty unless the user re-adds offerings.
- Confirm that the project's actual operating and payment arrangement qualifies for Vercel Hobby before production launch. If it does not, retain the same built frontend and use an eligible static host.
- The stack choice reflects the requirement that an idle free database resume automatically. Idle wake-up does not protect against free-quota exhaustion; measure usage and check current quotas and service terms again at deployment time.
- The [Neon authentication and Data API feasibility research](research/neon-auth-data-api-feasibility.md) records the verified documentation, implementation risks, and live proof gates behind these clarifications.
