# Minimal legacy release check

Initial release check: 2026-09-27 (Asia/Bangkok), followed by the local time-compatibility fix documented below. One agent; existing importer retained. No deployments, production review imports, saved-timetable clears, commits, or pushes performed. The initial check made no source changes; the follow-up changes only legacy time parsing and its verification coverage.

## Verdict

- **Timetable smoke test: BLOCKED** for authentic same-origin silent recovery. Preserved browser data is real, but OLD APP LIVE and NEW APP LIVE are on different origins. The confirmed JC232 time-format **FAIL is fixed locally and fixture verification passes** (follow-up below). The fix has not been deployed; authentic cutover acceptance remains BLOCKED.
- **Review dry run: PASS**, ready for explicit approval of the batch below. **12 proposed new anonymous, ownerless reviews; 0 committed.**

## A. Authentic timetable evidence

The user confirmed their existing Arc browser already held the old timetable. Inspected that existing tab/profile, without clearing, re-seeding, editing or copying its storage. This is real preserved-browser evidence; its original save time is user-reported, not independently timestamped. The profile was not replaced with a disposable browser. Profile display name was not captured.

- Old origin: https://varasarn-close-friend.vercel.app — HTTP 200, old inline JavaScript frontend, still live.
- New origin: https://varasarn-friends-test-tau.vercel.app — HTTP 200, rebuilt frontend, asset `/assets/index-C5PTzjj8.js`.
- New asset SHA-256: `f9b71d8890816ddfd78f7ca045c87e2ea498f26ffd9472a4daede2c9d1a24953`. Contains the actual `migrate_legacy_timetable_entry` RPC and `my_tu_schedule_` prefix. Its embedded Data API URL matches the database target below.
- Do not infer deployed old behavior from `old-repo/index.html`: that local file is a small rebuilt-app shell. The live old HTML was inspected directly instead.
- Live old code constructs exactly `my_tu_schedule_` + current user email; reads a JSON array; saves rows with `{ code, name, sec, teacher, day, start, end }`. It does not include term/year. The matching key was confirmed against the old app's stored account identity; the email is omitted here.
- Original storage: **286 JavaScript characters**, SHA-256 of UTF-8 value **`3e12cb71b8d0f054d6a484d4e2bbf2478bf13514a317bd77cdcb32f5c447e8b2`**.

| Course | Section | Day | Original start | Original end |
| --- | --- | --- | --- | --- |
| TU109 | 540001 | Thursday / พฤหัสบดี | 13:30 | 16:10 |
| JC232 | 320001 | Thursday / พฤหัสบดี | 9:30 | 12:30 |

On the new origin in the same Arc session, the app was already signed in and **zero** keys with the legacy prefix existed. Existing server state for the dedicated test account: 0 official selections, **1 review-backed selection**, 0 private legacy entries, **0 migration receipts**. Thus consumed receipts are not masking a new recovery. Existing selection: AS171, section sec1, term 2/year 2569, Monday 09:19–12:19. No selection was removed or replaced to make a test pass.

### Origin blocker: minimal reproduction and impact

1. Open the old origin in the preserved profile; its timetable shows TU109 and JC232.
2. Open the new origin in that same profile/account.
3. The new origin has no legacy key and cannot read localStorage belonging to the old origin. No authentic source reaches the migration coordinator.

Impact: silent recovery at the new URL is unavailable in this deployment arrangement. Catalog/ordinary account use is independent of that recovery. Old data was not cleared. Authentic migration correctness, durable migrated rows after reload, and migrated-row deduplication on a repeat visit cannot be claimed. Deploying to the original origin or changing the recovery design is outside this task. No cross-origin copy or fixture was used to manufacture a production PASS. Unsupported/failure preservation has local service-test coverage only; real failed-RPC preservation was not fault-injected in production.

### Original unsupported historical time: FAIL before local fix (bounded reproduction)

