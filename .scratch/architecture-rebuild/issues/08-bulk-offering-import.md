# 08: Bulk offering import

**What to build:** An administrator can load many offerings in one operation and inspect errors before the approved catalog changes.

Blocked by: 06 Approved offerings and academic periods

Status: needs-info

- [ ] The dashboard accepts a structured offering import, previews normalized course references, academic periods, sections, instructors, and meeting intervals, and reports row-level errors.
- [ ] Unknown or archived courses, invalid times, and duplicate active offerings are surfaced before confirmation; repeated import does not create duplicates.
- [ ] A confirmed import creates or updates only valid approved offerings under administrator authority and records an audit summary.
- [ ] Signed-in users see imported offerings on their courses; ordinary users cannot invoke the import through direct requests.
- [ ] Automated tests cover valid batches, partial invalid input, duplicate detection, and idempotent reruns.

## Comments

### 2026-09-23 — Import preflight corrected and applied

Migration `0023_offering_import_preflight.sql` now returns numbered row-level errors for malformed values, unknown or archived courses, missing academic periods, duplicate batch rows, unapproved existing sections, and ambiguous multi-meeting corrections. It distinguishes create, update, and existing approved sections. Confirmation calls the same preview rules, changes approved offerings only, and records created, updated, and unchanged counts in the private import audit. Ordinary requests remain gated by `require_administrator()`.

The migration passed on isolated branch `br-icy-river-b3586tpc`. `scripts/verify-offering-import.mjs` exercised denial without identity, invalid rows, atomic rejection, create, update, and idempotent rerun within a rolled-back transaction. `npm test -- --run` passed 22 tests and `npm run build` passed. The production snapshot limit was reached, so `br-royal-cloud-b3il882w` was created from production at parent LSN `0/1DE35D8` before applying the migration. Production now has 24 Drizzle migrations, both import RPCs, and the new audit count; the Data API cache was refreshed for database `db`. Dashboard upload and browser acceptance remain open.
