# 14: Legacy review migration

**What to build:** The project owner can import historical spreadsheet reviews and have readers see them anonymously without falsely assigning authorship or trusting unverified schedule details.

Blocked by: 04 Course import and reconciliation; 06 Approved offerings and academic periods

Status: needs-info

- [x] A repeatable dry run and confirmed import normalize legacy rating, date, course, section, semester, and year values and report source counts, duplicates, and unmatched relationships.
- [x] Imported reviews retain text, rating, date, and historical course/section context, but no account owns them and stored unverified email values are discarded rather than matched to Google users.
- [x] Historical schedule details remain explicitly unverified and cannot become selectable current offerings until an administrator approves them.
- [ ] Signed-in readers see imported reviews in the anonymous projection; no user can edit, withdraw, or claim an ownerless legacy review through ordinary controls.
- [x] Tests cover the repository's four-review snapshot and a fresh-export fixture, including count reconciliation, unmatched references, and absence of legacy emails from target data.

## Comments

### 2026-09-23 — Owner-only confirmed import deployed

Migration `0021_import_legacy_reviews.sql` adds an owner-checked, transactional confirmed import API. It accepts only normalized rows, rejects invalid or unmatched relationships, inserts no provider user ID or email, creates rejected historical offerings without meetings, and idempotently inserts ownerless legacy reviews with a private audit summary. The Data API schema cache was refreshed after deployment.

The dry-run workbook test verifies all four source reviews normalize without any `@` value in output and are marked `scheduleVerified: false`. A fresh-export fixture, live owner import run, and anonymous-reader acceptance remain to be recorded.

### 2026-09-23 — Three import-blocking defects fixed; import verified end to end on an isolated branch

Auditing the deployed code (the live `api.import_legacy_reviews` is `0024`'s `CREATE OR REPLACE`, not `0021`'s) found that the confirmed import could not have worked as the earlier comment implied:

1. **It would fail on the repository snapshot.** The workbook's `Timestamp` column holds Google Sheets day serials (e.g. `46285.60169368055`), which the dry run passed through unchanged as `createdAt`; the RPC then cast that with `::timestamptz`, which fails (`date/time field value out of range`, confirmed on the branch). Missing dates silently became `now()`, which would have made old reviews look new.
2. **Each legacy class planted a permanent unselectable offering.** The import created a `status='rejected'` placeholder offering per class, but no code path ever moves an offering from `rejected` to `approved`. That placeholder would have blocked `api.create_offering` for the same class (unique index) and made `api.resolve_offering_proposal` mark a matching proposal approved while "reusing" the still-rejected row — so item 3's "until an administrator approves them" was unreachable.
3. **There was no way to run it.** `api.import_legacy_reviews` requires the owner's Neon Auth identity, but no UI or script calls it, and a direct DB connection cannot pass `require_owner()`. It was also still executable by `PUBLIC`.

Production has no legacy reviews or import audits yet (checked on a branch forked from production), so no existing data needed repair.

Migration `0031_legacy_review_import_fixes.sql`:
- Moves the logic into `app_private.import_legacy_review_rows(jsonb)` (not executable by any client role) and keeps `api.import_legacy_reviews` as the owner-checked wrapper. `REVOKE ALL ... FROM PUBLIC` on both.
- Legacy reviews no longer touch `offerings`: like student-reported reviews since `0024`, they carry their course/year/semester/section/instructor on the review with `offering_id` and day/time `NULL`, so a historical class becomes selectable only when an administrator creates it through the ordinary offering paths.
- Deduplicates on course, year, semester, whitespace/case-normalized section, and text, enforced by a new partial unique index `reviews_legacy_context_text_unique`.
- Requires an ISO-8601 `createdAt` with an offset instead of defaulting to `now()`. Every rejection names its source row (`legacy row 91: ...`) and rolls back the whole batch.
- Resolves a course code that was merged away before import to its retained course, following `course_merge_audit`.
- `legacy_import_audit` gains `via` (`owner_rpc` | `database_script`). A script import is recorded without an account rather than attributed to one it did not authenticate as.

`scripts/import-legacy-reviews.mjs` (`npm run import:legacy-reviews -- <export.xlsx|export.json>`) now uses the shared `scripts/legacy-review-normalize.mjs`:
- Converts day serials to Bangkok-offset ISO timestamps (`--offset` overrides).
- Normalizes terms to `1`/`2`/`ฤดูร้อน` and Common Era years to Buddhist Era (each conversion is listed under `normalizations`).
- Reports `sourceRows`, `blankRows`, `accepted`, `invalid`, `duplicates`, and `unmatched` with per-row reasons, and refuses to proceed unless they reconcile.
- Checks course codes against `--catalog <file>` or `--catalog-db`.
- `--commit` imports only accepted rows in one transaction as the DB owner, the same way `import:courses --commit` does, and verifies imported + already-present equals accepted before committing. `CreatorEmail`, `Day`, `StartTime`, and `EndTime` are discarded.

Verification:
- `tests/legacy-review-import.test.ts` covers timestamp/term/year normalization, the four-review snapshot matched against its own `Courses` sheet, and a new fresh-export fixture (`tests/fixtures/legacy-reviews-fresh.json`). The fixture has 8 rows: a blank, a spacing-variant duplicate, an unmatched code, three invalid rows, a Common Era year, and a summer term. The tests assert reconciliation and that no fixture email reaches the report.
- `scripts/verify-legacy-review-import.mjs` (`npm run test:legacy-reviews`) passed all 10 checks on `test-legacy-reviews-20260923` (`br-morning-poetry-b3ry1duf`, forked from production and migrated through `0031`), in one rolled-back transaction:
  - Grants: the owner RPC is authenticated-only, the core import is client-inaccessible, and the RPC is denied without the owner identity.
  - The snapshot imports 4 rows and creates 0 offerings. The rows are ownerless, email-free, and keep course/section/term and their original date.
  - A rerun and a spacing-variant section count as duplicates. A bad row names itself and rolls back the batch.
  - An administrator can still create the official offering for a legacy review's class.
  - `list_visible_reviews` returns the legacy review without author, offering, or legacy columns. `update_my_review` and `set_my_review_active` refuse it with `review not found` and write no revision, and no API function assigns `author_user_id`.
  - A merged-away code lands on the retained course. The audit `via`/actor constraint holds.
- Ran the real owner procedure on the same branch: the dry run against the live catalog accepted 4 of 4 with 0 unmatched, `--commit` imported 4, and a second `--commit` imported 0 with 4 already present. Both runs were audited as `database_script`, and the offering count stayed at 1.
- `npm test -- --run` passed 34 tests, `npm run build` passed, and `git diff --check` passed.

Edit and withdraw controls exist only on My Reviews, which lists `list_my_reviews` (author-scoped), so a legacy review never appears there. The course detail page reads `list_visible_reviews`. Item 4 is verified at the data layer and by code review, but stays unchecked until a signed-in browser session shows imported reviews.

**Not yet done:** migration `0031` is not applied to production. The production import itself should use a fresh final export at cutover (spec: "not solely the workbook copy in the repo"), so the repository snapshot was deliberately not imported into production. Status stays `needs-info`.