Authentic JC232 contains `start: "9:30"`. At the initial release check, the parser required strict HH:mm, so the row was invalid. The deployed bundle contains that strict parser. A local reproduction using the current TypeScript service, transpiled only into /tmp, passed a source-derived JC232 row with that exact time: outcome **invalid**, **0 RPC calls**, original fixture string unchanged. This is a **synthetic local parser reproduction**, not a production migration or full browser recovery test.

Impact: even after resolving origin access, this historical row is skipped by the current importer. The old browser value remains recoverable. Normal account selections are not replaced by this rejected row. The subsequent user-authorized compatibility fix below resolves this local parser defect only; all broader enhancements remain deferred.

### Mobile / reload checks

- 393 × 852: PASS for normal production layout. Both empty Sunday and populated Monday views were inspected. AS171 / sec1 / Monday 09:19–12:19 appears once and is readable; measured document width 393, no horizontal overflow; no import card or “เดิม” badge visible. This is the existing account class, not a migrated class.
- 360 × 780: PASS for normal production layout. The user set Responsive to the exact dimensions; inspected the populated Monday view with one readable AS171 card, full weekday navigation and no import prompt/badge. After reload, the signed-in catalog returned and measured document width was 360 at viewport 360 × 780.
- Reload: the signed-in catalog returned at 360 × 780 and the new origin still had zero legacy keys. The timetable was reopened, but a settled populated post-reload view was not independently captured; no stronger UI persistence claim is made. The separate database comparison confirms the existing selection is unchanged.
- Migrated-row persistence/deduplication remains BLOCKED because no authentic migration can start across these origins. No migrated row exists to test. No fixture was injected into production.
- Original-value integrity: PASS. Reopened the exact old origin in the same Arc profile after production checks; length remained 286 and UTF-8 SHA-256 remained `3e12cb71b8d0f054d6a484d4e2bbf2478bf13514a317bd77cdcb32f5c447e8b2`. Final fingerprint comparison returned unchanged=true. The original tab/profile/storage were retained.
- Browser automation could not reliably focus the DevTools dimension field; the user set both requested viewport sizes. This is live production rendering, not mock-server evidence.

## B. Review import approval packet

- Source: supplied local fresh workbook `old-repo/สำเนาของ เว็บรีวิววิชา.xlsx`; **20600 bytes**; sheets **Courses**, **Reviews**; Reviews range **A1:L13** (one header plus 12 data rows).
- Exact source SHA-256: **`5cd77f6e1125adc706556f9b53d2c597243af5ece28c242ddc9aac211488afb8`**.
- Target application: https://varasarn-friends-test-tau.vercel.app/.
- Target database: branch **production**, database **db**, direct host **`ep-wild-bird-b3675s7e.c-4.ap-southeast-1.aws.neon.tech`**.
- Target table: **app_private.reviews** through the existing **app_private.import_legacy_review_rows(jsonb)** importer. Catalog checked against all **214** target courses, not the workbook's Courses sheet.
- Review timestamp offset: **+07:00** (existing importer default).

| Classification | Rows |
| --- | ---: |
| Actual source data rows | 12 |
| Accepted | 12 |
| Duplicate within export | 0 |
| Invalid | 0 |
| Blank within source range | 0 |
| Unmatched course | 0 |
| Already imported / matching target legacy row | 0 |
| Proposed newly inserted | **12** |
| Committed by this task | **0** |

Counts reconcile: 12 = 12 + 0 + 0 + 0 + 0. Full sheet-range parsing including blank rows agrees with the existing importer. Its dry-run output equals the independent verification's normalized reviews.

Existing state was checked before proposing this batch: **3 total production reviews, 0 legacy reviews, 0 legacy import audit records, 0 course-merge audit records**. Duplicate comparison used the database's legacy course/year/term/normalized-section/text identity. The two TU109 rows remain distinct by review text. There is no prior legacy import to repeat or skip in this snapshot. Recheck state and fingerprint immediately before any later approved import.

### Every accepted review checked against source

For **each of the 12 accepted rows**, compared complete trimmed review text, rating, source course, trimmed section, semester, academic year, instructor, and timestamp. All passed. Excel timestamp components were independently decoded with XLSX.SSF and compared as instants at +07:00; the existing importer rounds to the nearest second. Source text is deliberately not reproduced in this report. All rows contain schedule fields that are intentionally discarded.

