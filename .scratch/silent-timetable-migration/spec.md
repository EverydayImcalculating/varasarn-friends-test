# Silent first-visit migration of legacy personal timetables

Status: implemented; database integration verification pending

## Problem Statement

Returning students expect to find the timetable they built in the old app. The new app currently asks them to notice a “เดิม” badge, open an import banner, preview matches, and confirm. Missing offerings cannot migrate, duplicate rows block each other, and completed imports continue to advertise the old data. The migration should happen automatically during the first eligible signed-in visit, without making students manage a migration process.

## Solution

After a verified account session is available, recover that account's matching browser timetable in the background. The student sees their classes in the normal timetable. Show no migration badge, banner, preview, confirmation, success toast, or mandatory detour. Preserve their existing account selections and the original browser data. Resume interrupted work quietly and never restore a migrated class the student subsequently removed.

Preserve valid historical class details even when the shared catalog has changed. Use an official offering only when it represents the same class unambiguously; otherwise recover the entry as a private legacy snapshot. Private snapshots are personal planning data and never become approved offerings or published reviews. This fallback is a proposed implementation decision to fulfill “migrate their old timetable,” rather than silently dropping every unmatched class.

## User Stories

1. As a returning student, I want my saved classes to appear automatically after sign-in, so that moving to the new app takes no extra action.
2. As a returning student, I want migration to start without visiting the timetable screen, so that my first visit is enough.
3. As a returning student, I want no migration banner, badge, preview, or toast, so that I can continue using the app normally.
4. As a signed-out visitor, I want my local timetable left unread, so that the sign-in page does not expose it.
5. As a signed-in student, I want recovery limited to the legacy key matching my verified account email, so that other local users' timetables are untouched.
6. As a student with no old timetable, I want the usual empty or existing account timetable, so that migration does not add delays or errors.
7. As a returning student, I want the original browser copy preserved, so that interrupted migration cannot destroy my only copy.
8. As a student with current account classes, I want those selections preserved, so that historical data cannot replace recent choices.
9. As a returning student, I want an exact official match used when available, so that my selection can use the existing official timetable behavior.
10. As a student whose old class is absent from the catalog, I want its valid saved details retained privately, so that a catalog change does not erase my schedule.
11. As a student whose old section or teacher has changed, I want the saved class retained without guessing, so that migration does not silently change when or with whom I study.
12. As a student whose old entry has no academic period, I want that field left unknown, so that migration does not invent a year or semester.
13. As a student with identical duplicate saved rows, I want one recovered class, so that duplicates do not prevent recovery.
14. As a student with conflicting old sections or overlapping classes, I want the conflicting records preserved for recovery, so that migration does not choose a winner arbitrarily.
15. As a student with a mixture of valid and broken records, I want valid independent classes recovered, so that one bad row does not block the entire timetable.
16. As a student with malformed or inaccessible browser storage, I want the rest of the app usable, so that recovery cannot lock me out.
17. As a student with a temporary network failure, I want migration retried quietly, so that I do not need to diagnose or submit an import again.
18. As a student who reloads during migration, I want completed classes recognized, so that resuming creates no duplicates.
19. As a student using multiple tabs, I want recovery to converge on one result, so that simultaneous visits cannot overwrite each other.
20. As a student who removes a recovered class, I want it to stay removed on later visits, so that migration respects my edits.
21. As a student whose save response was lost, I want the app to reconcile with stored results, so that the timetable reflects classes that were actually saved.
22. As a student who changes accounts while recovery is running, I want pending work stopped or scoped to the original account, so that classes cannot cross accounts.
23. As a student on a narrow phone, I want the normal timetable to remain usable while recovery runs, so that it works at 393×852 and 360×780.
24. As a student opening a different browser or origin, I want the app to work with available account data, so that missing local data does not look like a migration error.
25. As a maintainer, I want repeatable isolated tests of failure and concurrency, so that mock success is not mistaken for a production guarantee.

## Implementation Decisions

