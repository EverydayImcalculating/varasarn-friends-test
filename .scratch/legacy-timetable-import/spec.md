# Opt-in import of a browser-stored personal timetable

Status: needs-info

## Problem Statement

The old Varasarn Close Friends timetable was saved only in each browser's local storage. A returning user can lose sight of that timetable when moving to the new account-synced app, even though its old data may still be present on the same browser and origin. The spreadsheet export cannot recover personal timetables. The old app also used an email address typed into the browser, so an old storage key does not prove who owns its contents. Old entries lack academic year and semester, and may not correspond to any currently approved offering.

## Solution

After Google sign-in, the new app checks whether a legacy timetable is available in the current browser on the current origin. If it finds one for the signed-in account's email, it offers an import preview in the timetable screen. The user reviews each old course and section, sees which entries can be matched uniquely to an approved offering with valid meeting times, and chooses whether to add those matches to their account timetable. The app reports unmatched or ambiguous entries without inventing an offering. It preserves the old browser data until the user has verified the result. Users on a different origin or device can continue adding offerings manually.

## User Stories

1. As a returning user, I want the new app to detect an old timetable on this browser automatically, so that I know it may be recoverable.
2. As a signed-out visitor, I want my old timetable left unread by the sign-in screen, so that its contents are not shown before I sign in.
3. As a signed-in user, I want the import offer to identify that it found local data without silently adding it to my account, so that I remain in control of the transfer.
4. As a signed-in user, I want to preview every old course and section before import, so that I can recognize the timetable I saved.
5. As a signed-in user, I want the app to distinguish the old locally entered email from my verified Google identity, so that it does not claim the old key proves account ownership.
6. As a signed-in user, I want each old entry matched only to a unique approved offering with valid official meeting times, so that my new timetable contains valid selections.
7. As a signed-in user, I want to see an offering's academic year, semester, section, and official meeting times before confirming it, so that I can catch a match to the wrong term.
8. As a signed-in user, I want ambiguous, missing, archived, unapproved, and meetingless matches called out, so that I can add an appropriate offering manually later.
9. As a signed-in user, I want a malformed or unavailable local-storage value to produce a clear, recoverable result, so that it cannot break the timetable screen.
10. As a signed-in user, I want an existing account timetable preserved during import, so that previous selections are not silently removed or replaced.
11. As a signed-in user, I want schedule conflicts and different sections of an already selected course identified before saving, so that I can resolve them deliberately.
12. As a signed-in user, I want a confirmation step before account writes, so that merely opening the app never imports data.
13. As a signed-in user, I want a clear per-entry result after saving, so that I know what was added, already present, skipped, or failed.
14. As a signed-in user, I want to retry entries that failed without creating duplicates, so that a temporary request failure does not lose my timetable.
15. As a signed-in user, I want the old browser copy retained until I have checked my new timetable, so that I can recover from a partial import or mistaken match.
16. As a signed-in user, I want to dismiss the offer and still find it later from the timetable screen, so that I can decide when to import.
17. As a user on another device or domain, I want a clear explanation that the old timetable is unavailable there, so that I understand why manual re-entry may be needed.
18. As a project owner, I want this import to remain separate from the spreadsheet course and review reconciliation, so that cutover counts do not imply personal timetables were centrally migrated.

## Implementation Decisions