| Source row | Course | Rating | Section | Term/year | Review timestamp (+07:00) | All fields / full text |
| --- | --- | ---: | --- | --- | --- | --- |
| 2 | JC380 | 5 | 450001 | 1/2569 | 2026-09-20T14:26:26+07:00 | PASS |
| 3 | JC201 | 3 | 810001 | 1/2567 | 2026-09-20T18:06:52+07:00 | PASS |
| 4 | JC232 | 5 | 320001 | 1/2568 | 2026-09-21T02:59:15+07:00 | PASS |
| 5 | JC364 | 2 | 1 | 2/2568 | 2026-09-22T20:43:02+07:00 | PASS |
| 6 | JC473 | 5 | Sec01 เซคเดียวจ้า | 1/2568 | 2026-09-23T01:00:58+07:00 | PASS |
| 7 | JC484 | 4 | Sec 01 เซคเดียวจ้า | 2/2568 | 2026-09-23T01:06:16+07:00 | PASS |
| 8 | AS287 | 4 | 1 | 1/2568 | 2026-09-23T01:13:52+07:00 | PASS |
| 9 | JC202 | 5 | อังคารเช้าสักเซค | 2/2568 | 2026-09-23T05:14:08+07:00 | PASS |
| 10 | JC466 | 3 | จันบ่าย | 1/2569 | 2026-09-23T05:19:14+07:00 | PASS |
| 11 | TU109 | 4 | 540001 | 1/2568 | 2026-09-23T18:58:19+07:00 | PASS |
| 12 | TU109 | 5 | 540001 | 1/2568 | 2026-09-25T11:17:04+07:00 | PASS |
| 13 | TU122 | 3 | 820001 | 2/2568 | 2026-09-25T11:26:17+07:00 | PASS |

### Import policy and deferred work

The deployed importer body was inspected read-only: it inserts NULL author_user_id and NULL offering_id; preserves review created_at; does not insert day_of_week/start/end schedule columns. Its function-body SHA-256 is `487b2acad384b9efca6f79876702e43b5765f22ecbe6027d177f5c93432797d7`.

**Anonymous, ownerless policy retained. CreatorEmail is discarded. Historical class Day, StartTime, and EndTime are discarded for all 12 accepted reviews. Their preservation is deferred.** Review ownership mapping, shared-key timetable support, and broader cutover enhancements remain deferred. Existing review Timestamp preservation is distinct from discarded class schedule fields.

No import RPC, INSERT, UPDATE, DELETE, schema migration, or review commit was executed. PostgreSQL verification used default_transaction_read_only=on and a read-only transaction. The existing CLI ran without --commit and with PGOPTIONS enforcing read-only access. Its raw text output was parsed in memory, not dumped or added to Git. Raw workbook stays ignored by Git.

## Supplemental checks and limitations

Ran existing tests once: `npm test -- tests/legacy-timetable-migration.test.ts tests/legacy-review-import.test.ts`.

- Timetable service: **8 passed** (mock/local evidence only).
- Review importer tests: **3 passed, 2 failed** because assertions in `tests/legacy-review-import.test.ts:31` and `:56` hard-code the previous four-row workbook. Actual fresh export returns 12. Minimal reproduction is the same command with the supplied fresh export at the expected path. This affects stale test expectations; it does not indicate lost review data or a failed target-catalog dry run. Tests were not rewritten for this verification.
- No full release suite, concurrent migration fault tests, real backend writes, or deployment was needed or performed. Existing mock-browser screenshots were not reused as live evidence.
- No raw export, credentials, tokens, email addresses, or review text is included in this report. Existing unrelated workspace changes remain untouched.

Final read-only database recheck: existing AS171 course/year/term/section/day/start/end unchanged; legacy reviews 0, review import audits 0, dedicated-account migration receipts 0. Export SHA-256 still matches the approval packet. `git diff --check` passed; the workbook is ignored by Git.