- **Trigger and scope:** run an account-scoped coordinator after a verified session and required account/catalog reads succeed. It belongs to app initialization, not a conditionally mounted timetable panel. Cancel pending work on sign-out/account change and recheck identity before each write. Do not scan storage while signed out.
- **Legacy contract:** the exact prefix is `my_tu_schedule_`; match its suffix to the authenticated email after trimming and case folding. The value is a JSON array. Rows use string fields `code`, `name`, `sec`, `teacher`, `day`, `start`, `end`. Days are Thai weekday names, times are strict 24-hour `HH:mm`, and end must follow start. Code and section are required. Academic period is absent. Never reinterpret object wrappers or guess renamed fields. Two matching keys are ambiguous: preserve both and do not choose silently.
- **Identity policy change:** an old typed email is not evidence of ownership. The requested product policy authorizes recovery of matching local planning data into the current authenticated account. It grants no access to reviews, another account, or protected backend records. Writes derive their account from verified server auth, never a caller-supplied user ID or the key suffix.
- **Preservation:** leave original key names and values byte-for-byte unchanged after every outcome, including full success. Do not use deletion as a completion marker. Do not touch unrelated keys.
- **Normalization and duplicates:** normalize course codes/sections for comparison; coalesce semantically identical rows, retaining the original source as backup. Conflicting rows for one course remain unresolved. Evaluate conflicts after deduplication, with touching end/start times allowed. Preserve both members of an unresolved conflict rather than picking by source order.
- **Official matching:** use an official selection only for one approved course/section candidate, a valid meeting set equal to the saved schedule, and compatible instructor data. Multiple periods, changed times, extra meetings, or an unverifiable teacher are not exact matches. Legacy data without a known period cannot establish one independently. A mismatch uses the private snapshot fallback instead of changing the user's schedule.
- **Private snapshot fallback:** add an authenticated, account-private legacy timetable entry type. Retain saved code, name, section, optional teacher, weekday and times; academic year and semester remain unknown. Permit a nullable catalog association so deleted/missing courses can be preserved. Render through the existing timetable list/day views and explicit removal controls. It must not create shared courses/offerings, reviews, review ownership, or approval state. Distinguish the source internally; no migration label is required in the normal UI.
- **Existing selections and conflicts:** an existing official, review-reported, or legacy selection for the same normalized course takes precedence. Equal existing selections count as reconciled; different selections remain untouched. Time conflicts with account data or between distinct legacy classes remain unresolved in the source backup and receipt. Do not replace or remove anything automatically.
- **Atomic server operation:** introduce a migration-specific authenticated operation that records outcomes and adds eligible entries transactionally under account-wide serialization. Recheck authorization, offering validity, current selections, and overlaps inside the transaction. The ordinary “add offering” operation currently has replacement semantics and is unsuitable for migration. All timetable mutation paths that can race with migration must participate in the same account locking/serialization strategy; locking only the migration call is insufficient.
- **API result:** return a durable migration receipt with per-entry outcomes: added, already present, invalid, ambiguous source, conflicting, or retryable failure. Associate successful official/private entries and terminal skips with the receipt. The operation must be safe to call again after a timeout or partial acknowledgement. Do not expose receipts across accounts or provide administrators personal timetable access.
- **Durable completion:** version receipts by migration version, authenticated account, source fingerprint, and canonical entry identity. Keep consumed-entry records after timetable removal, including clearing the timetable. Repeated source reads, reordered rows, exact duplicates, changed catalog availability, and retries must not re-add consumed entries. A later changed source may contribute genuinely new entries, but must not revive an entry already consumed and removed. Storage markers may optimize reads; server receipts enforce correctness. Treat local markers as untrusted and tolerate unavailable storage writes.
- **Lifecycle:** classify work as pending, running, reconciled, retryable, or unresolved. A timeout is an unknown outcome, not proof of failure. Reconcile a receipt and account timetable before retrying. Refresh the app timetable after added or already-present outcomes, including lost acknowledgements. Do not mark a failed read or failed write complete.
- **Retry policy:** at most one coordinator per account per tab; use bounded backoff (for example 1, 5, and 30 seconds with jitter), pause offline, and stop retries on sign-out. After exhaustion, retry at the next authenticated visit or online transition. Terminal malformed/ambiguous/conflicting entries do not enter a tight retry loop. Their source remains recoverable. No user-facing migration error is required; ordinary timetable loading errors retain normal UI behavior.
- **UI removal:** remove the old navigation badge and default manual import panel, including “ไว้ภายหลัง”. Do not block catalog navigation or replace the screen with a migration loader. Use ordinary timetable loading state when its data is being fetched. Preserve day selection, scroll position, and focus on asynchronous refresh.
- **Origin boundary:** recovery works only on the browser/origin that holds the old key. Deploy the rebuilt app to the old scheme/host/port at cutover, or document that recovery is unavailable there. This feature does not promise cross-origin localStorage access.

