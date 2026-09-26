# Legacy localStorage timetable audit

Date: 2026-09-26
Scope: current working tree, including pre-existing mobile timetable edits. Audit and implementation specification only; production migration behavior was not changed.

## Findings, ordered by severity

### P1 — Import can overwrite a concurrent same-course selection

**Evidence:** code inspection; not reproduced against a real database. [Import's last client-side check](/Users/fsma/varasarn/varasarn-friends/src/services/legacy-timetable-import.ts:193) is separate from its write. [The backend add operation](/Users/fsma/varasarn/varasarn-friends/db/drizzle/0032_review_backed_timetable.sql:94) locks the account/course, then deletes both review-backed and other official selections for that course before inserting. It does not reject a selection added after the client's check. The mock simply appends, so it cannot reproduce these replacement semantics.

**Reproduction:** use two sessions for one account. In A, preview an import and pause after its last timetable read but before `add_my_timetable_offering`. In B, choose another section or a review-backed class for the same course. Resume A.

**Expected:** preserve B's selection and return a conflict requiring deliberate resolution. **Actual inferred from SQL:** A deletes B's selection and inserts the legacy match. Different-course time overlaps are also checked only by the client in this path.

**Implementation requirement:** a migration-specific atomic “add only if safe” operation with conflict checks and serialization shared with ordinary timetable mutations. Do not automatically call the existing replacement-capable add operation for silent migration.

### P2 — Retry after a lost save response leaves the visible timetable stale

**Evidence:** reproduced at both mobile sizes with a browser-only RPC wrapper that performs the mock write and then returns an error. [The component emits a refresh only for `added`](/Users/fsma/varasarn/varasarn-friends/src/components/LegacyTimetableImport.vue:60), while [reconciliation returns `already`](/Users/fsma/varasarn/varasarn-friends/src/services/legacy-timetable-import.ts:188). [The app refreshes through that event](/Users/fsma/varasarn/varasarn-friends/src/App.vue:557).

**Reproduction:** seed the valid fixture below; preview; make the first add commit but lose its acknowledgement; press confirm again; choose Thursday.

**Expected:** retry discovers the committed class, avoids a duplicate, and refreshes the visible timetable. **Actual:** the result says “มีอยู่ในตารางเรียนของคุณแล้ว”, the mock account contains one class, but the day view still shows no class. Leaving and reopening the timetable reloads it.

**Implementation requirement:** reconcile and refresh on already-present outcomes as well as newly added ones. See `360-lost-acknowledgement.png` and `393-lost-acknowledgement.png` in the screenshots directory.

### P2 — Duplicate rows block all copies with no way to choose one

**Evidence:** reproduced at both sizes. [Pairwise conflict classification](/Users/fsma/varasarn/varasarn-friends/src/services/legacy-timetable-import.ts:165) changes both identical rows to `time-conflict`. [Only ready rows have checkboxes](/Users/fsma/varasarn/varasarn-friends/src/components/LegacyTimetableImport.vue:85).

**Reproduction:** save `[validRow, validRow]`; open timetable; preview.

**Expected:** coalesce identical entries into one class, or let the user select one. **Actual:** both rows say “รายการเดิมชนกันหรือซ้ำวิชา กรุณาเลือกเอง”; neither has a checkbox; the confirm button is disabled. Manual catalog selection is the only UI workaround. No data is deleted.

**Implementation requirement:** deduplicate identical entries before calculating conflicts. Keep genuinely different sections unresolved.

### P3 — Successful imports continue to show the old-data badge and banner

**Evidence:** reproduced at both sizes. [The navigation badge is driven by initial source detection](/Users/fsma/varasarn/varasarn-friends/src/App.vue:457); [post-import refresh only reloads account timetable data](/Users/fsma/varasarn/varasarn-friends/src/App.vue:97). The import component has no durable completion receipt.

**Reproduction:** import the valid row successfully; return to catalog; reopen timetable and preview.

**Expected:** completed work should no longer look like a pending migration. **Actual:** “เดิม” and the banner remain; preview now says the class already exists. The original storage is correctly retained, but its presence is also being used as pending-work state. At 360 pixels the retained panel occupies most of the initial screen above the actual timetable.

**Implementation requirement:** separate source preservation from durable completion; the requested redesign removes migration prompts entirely.

### P3 — “ไว้ภายหลัง” is forgotten on navigation and reload

**Evidence:** reproduced at both sizes. [Dismissal is only a component-local ref](/Users/fsma/varasarn/varasarn-friends/src/components/LegacyTimetableImport.vue:21), and [the timetable panel is conditionally mounted](/Users/fsma/varasarn/varasarn-friends/src/App.vue:471).

**Reproduction:** choose “ไว้ภายหลัง”; leave for catalog and return, or reload and reopen timetable.

**Expected UX:** the deferred state remains until intentionally reopened for that visit (a stronger persistence expectation is a product decision). **Actual:** the full banner returns on every remount. The immediate “ดูตารางเรียนเดิมที่พบ” button does reopen it correctly and no writes occur. This is a UX finding, not a violation of an explicit prior persistence contract.

**Implementation requirement:** superseded by removing the manual migration prompt under the new design.

## Storage contract and code trace

Read `AGENTS.md`, every `docs/agents/*.md`, the existing legacy-import specification, and relevant architecture-rebuild guidance before tracing the implementation.

1. [App initialization](/Users/fsma/varasarn/varasarn-friends/src/App.vue:279) obtains the mock/real authenticated session, reads legacy data only when signed in with an email, then loads the catalog and access data. It does not import automatically.
2. [The storage reader](/Users/fsma/varasarn/varasarn-friends/src/services/legacy-timetable-import.ts:81) scans `my_tu_schedule_<email>` with trimmed, case-insensitive email suffix matching. Multiple matching keys produce an error. No key or an empty array means no source. Malformed JSON and non-array objects produce recoverable errors.
3. [Row parsing](/Users/fsma/varasarn/varasarn-friends/src/services/legacy-timetable-import.ts:57) requires string `code`, `sec`, Thai weekday, strict `HH:mm` start/end, and a positive interval. `name` and `teacher` are optional. Renaming `sec` to `section` is not supported. No year/semester is stored.
4. [The component](/Users/fsma/varasarn/varasarn-friends/src/components/LegacyTimetableImport.vue:25) reads source on mount. Preview performs reads, then confirmation writes selected eligible rows. It never writes, deletes, or rewrites the legacy key.
5. [Preview](/Users/fsma/varasarn/varasarn-friends/src/services/legacy-timetable-import.ts:132) reads official and review-backed account entries, matches normalized course/section against approved offerings, requires valid meetings, rejects ambiguous periods and conflicts, and warns about changed teacher/time. A unique match from an old period is still eligible; there is no current-period filter.
6. [Import](/Users/fsma/varasarn/varasarn-friends/src/services/legacy-timetable-import.ts:176) previews again, rejects changed offering IDs, rereads the timetable before each add, and reports added/already/skipped/failed outcomes. It does not atomically bind the read to the write or compare all displayed meeting details to their fresh values.
7. [TimetableService](/Users/fsma/varasarn/varasarn-friends/src/services/timetable-client.ts:18) combines official and reported lists, and calls the authenticated add RPC. Results refresh through the app's import event.

The fixture was created only after inspecting this contract:

```json
[
  {
    "code": "JC232",
    "name": "เทคนิคการถ่ายทำ",
    "sec": "320001",
    "teacher": "อ. อ้อม",
    "day": "พฤหัสบดี",
    "start": "09:30",
    "end": "12:30"
  }
]
```

For the mock session it was stored under `my_tu_schedule_admin@example.com`. It matches `offering-2`, semester 1/2568, Thursday 09:30–12:30. Imported timetable content was verified by both RPC readback and the visible Thursday class card, including code and official course details.

## Browser coverage and data isolation

Started `npm run dev:mock -- --host 127.0.0.1 --port 5179`. Used a separate downloaded Chromium runtime and a new disposable, nonpersistent browser context for each scenario; no existing browser profile was opened. All fixtures were synthetic. An unrelated storage sentinel was verified unchanged alongside the exact legacy bytes after every scenario. Production credentials and backend were not used.

| Scenario | 393×852 | 360×780 | Observed outcome |
| --- | --- | --- | --- |
| Truly absent saved key | Checked | Checked | No badge/banner; no import |
| Valid data: badge, banner, preview, import | Checked | Checked | Reads before confirmation; one class after confirmation; visible Thursday timetable verified |
| “ไว้ภายหลัง”, immediate reopen, navigation, reload | Checked | Checked | Immediate reopen works; navigation/reload reset dismissal |
| Malformed JSON | Checked | Checked | Alert; preserved bytes; no import control |
| Unsupported object format | Checked | Checked | Non-array alert; preserved bytes |
| Outdated row using `section`, missing course, missing section, valid row | Checked | Checked | Invalid/missing rows skipped; valid row imported |
| Exact duplicates | Checked | Checked | Both blocked; no selectable row |
| First write fails, retry succeeds | Checked | Checked | Injected failure shown; one class after retry |
| Commit succeeds but response is lost | Checked | Checked | Retry avoids duplicates, but visible timetable stays stale |
| Successful import then return/reload | Checked | Checked | Source unchanged; return shows already present; reload resets mock account state |

All 18 scenario runs completed their observation assertions. These assertions include reproductions of known defects; “pass” in the results means the expected observation was reproduced, not that the product is defect-free. No browser `pageerror` events were recorded. Document width matched viewport width in every scenario, and the measured import elements did not overflow horizontally. Reviewed screenshots of 360-pixel preview/resulting timetable and 393-pixel failure UI: Thai text wraps, controls are readable, and vertical scrolling is needed for the longer panel. This is Chromium responsive-layout evidence, not physical-device/Safari acceptance.

Artifacts:

- [Repeatable browser audit](/Users/fsma/varasarn/varasarn-friends/.scratch/silent-timetable-migration/browser-audit.mjs)
- [Recorded results and visible text](/Users/fsma/varasarn/varasarn-friends/.scratch/silent-timetable-migration/browser-results.json)
- [360-pixel preview](/Users/fsma/varasarn/varasarn-friends/.scratch/silent-timetable-migration/screenshots/360-preview.png)
- [360-pixel imported timetable](/Users/fsma/varasarn/varasarn-friends/.scratch/silent-timetable-migration/screenshots/360-imported-timetable.png)
- [393-pixel failure state](/Users/fsma/varasarn/varasarn-friends/.scratch/silent-timetable-migration/screenshots/393-failure.png)

To rerun, start the mock server on port 5179 and run the audit script with a Playwright installation. This session used `PLAYWRIGHT_MODULE=/Users/fsma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs` and `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/legacy-audit-browsers`. These are local runtime paths, not new repository dependencies.

## What the mock does and does not support

- [Mock configuration](/Users/fsma/varasarn/varasarn-friends/vite.mock.config.ts:10) aliases the real Neon client to a fake signed-in administrator (`admin@example.com`). This bypasses Google sign-in and actual network/database authorization. Production build uses the normal configuration.
- [Automatic seed](/Users/fsma/varasarn/varasarn-friends/mock/neon.mock.ts:13) creates two old rows whenever its key has a falsey value. Deleting the key and reloading does **not** test absence. The browser harness suppressed only that seed write for the absent scenario, inside the disposable context. Other cases supplied their own nonempty raw value before app initialization.
- `?timetable=empty` clears the initial mock account timetable. This is essential for a valid JC232 import: the default mock already contains JC100 at the same Thursday time, so the default legacy row conflicts. Existing query options also support a day-view layout and a timetable read error.
- [Mock add](/Users/fsma/varasarn/varasarn-friends/mock/neon.mock.ts:206) appends the first official meeting to an in-memory array; it does not implement real authorization, duplicate constraints, same-course replacement, multi-meeting behavior, durable storage, or transaction isolation. It can return success even when an offering was not found.
- Reload recreates module arrays. Disappearing mock account selections after reload are a mock limitation, not proof of a production data-loss bug.
- No built-in fail-first-add or lost-acknowledgement switch exists. Both were injected by wrapping the mock module's RPC in the isolated page; they were not real backend failures. Repository mock code was not changed by this audit.
- The SQL demonstrates intended account scoping and idempotent insertion for an identical official selection, alongside same-course replacement. These were inspected, not validated against the deployed database.

## Automated verification

- Relevant baseline: 23 tests passed across legacy app/import and timetable service/calculation suites.
- Added four focused regression cases in [legacy import tests](/Users/fsma/varasarn/varasarn-friends/tests/legacy-timetable-import.test.ts:253): absent storage, empty array, unsupported top-level object, and failed preview followed by successful retry without reload. Existing tests already cover ambiguous periods, meetingless offerings, conflicts, partial failures, retry, malformed/inaccessible storage, another email, and changed offering IDs.
- Updated legacy suites: 20 tests passed across two files.
- `npm test -- --run`: **114 tests passed across 16 files**.
- `npm run build`: **passed**, with Vite's warning about a JavaScript chunk larger than 500 kB (539.06 kB before gzip).
- `git diff --check`: passed.

## Checks not completed / limits

- Real Google login, deployed authenticated RPC behavior, account privacy/RLS, durable reload, real concurrency/transaction races, and recovery from actual network failure were not exercised. They require an isolated real backend and verified test accounts. No production data was touched.
- Actual old-origin cutover was not exercised. A different host, scheme, or port cannot read the old origin's localStorage; successful localhost recovery does not prove production reachability of those keys.
- Actual historical user browser payloads were not inspected. The fixture follows the repository reader and existing spec, not a capture of a user's real schedule.
- Safari, physical mobile devices, screen readers, and comprehensive accessibility checks were outside this pass.

## Redesign deliverable

[Silent first-visit migration spec](/Users/fsma/varasarn/varasarn-friends/.scratch/silent-timetable-migration/spec.md), produced with the requested `to-spec` workflow and marked `ready-for-agent`. It explicitly supersedes the former opt-in policy. It specifies automatic authenticated migration without prompts, atomic nonreplacement writes, durable receipts/retry, preservation of original storage, and a proposed private snapshot fallback for unmatched valid classes. Implementation remains for the user's next task.