## Follow-up: legacy H:mm compatibility fix — local PASS

**Scope:** only the confirmed legacy timetable time defect. Production and review migration were not touched. Same-origin authentic recovery remains **BLOCKED**; no claim of actual old-domain cutover preservation is made.

### Change and fixture provenance

- `src/services/legacy-timetable-import.ts` canonicalizes valid legacy H:mm/HH:mm values in the parsed in-memory copy, before existing validation, interval/conflict checks, deduplication, and RPC receipt payload creation. `9:30` becomes `09:30`; both start and end are handled. The original localStorage key/value is never rewritten.
- Hours remain 0–23 and minutes 00–59. Numeric/object/null values, malformed strings, seconds suffixes, extra hour digits, invalid ranges, equal/reversed times and overnight intervals remain rejected. Existing surrounding-whitespace trimming is unchanged.
- `9:30` and `09:30` generate the same canonical payload and identity, including across later reads. Migration version stays 1; existing receipt behavior is retained.
- `tests/fixtures/legacy-timetable-authentic.json` reconstructs the two observed course records exactly. Its **286 characters** and UTF-8 SHA-256 **`3e12cb71b8d0f054d6a484d4e2bbf2478bf13514a317bd77cdcb32f5c447e8b2`** match the original preserved-browser value. It contains no account email or credentials. The JS mock account key is used only in isolated tests.

### Verification

| Check | Result |
| --- | --- |
| Before fix: focused regression run | 4 expected failures: authentic JC232, canonical equivalence, two valid H:mm intervals; 27 passing |
| After fix: timetable service + app tests | **PASS: 34/34** |
| Full requested `npm test -- --run` | **FAIL: 126 passing, 2 existing review-test failures**, 15 files passing / 1 failing |
| `npm run build` | **PASS**; existing >500 kB chunk warning |
| Isolated browser, exact authentic bytes | **PASS**, first visit + reload + another visit |
| Isolated browser, added canonical duplicate variant | **PASS**, first visit + reload + another visit |
| `git diff --check` | **PASS** |

The two full-suite failures are unchanged, outside this defect: `tests/legacy-review-import.test.ts:31` (“normalizes the four-review snapshot, matches its catalog, and discards creator emails”) and `:56` (“reports that no catalog was checked when none is supplied”). They expect 4 accepted rows but the supplied workbook has 12. No review tests, review data, or review importer were changed to hide these failures. The full suite is **not green**.

**Browser evidence is fixture-based, with a mocked backend.** Adapted the existing browser verification workflow into `.scratch/legacy-data-cutover/verify-legacy-time-fixture.mjs`, using the existing `dev:mock` server. Fresh isolated headless contexts were used; the user's persistent Arc profile was not opened or modified. All external requests were blocked, so production services could not be reached. Fixture seeding happens once per context/tab session and is not repeated on reload, so deletion cannot be hidden by reseeding.

Both variants retained TU109 and JC232 as two private mock timetable entries and exactly two mock receipts over three visits. JC232 rendered section 320001, Thursday, **09:30–12:30**, with the original course name and instructor. Existing mock GE101 remained present. Original source bytes remained exactly equal after every visit. No duplicate JC232, import card, “เดิม” badge, horizontal overflow at 393×852/360×780, or page error was found. No saved timetable was cleared and no removal RPC was used.

Reproduction: start `npm run dev:mock -- --host 127.0.0.1 --port 5181 --strictPort`, then run `node .scratch/legacy-data-cutover/verify-legacy-time-fixture.mjs`. If Playwright is outside the project, set `PLAYWRIGHT_MODULE` to its installed ESM entry; `CHROMIUM_EXECUTABLE` optionally selects the existing headless executable. The script is hard-coded to localhost and blocks other origins.

This confirms client normalization, UI rendering and mock persistence only. It **does not prove storage survives an actual old-domain deployment**, authenticated production backend durability, or cross-origin recovery. Deployments, shared-key support, review ownership mapping and historical review schedule preservation remain outside this task. No commit, push, deployment, production review import, or production timetable write was performed.
