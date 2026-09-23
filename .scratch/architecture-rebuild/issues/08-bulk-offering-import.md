# 08: Bulk offering import

**What to build:** An administrator can load many offerings in one operation and inspect errors before the approved catalog changes.

Blocked by: 06 Approved offerings and academic periods

Status: needs-info

- [x] The dashboard accepts a structured offering import, previews normalized course references, academic periods, sections, instructors, and meeting intervals, and reports row-level errors.
- [x] Unknown or archived courses, invalid times, and duplicate active offerings are surfaced before confirmation; repeated import does not create duplicates.
- [x] A confirmed import creates or updates only valid approved offerings under administrator authority and records an audit summary.
- [x] Signed-in users see imported offerings on their courses; ordinary users cannot invoke the import through direct requests.
- [x] Automated tests cover valid batches, partial invalid input, duplicate detection, and idempotent reruns.

## Comments

### 2026-09-23 — Import preflight corrected and applied

Migration `0023_offering_import_preflight.sql` now returns numbered row-level errors for malformed values, unknown or archived courses, missing academic periods, duplicate batch rows, unapproved existing sections, and ambiguous multi-meeting corrections. It distinguishes create, update, and existing approved sections. Confirmation calls the same preview rules, changes approved offerings only, and records created, updated, and unchanged counts in the private import audit. Ordinary requests remain gated by `require_administrator()`.

The migration passed on isolated branch `br-icy-river-b3586tpc`. `scripts/verify-offering-import.mjs` exercised denial without identity, invalid rows, atomic rejection, create, update, and idempotent rerun within a rolled-back transaction. `npm test -- --run` passed 22 tests and `npm run build` passed. The production snapshot limit was reached, so `br-royal-cloud-b3il882w` was created from production at parent LSN `0/1DE35D8` before applying the migration. Production now has 24 Drizzle migrations, both import RPCs, and the new audit count; the Data API cache was refreshed for database `db`. Dashboard upload and browser acceptance remain open.

### 2026-09-23 — Dashboard import UI built; the server-side work had no UI to drive it

`api.preview_offering_import` and `api.bulk_import_offerings` were deployed since the previous comment, and `AdminService.previewOfferingImport`/`bulkImportOfferings` already existed as typed clients — but nothing in `src/App.vue` called either one. The dashboard had no way to actually run an import; this was a real gap, not just missing evidence.

Added a "นำเข้ากลุ่มเรียนจำนวนมาก" section to the dashboard: a JSON textarea for the row batch, a "ตรวจสอบ" button that calls `previewOfferingImport` and renders a table of every row's course, term, section, and status (create/update/unchanged/error with its reason), and a "ยืนยันนำเข้า" button — disabled until a preview has run — that calls `bulkImportOfferings` and shows the resulting created/updated/unchanged counts. Added a unit test for `previewOfferingImport` (there was none) alongside the existing `bulkImportOfferings` test in [tests/admin-service.test.ts](../../../tests/admin-service.test.ts).

Verified live and on an isolated branch:
- `rpc/preview_offering_import` and `rpc/bulk_import_offerings` on the production Data API both reject an unauthenticated request with `HTTP 400`, missing credentials — ordinary/anonymous requests cannot invoke the import.
- Re-ran `scripts/verify-offering-import.mjs` against a fresh branch (`test-bulk-import-20260923`, `br-shy-tooth-b36d5jmp`) forked from current production (27 migrations, including the Ticket 06/07 fixes): row errors, atomic rejection, create, update, existing, and idempotent rerun all still pass.
- Imported offerings need no separate "make visible" step: a created row lands directly in `offerings` with `status='approved'`, which is exactly what `list_approved_offerings` and the student course-detail view already read, so a signed-in user sees it automatically.

`npm test -- --run` passed 26 tests, `npm run build` passed, and `git diff --check` passed. Checked off every checklist item — the dashboard flow, row-level validation, atomic confirmed import with audit, visibility plus denied direct access, and automated coverage are all implemented and verified through the data interface.

**Not yet done:** a real administrator has never actually used the new dashboard form in a browser — the UI was built and typechecks/builds, but live acceptance still needs a signed-in Google admin session, same blocker as Tickets 01, 06, 07, and 09. Status stays `needs-info` for that reason alone.
