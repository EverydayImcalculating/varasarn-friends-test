# Handoff: Codex to Claude Code — 2026-09-23

## Purpose

Continue the Varasarn Close Friends architecture rebuild from a clean Claude Code session. The original architecture goal is currently **paused** after all work that can be completed without owner browser access was done. Do not restart tickets or reopen settled decisions.

## First read, in order

1. `AGENTS.md`
2. `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, and `docs/agents/domain.md`
3. `.scratch/architecture-rebuild/spec.md`
4. `git log --oneline -20`
5. `.scratch/architecture-rebuild/issues/16-final-migration-and-cutover.md`
6. `.scratch/review-to-timetable/spec.md`
7. This file in full

There is no `CONTEXT.md` or ADR directory in this repository. Continue silently if they remain absent.

## Repository and deployment state

- Repository: `EverydayImcalculating/varasarn-friends-test`
- Branch: `main`
- HEAD: `7cfbef1 Record deployed review timetable bundle`
- Working tree was clean at handoff time.
- Test deployment: `https://varasarn-friends-test-tau.vercel.app/`
- Latest application implementation commit: `1388280 Allow private timetable entries from review schedules`
- The test site has deployed that implementation. It serves `assets/index-B__722L_.js`, whose SHA-256 matched the local production build at deployment time.
- `npm test` passed: 69 tests in 12 files.
- `npm run build` passed. Vite reports a pre-existing warning that the application bundle is a little over 500 kB; it is not a release failure for this task.

## What was completed since the earlier handoff

The original review-to-timetable implementation required a unique approved offering. The user's signed-in AP164 screenshot showed a valid review schedule but the unavailable message and no add button. That did not match the old site flow.

The new decision and implementation are:

- A visible review with a valid reported section, term, academic year, day, start, and end time now shows the green Thai `เพิ่มลงตาราง` action even when no unique approved offering exists.
- When there is a unique approved offering with official meeting data, the timetable uses that official offering and its official schedule.
- Otherwise the selection is a private, account-scoped snapshot of the review schedule. It does not create, approve, or modify a shared offering.
- The timetable labels a private entry `ข้อมูลจากรีวิว`; it can be removed, is cleared by the existing clear action, and is replaced when the same user selects an official or another reported section for the same course.
- The existing confirmation flow remains: warn about replacing a same-course selection or overlap, save, then offer to open the timetable.

### Database state

Migration `db/drizzle/0032_review_backed_timetable.sql` is committed and applied to both:

- isolated test branch `test-legacy-reviews-20260923` (`br-morning-poetry-b3ry1duf`), then verified;
- Neon production branch, where `drizzle.__drizzle_migrations` now has 33 rows.

Neon Data API schema cache for production database `db` was refreshed after the production migration.

New authenticated-only RPCs:

- `api.list_my_reported_timetable()`
- `api.add_my_timetable_review(uuid)`
- `api.remove_my_timetable_review(uuid)`

`app_private.timetable_review_selections` is private: no `PUBLIC`, `anonymous`, or `authenticated` table privilege exists. The RPCs grant execute to `authenticated`, not `anonymous`. Do not expose the table or review author identity through Data API views or responses.

The migration also updates official timetable add/replace/clear and course merge behavior so an account has a single choice for a course across official and review-backed selections.

### Verification completed

- `scripts/verify-review-timetable.mjs` ran against the isolated test branch in a rolled-back transaction. It proved private add, account isolation, no shared offering creation, official/reported replacement, remove, clear, and rejection of hidden reviews.
- `scripts/verify-timetable.mjs` ran successfully against the same branch after being extended for the new RPC grants.
- Unit and Vue integration tests cover the review dialog button, official and reported paths, conflict/replacement prompts, save failures, removal, and the timetable label.

## Remaining work and real blockers

### Immediate browser acceptance: review-to-timetable

This is the next actionable task when the owner can use the signed-in test site. It is tracked as `Status: needs-info` in `.scratch/review-to-timetable/spec.md`.

Ask the owner to refresh the signed-in test site, open AP164, and send screenshots of:

1. The AP164 review dialog showing the review's reported schedule and green `เพิ่มลงตาราง` button.
2. The replacement or success prompt after selecting it.
3. The personal timetable showing the entry with `ข้อมูลจากรีวิว`.
4. The review dialog at a narrow viewport.

If the user instead provides an observation or screenshot indicating a fault, diagnose it and implement only the required correction. Do not ask for or use their Google credentials.

### Architecture ticket 16: final migration and cutover

Ticket 16 remains `needs-info`. Its remaining requirements are owner-controlled:

- a fresh final production spreadsheet export and reconciliation;
- real two-account Google sign-in acceptance checks;
- owner decision to activate the production deployment/cutover;
- password rotation after an earlier session accidentally printed a Neon `db_owner` connection string. Treat every current connection string and its password as sensitive. Do not print it. If the owner rotates it, update local/Vercel environment values and verify connectivity.

Do not claim ticket 16 is complete, and do not activate a production cutover without explicit owner instruction and evidence.

## Important operational constraints

- The original architecture goal is paused. Resume only if the user explicitly asks to resume it, or continue a narrowly requested item without changing the goal state.
- All architecture tickets have `Status: needs-info`. This is expected because they await real browser acceptance and owner actions, not because implementation is missing.
- Before changing architecture-ticket behavior, read the ticket and latest definitions in `db/drizzle/*.sql`: later migrations replace prior PostgreSQL functions.
- The Neon project ID is `soft-surf-84712820`. The branch limit was reached previously; reuse the existing test branch only after checking its current state, or create a branch only when a slot is available.
- Never print Neon connection strings or database passwords. Generate a connection string only into an in-process variable or protected scratch file, pass it as an environment variable to a command, and redact it on errors.
- Production migration 0032 has already been applied. Never re-run it manually. Any future migration must first be verified on an isolated branch.
- `drizzle-kit` does not load `.env.local` automatically. Do not print or paste its secrets. Use an in-memory environment variable only when an authorized database command is necessary.
- Do not obtain, enter, or request Google credentials. Browser acceptance must be performed by the owner in their existing session.
- Keep the original visual language. The original screenshots are the acceptance reference: purple modal header, white card, green timetable action, native confirmation prompt, and colored timetable grid.

## Files most relevant to a follow-up

- `src/App.vue` — review dialog and timetable UI.
- `src/services/timetable-client.ts` — merges official and review-backed account selections.
- `db/drizzle/0032_review_backed_timetable.sql` — private selection storage and RPCs.
- `tests/review-to-timetable-app.test.ts` — signed-in UI seam.
- `scripts/verify-review-timetable.mjs` — real isolated-branch database checks.
- `.scratch/review-to-timetable/spec.md` — final behavior and acceptance evidence.
- `.scratch/architecture-rebuild/issues/16-final-migration-and-cutover.md` — final owner-gated release ticket.

## Recommended Claude Code continuation

Use a strong model and medium/high reasoning for ticket 16 or a real database/security regression. For screenshot-led UI polish, a medium reasoning coding model is sufficient.

If there is no new owner evidence, do not churn through the existing tickets. State the concrete blocker and leave their `needs-info` status intact. If the owner sends the requested screenshots, review them against the spec, update the corresponding dated ticket comment with the actual evidence, and only then decide whether a code change is necessary.
