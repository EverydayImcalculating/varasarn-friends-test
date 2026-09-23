# 15: Repeatable deployment and recovery

**What to build:** The project owner can deploy a production-like build and recover the database from a maintained export without relying on memory or routine manual backups.

Blocked by: 01 Authenticated catalog and anonymous review tracer

Status: needs-info

- [x] Deployment instructions identify the required Google, Neon, and Vercel configuration, safe secret handling, environment separation, and a production-like build check.
- [x] An automated export or equivalent recovery mechanism retains usable database backups without routine manual action and documents retention and access control.
- [x] A restore exercise into an isolated environment succeeds, with course/review counts and access policies verified after recovery.
- [x] Current free-tier terms and quotas, including Vercel eligibility and Neon's idle-resume behavior, are checked before launch; an eligible static-host fallback is documented if Vercel terms do not fit.
- [x] The recovery procedure explains how to pause cutover or return to the old read-only data export without silently losing new writes.

## Comments

### 2026-09-23 — Platform constraints recorded for release review

The recovery guide now records that Vercel Hobby must be reassessed for organization or commercial use and documents a static-host fallback for the built Vite output. It also records Neon’s normal five-minute idle transition and requires an idle-resume request in the production-like check. Snapshot creation and isolated-branch restore instructions remain the recovery mechanism; a completed restore exercise and launch-time plan review still require owner-controlled external evidence.

### 2026-09-23 — Production recovery snapshot created

Created Neon snapshot `snap-wispy-river-b3otmaob` (`recovery-20260923T085735Z`) from the production branch at `2026-09-23T08:57:37Z`. The snapshot is now listed by `neon snapshots list --branch production`. An isolated restore exercise and post-restore permission/count verification remain required before cutover.

### 2026-09-23 — Isolated restore exercise verified

Restored `snap-wispy-river-b3otmaob` to the non-finalized isolated branch `recovery-verify-20260923` (`br-damp-king-b33kw7dp`) without changing production. The branch reached `ready`. A branch-scoped read-only verification returned 209 courses, 1 offering, and 0 reviews; a policy check found RLS enabled on 17 `app_private` tables. The restore remains un-finalized and is available for inspection.

### 2026-09-23 — Automatic backup documented, a real "stop writes" mechanism built, and free-tier claims checked against current terms

Re-auditing this ticket against the actual project state and current external terms (not just the checklist wording) turned up one real gap and confirmed two things the existing docs already claimed correctly:

**Item 2 was unmet as written.** The only recovery mechanism `docs/recovery.md` described was `npm run recovery:snapshot`, a manual step required "before every migration or cutover" — exactly the "routine manual action" item 2 says not to depend on. But `neon projects get soft-surf-84712820 --output json` shows `history_retention_seconds: 21600` (6 hours), confirmed against Neon's current docs as the Free plan's fixed default *and* maximum instant-restore (point-in-time restore) window — a continuous, fully automatic backup that already exists with zero manual action, and was simply never documented. `docs/recovery.md` now documents both: the automatic 6-hour window as the no-action baseline, and named snapshots (kept until deleted) for a checkpoint that outlives it. Access control for both is the same Neon project-owner access already required for the production branch.

**Item 5 was a one-line aspiration, not a procedure.** "Stop new writes and return to the old export read-only before restoring" didn't say how to stop writes on a live app with no backend server (every write is a direct RPC call from the browser to Neon's Data API). Built `scripts/pause-writes.mjs` (`npm run recovery:freeze` / `recovery:unfreeze` / `recovery:status`): it revokes (and restores) `authenticated`'s `EXECUTE` grant on every *mutating* `api` RPC, derived at call time from the same `list_*`/`preview_*`/`current_access` read-only naming convention `0001_security_api.sql` established — not a maintained list, so it keeps working as migrations add functions, as long as new read-only RPCs keep following that convention (checked against every one of the 19 currently deployed read functions' bodies, not assumed). This makes the app go genuinely read-only in place during a pause, which is what makes "return to the old export read-only" concrete: the new database is the one held read-only, so there's never a window where both the old export and the new database could accept diverging writes.

Verified on an isolated branch (`test-legacy-reviews-20260923`, `br-morning-poetry-b3ry1duf`, migrated through `0031`) via `npm run test:pause-writes` (`scripts/verify-pause-writes.mjs`), 5/5 checks, using real commits rather than a rolled-back transaction since grant visibility across connections requires it, with an explicit before/after grant-set comparison as the safety net instead:
- Baseline: all 42 `api` functions granted to `authenticated`.
- Freeze revokes exactly the 23 write functions (`create_*`, `update_*`, `add_*`/`remove_*`/`clear_*`/`replace_*` timetable RPCs, `merge_course`, `moderate_review`, `grant_administrator`/`revoke_administrator`, etc.) and leaves all 19 read functions untouched.
- As the `authenticated` role specifically (not `db_owner`): a write RPC is denied with `permission denied for function clear_my_timetable`, and a read RPC (`list_categories`) still returns rows.
- `recovery:status` reports `"paused": true`.
- Unfreeze restores the exact pre-freeze grant set (`stillWritable` matches the original 23 exactly; `readBroken` empty throughout).

A pinned unit test (`tests/pause-writes.test.ts`) locks the read/write classification against the 42 function names currently deployed in production, so a rename or a new function that breaks the naming convention fails a fast local test instead of silently mis-classifying in `recovery:freeze`.

**Item 1's "production-like build check" was thinner than it looked.** `npm run build` type-checks and bundles but never proves the bundle boots — `vite preview` (serves the built `dist/` exactly as a static host would) wasn't scripted or documented anywhere. Added `npm run preview` and ran it: the built output boots with no console errors and renders the Thai sign-in screen, confirmed in a real browser. `scripts/release-gate.sh` now also boots the preview server headlessly and confirms it serves its bundled script (a shell script can't execute the client-side Vue render, so this catches a build/serve failure; the actual rendered-screen check stays a browser step, documented in the README). Checked "environment separation" against the existing README: dev (`.env.local`, browser-safe `VITE_*` vars) vs. Vercel Preview/Production vs. the database-owner-only `DATABASE_URL` are already kept distinct there — no gap found beyond the build-check one.

**Item 4 (free-tier terms) re-verified against current external documentation**, not just re-stated: Vercel's Hobby plan page still states "the Hobby plan restricts users to non-commercial, personal use only" (fetched 2026-09-23). Neon's Scale to Zero docs confirm the 5-minute idle-suspend and sub-second-to-low-hundreds-of-milliseconds resume, fixed on the Free plan, matching what `docs/recovery.md` already said. Both citations are now noted inline in the doc. Whether this project's actual operating/payment arrangement qualifies as Hobby-eligible is still an owner judgment call, not something checkable from here.

`npm test -- --run` passed 37 tests (9 files), `npm run build` passed, `npm run preview` boots cleanly, `bash scripts/release-gate.sh`'s automated portion passes, and `git diff --check` passed.

**Not yet done:** whether this project's actual operating/payment arrangement is Hobby-eligible (item 4) is an owner decision this session cannot make or gather evidence for. Status stays `needs-info`, waiting on that call rather than on any further code or documentation work.