## Testing Decisions

- Primary seam: mount the signed-in app with real migration/timetable services and a stateful authenticated RPC fake. Assert externally visible timetable contents, absence of import prompts, unchanged source bytes, and write outcomes. Existing signed-in legacy detection, component import/retry, and review-to-timetable app tests are prior art. Avoid asserting private refs or helper call order.
- The proposed app/service boundaries were presented for an optional user check; no answer is required to use these existing boundaries. The new transaction and receipt contract also requires backend integration tests because a UI fake cannot establish durability or concurrency guarantees.
- App cases: no key, empty array, signed out, different account, normalized email, duplicate keys, malformed JSON, unsupported object/row formats, unavailable storage, exact official match, changed schedule/teacher, multiple periods, missing course/section, no valid meetings, duplicate rows, mixed valid/invalid entries, existing official/reported/private classes, and overlaps.
- Trigger migration before opening the timetable and assert zero migration controls/toasts. Confirm normal catalog navigation works throughout. Assert exactly one intended class appears and the original source is unchanged.
- Use a persistent fake for reload/remount tests; the current dev mock resets module state and cannot prove persistence. Exercise failed initial reads, failed writes, partial results, commit followed by lost response, readback failure, offline/online transition, retry exhaustion, source changes, account switching, and unmount during requests.
- Backend integration: separate verified accounts; unauthenticated requests; receipt isolation; duplicate calls; simultaneous tabs; same-course selection and different-course overlap races; transactional rollback; crash/retry; class removal and clear followed by repeat migration. Use an isolated database branch, never production user data.
- Browser acceptance: fresh disposable contexts at 393×852 and 360×780 using the mock server, plus controlled faults and screenshots. Verify first visit, second visit, reload, long Thai names, existing classes, and absence of migration UI. Keep mock seeding/fault controls explicitly dev-only. Then verify Google authentication, durable reload, and account scoping on an isolated real backend served at a testable same origin.
- Completion gates: the relevant existing tests, the full `npm test -- --run` suite, production build, and backend migration contract tests pass. A real same-origin returning-browser check is required before claiming production migration acceptance.

## Out of Scope

- Migrating typed-email login, review ownership, spreadsheet data, or another person's account.
- Promoting legacy data into approved shared catalog records or published reviews.
- Guessing missing years, semesters, sections, or times.
- Automatically replacing existing account selections or resolving conflicting legacy rows.
- Deleting original browser data or introducing migration notifications/prompts.
- Cross-origin/device extraction, manual file import/export, and a recovery-management screen for unresolved source data.

## Further Notes

- This specification supersedes the explicit opt-in/confirmation requirement in the earlier legacy timetable import specification and the architecture-rebuild note that the new timetable starts empty. This is an intentional product policy change requested on 2026-09-26. The earlier documents remain historical context.
- Silent migration does not mean every damaged or conflicting row becomes a class. Valid nonconflicting unmatched rows get private snapshots; unresolved data remains intact without disruptive prompts. A later recovery UI can be designed separately.
- The current audit found that the mock automatically seeds data, only stores account changes in module memory, and does not enforce production replacement/authorization/transaction rules. Its successful browser checks are UI evidence only.
- See the adjacent audit report, browser results, reproduction script, and screenshots for current behavior and implementation risks.

## Implementation Record (2026-09-26)

- Added migration-specific SQL tables and authenticated RPCs, account serialization shared with timetable mutations, per-source receipts, private legacy snapshots, and removal/clear behavior that does not forget consumed entries.
- The app now runs the migration after authenticated initialization without exposing a badge, banner, preview, confirmation, or toast. It keeps source localStorage unchanged, retries retryable outcomes quietly, pauses retries offline, resumes on the online event, and scopes work to the active account.
- Added service and app regressions; updated the dev mock to persist account timetable/receipt state across reloads. Browser checks at 393×852 and 360×780 confirmed one official and one private migrated row survive reload, removal remains removed, original localStorage remains byte-identical, no horizontal overflow, and no page errors.
- Verified `npm test -- --run`, `npm run build`, and `git diff --check` pass. Build emits the existing large-chunk warning.
- The SQL migration has not been applied to a database and backend transaction/auth/concurrency behavior has not been integration-tested. The dev mock is not evidence of production guarantees; use an isolated database branch before rollout.
