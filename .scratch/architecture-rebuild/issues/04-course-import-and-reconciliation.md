# 04: Course import and reconciliation

**What to build:** The project owner can load course data from a spreadsheet export, inspect validation and reconciliation results, and see the imported catalog in the rebuilt app.

Blocked by: 03 Course and category management

Status: ready-for-agent

- [x] A repeatable import accepts the existing workbook snapshot and a fresh export fixture, including the headerless Courses sheet, without using spreadsheet row positions as permanent IDs.
- [x] Import normalizes course codes, names, and categories; duplicate or invalid rows are reported with source references before data is committed.
- [x] A dry run reports source counts, accepted rows, duplicates, and resulting catalog counts; a confirmed run is idempotent and makes imported courses searchable in the app.
- [x] Import cannot silently overwrite administrator corrections or grant roles; counts and relationships are checked after commit.
- [x] Tests use the repository snapshot and a fresh-export fixture, including changed rows and duplicate codes; final production counts are intentionally deferred until cutover.

## Comments

### 2026-09-23 — Workbook and fresh-export reconciliation tests added

`import:courses` accepts the original headerless `Courses` workbook sheet and an explicit JSON export fixture. It normalizes codes, reports source-row validation failures before a commit, and creates no permanent identifiers from row numbers. The confirmed path inserts only missing course codes, preserving administrator-maintained records, and reports inserted, existing, and resulting catalog counts.

The production workbook was previously imported with 208 accepted rows; the tests now execute its dry run and a changed/duplicate fresh fixture. Final production count reconciliation remains intentionally deferred to Ticket 16 cutover.