- Detect legacy data only in the browser after a real Google session is established. Local storage is scoped to the exact origin, including scheme, host, and port; the app cannot read another origin's browser storage.
- Look for the legacy timetable associated with the signed-in account's email. The legacy email is only a lookup hint because the old app accepted typed email strings. Never use it as an authentication or authorization claim, and never send it to a database migration endpoint.
- Parse legacy entries as untrusted local data. The old shape contains course code, course name, section, teacher, weekday, start time, and end time. Validate the array and relevant fields before showing or matching entries. Do not execute or render stored strings as HTML.
- Match by course code and section against the signed-in user's approved catalog and offerings. An entry is automatically eligible only when exactly one approved offering remains after matching and it has valid official meeting times. Because old entries lack academic year and semester, do not select among multiple candidates by guessing from teacher or time.
- Show academic year, semester, section, and official meeting times in the preview. Treat the old teacher and time as historical browser values; use the approved offering's meeting times for the new timetable. A disagreement stays visible to the user.
- Use the existing account-scoped timetable operations to read current selections and add confirmed offerings. Preserve existing selections. An entry that would change an existing course section or produce a meeting conflict requires its own deliberate resolution; it is not included in a silent bulk add.
- Do not create or approve offerings, import old email identity, or place unverified historical schedules into the shared timetable catalog. Missing and ambiguous entries remain available for manual selection.
- Confirm before sending any timetable write. Report results per entry, tolerate partial failure, and re-read the account timetable after writes. A retry must not create a duplicate or overwrite a different section without confirmation.
- Keep the original local-storage key through preview, save, and verification. The user may later remove it explicitly; no automatic deletion is required for a successful import.
- Make the import offer available in the existing timetable interface and use the original site's visual language for any new controls. The rest of the account timetable continues to work when no legacy data exists.
- This is a per-browser, per-origin recovery path. Spreadsheet migration and production cutover must not count it as centrally migrated user data.

## Testing Decisions

- The primary test seam is the signed-in timetable flow with seeded legacy local storage and the same authenticated Data API operations used by the app, against an isolated database branch where possible. Assert visible previews, confirmed account selections, skipped rows, and unchanged old data, rather than internal matching steps.
- Cover a unique approved match; two offerings sharing code and section across years; missing, archived, unapproved, and meetingless offerings; malformed JSON; unavailable local storage; an existing account selection; schedule overlap; and a failed write followed by retry.
- Verify that detection alone causes no account writes and that a signed-out or different-account session does not import the legacy data.
- Verify the origin boundary in browser acceptance: a same-origin returning browser can detect its old key, while the separate test deployment cannot read storage from the old deployment.
- Use the existing timetable service and conflict-behavior tests as prior art. Add narrower tests only where the browser-flow seam cannot make malformed storage or partial failure reliable to reproduce.
- Run the production build and meaningful automated tests. Complete a same-origin browser acceptance pass with a real Google session before claiming that live users can import.

## Out of Scope

- A server-side import from Apps Script or the spreadsheet; neither contains personal timetable data.
- Reading another website's or device's local storage.
- Treating a typed legacy email as proof of ownership of a Google account.
- Automatically adding, replacing, or deleting timetable selections before user confirmation.
- Creating official offerings from old personal schedule entries.
- Guessing an academic year or semester when several approved offerings match an old course and section.
- Migrating the old browser's typed-email login or historical review ownership.

## Further Notes

- The existing architecture-rebuild spec says the new timetable starts empty unless users re-add offerings because the old typed-email data cannot be trusted for an automatic account transfer. This feature preserves that trust boundary: detection is automatic, while account import requires review and confirmation.
- The current test deployment and the old deployment have different origins. The feature can only detect existing legacy storage for returning users if the rebuilt app is served from the old origin at cutover. Otherwise the user must re-add offerings or use a separately designed manual export/import flow.
- The old browser timetable stored one entry per course code and omitted academic year and semester. The new timetable accepts only approved offerings with valid meeting times. Those differences make partial import an expected outcome.

## Comments

### 2026-09-23 — Local import flow implemented

The signed-in app now checks the matching legacy browser key and marks the timetable navigation when it finds data. The timetable screen offers a preview and explicit confirmation. It matches course code and normalized section only against approved offerings, shows official academic period and meeting times, and leaves ambiguous, missing, meetingless, already selected, and conflicting entries out of the confirmed add set. The original browser copy is retained. Import results remain visible per entry across partial failure and retry. No database migration or new public data interface was added.

The signed-in app and component tests seed old local storage and exercise the UI with mocked account-scoped timetable RPCs. They cover detection, confirmation before writes, ambiguous years, conflicts, missing meetings, malformed or inaccessible storage, another account's key, changed offerings, and retry. A live same-origin Google browser pass remains necessary before this feature can be called fully accepted. The separate Vercel test origin cannot access the old deployment's browser storage.

`npm test -- --run` passed 53 tests across 11 files, `npm run build` passed, and `git diff --check` passed.
