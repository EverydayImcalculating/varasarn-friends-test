# 04: Course import and reconciliation

**What to build:** The project owner can load course data from a spreadsheet export, inspect validation and reconciliation results, and see the imported catalog in the rebuilt app.

Blocked by: 03 Course and category management

Status: ready-for-agent

- [ ] A repeatable import accepts the existing workbook snapshot and a fresh export fixture, including the headerless Courses sheet, without using spreadsheet row positions as permanent IDs.
- [ ] Import normalizes course codes, names, and categories; duplicate or invalid rows are reported with source references before data is committed.
- [ ] A dry run reports source counts, accepted rows, duplicates, and resulting catalog counts; a confirmed run is idempotent and makes imported courses searchable in the app.
- [ ] Import cannot silently overwrite administrator corrections or grant roles; counts and relationships are checked after commit.
- [ ] Tests use the repository snapshot and a fresh-export fixture, including changed rows and duplicate codes; final production counts are intentionally deferred until cutover.

