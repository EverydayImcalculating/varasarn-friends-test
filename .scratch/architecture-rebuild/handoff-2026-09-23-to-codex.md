# Handoff: architecture-rebuild session → Codex, 2026-09-23

Claude Code hit its usage limit mid-series. This is a from-zero briefing for whichever
agent (Codex or otherwise) continues — read it before touching anything, then follow
its "First read" list, which is the real source of truth.

## What this project is

Varasarn Close Friends: rebuilding a Google-Sheets/Apps-Script course-review-and-timetable
app into Vue 3 + Neon Postgres + Neon Managed Better Auth, deployed on Vercel. The
rebuild is tracked as a series of numbered tickets, each independently verified and
shipped. This is ticket-by-ticket hardening work, not greenfield building — most
tickets already have a first pass; the recurring job has been auditing the *deployed*
behavior against each ticket's checklist and the spec, finding real gaps (not just
checking boxes), fixing them with a migration or code change, verifying on an
isolated Neon branch, then (with explicit owner approval) applying to production.

## First read, in order

1. `AGENTS.md`, `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md`
2. `.scratch/architecture-rebuild/spec.md` — the full spec, all 39 user stories, implementation/testing decisions
3. `git log --oneline -50` — every commit this session made is in this history with a descriptive message; read it before assuming anything is missing
4. `.scratch/architecture-rebuild/issues/15-deployment-and-recovery.md` — most recently closed, read its comments fully for the current pattern
5. `.scratch/architecture-rebuild/issues/16-final-migration-and-cutover.md` — the next ticket, not yet started

## State as of this handoff

- Git: `main` branch, HEAD `319ad2a`, working tree clean, already pushed to `origin/main` (GitHub: `EverydayImcalculating/varasarn-friends-test`).
- Migrations: `0000`–`0031` all applied to **production** (confirmed live, not just locally). Migration count in `drizzle.__drizzle_migrations` was 32 as of ticket 14/15.
- `npm test -- --run`: 37 tests passing across 9 files. `npm run build` passing. `npm run preview` (new this session) boots the production build cleanly.
- Tickets 01–15 are all in `Status: needs-info` — **this is the expected terminal state for this whole series**, not a stall. Every one of them ends on the same single blocker: live two-account Google sign-in acceptance testing in a real browser. No test-account credentials exist anywhere in this repo or any session. **Do not attempt to obtain or enter Google credentials under any circumstance** — surface this to the user instead, same as every prior session did.
- Ticket 16 (final migration and cutover) is the last one and has not been started.

## The established workflow (repeat this for ticket 16 and anything after)

1. Read the ticket file. Don't trust its checkboxes at face value — grep `db/drizzle/*.sql` for the actual current definition of anything it references (later migrations `CREATE OR REPLACE` earlier ones; always find the *latest* version of a function before judging it).
2. Check grants: `SELECT grantee FROM information_schema.routine_privileges WHERE routine_schema='api' AND routine_name='...'`. This series found and fixed the same bug repeatedly — `0001_security_api.sql`'s `ALTER DEFAULT PRIVILEGES` never took effect, so new functions default to executable by PostgreSQL `PUBLIC`. As of migration `0031` this has been fixed for every function touched by tickets 06–15; a background audit task (`task_3ac0b026`, spawned early in this series) covers the rest — don't duplicate it, only fix what's in scope for the ticket at hand.
3. If there's a real behavioral gap (this series found several — missing validation, dead-end placeholder rows, unrunnable RPCs, undocumented-but-real mechanisms), write a migration: `npx drizzle-kit generate --custom --name=...`, then **delete the stray `meta/NNNN_snapshot.json`** it also creates (keep the `meta/_journal.json` diff, that's expected and correct), then hand-write the SQL. Look at any migration from `0025` onward for house style (single-line `plpgsql` bodies, `--> statement-breakpoint` separators, `REVOKE ALL ... FROM PUBLIC` alongside every new `GRANT`).
4. Verify on an isolated Neon branch before touching production:
   ```
   neon branches create --project-id soft-surf-84712820 --parent production --name test-<slug>-<date> --expires-in 1d
   ```
   **The project is at its branch limit (10/10) right now.** Current branches:
   `test-legacy-reviews-20260923` (`br-morning-poetry-b3ry1duf`, migrated through `0031` — the freshest, prefer reusing this one), `production`, `test-review-lifecycle-20260923`, `test-review-moderation-20260923`, `test-bulk-import-20260923`, `test-review-discovery-20260923`, `test-student-reviews-20260923` (auto-expires 2026-09-24T18:00:00Z), `test-offering-proposals-20260923`, `recovery-verify-20260923` (**keep** — it's cited as evidence in ticket 15), `recovery-before-0023`. If you need a new branch, either wait for `test-student-reviews-20260923` to auto-expire or delete one of the older superseded `test-*` branches after confirming its ticket is fully closed.
5. Get the branch's connection string **without ever printing it to the transcript** — a Neon project's `db_owner` password is shared across all its branches, so printing any branch's connection string leaks the same password that's already pending rotation (see below). Pattern used throughout this session:
   ```bash
   neon connection-string <branch> --project-id soft-surf-84712820 --role-name db_owner --pooled false > <scratchpad>/x.url 2>/dev/null && chmod 600 <scratchpad>/x.url
   ```
   then `DATABASE_URL_UNPOOLED="$(cat <scratchpad>/x.url)"` in each command, and delete the file when done with that branch.
6. Apply migrations to the branch: `DATABASE_URL_UNPOOLED=... npx drizzle-kit migrate`.
7. Write `scripts/verify-<slug>.mjs` (see `scripts/verify-legacy-review-import.mjs` or `scripts/verify-pause-writes.mjs` for the current best examples): one script, asserts against real error messages/grant state, uses `SAVEPOINT`/`ROLLBACK TO SAVEPOINT` for expected failures where a single rolled-back transaction is possible — but note `scripts/verify-pause-writes.mjs` deliberately does **not** use a single transaction, because grant changes need separate connections to observe, so it does real commits and instead asserts an exact before/after restore. Add an `npm run test:<slug>` entry in `package.json`.
8. Add/extend unit tests in `tests/` for any pure logic or client-side service method. If a `.mjs` module needs to be imported from a `.ts` test file, add a matching `.d.mts` declaration file next to it (see `scripts/legacy-review-normalize.d.mts` for the pattern) or `vue-tsc -b` (part of `npm run build`) will fail.
9. Run `npm test -- --run` and `npm run build` after every change. `git diff --check` before committing (catches trailing whitespace in generated SQL).
10. Commit and push to `origin/main` after each verified step. Attribution line depends on which model is running — check the system prompt's attribution instructions each session, don't hardcode what a prior session used.
11. **Do not run `npm run db:migrate` against production yourself** — it is sandbox-blocked in Claude Code as a production-deploy action (this may or may not apply to Codex's own sandboxing; check, don't assume it's fine just because the tool name is different). Stop, summarize what's ready, and ask the user to run it. `.env.local` already has production credentials configured (`NEON_BRANCH=production`) — the exact command the user needs is:
    ```bash
    DATABASE_URL_UNPOOLED="$(grep '^DATABASE_URL_UNPOOLED=' .env.local | cut -d= -f2- | sed 's/^"//; s/"$//')" npm run db:migrate
    ```
    (plain `npm run db:migrate` fails — drizzle-kit doesn't auto-load `.env.local`, only `.env` — this tripped up two rounds of back-and-forth this session, don't repeat it). Wait for the user to confirm `migrations applied successfully!` actually printed — a truncated paste that cuts off before the success/failure line is not confirmation; verify directly against the database yourself (read-only) if there's any doubt.
12. After the user confirms the migration ran, also run (or ask them to run) `neon data-api refresh-schema --project-id soft-surf-84712820 --branch production`, verify live (grants, function existence, migration count, and that `https://varasarn-friends-test-tau.vercel.app/` serves matching asset hashes after Vercel redeploys — compare against a fresh local `npm run build`'s `dist/assets/` filenames), then record that as a second dated comment on the ticket and commit.
13. Update the ticket's checkboxes only for what's actually been verified (isolated-branch script or live check); leave anything requiring a real browser session unchecked; always add a dated `## Comments` entry — never silently edit the checklist without one.

## Things that went wrong this session — don't repeat them

- **Never print a full Neon connection string to the transcript.** Early in this session, `neon connection-string production ...` was run directly (twice), printing the production `db_owner` password in full into the chat log. The user has been told to rotate it; **this is still pending** (tracked in this machine's Claude Code memory at `project_db-owner-password-rotation-pending.md` — if you're Codex and don't share that memory store, treat this paragraph as the transfer of that fact). Once the user confirms rotation, `.env.local`'s `DATABASE_URL`/`DATABASE_URL_UNPOOLED` and any Vercel env vars referencing it need updating, and the app's continued connectivity re-verified. Until rotation is confirmed, keep treating the current password as sensitive and avoid printing it again.
- **A sandbox permission block is not something to route around.** When a tool call is denied by an "Auto-Mode"-style classifier, don't retry via `source`, alternate flags, or a different tool that reaches the same effect — stop and tell the user plainly what was attempted and why, and let them run it themselves or explicitly grant it.
- **A truncated command-output paste from the user is not confirmation of success.** Twice this session, a `db:migrate` run's pasted output cut off before the success/failure line, and it turned out the command hadn't actually finished (or, the second time, genuinely had). Verify against the database directly rather than assuming from an ambiguous paste.
- **Attribute actions to who actually took them.** A ticket comment initially said "ran `npm run db:migrate`" for a command the *user* ran, not the agent — caught and corrected once flagged. Keep production-action ticket comments accurate about who did what.

## Model guidance (from the original series brief, still holds)

Ticket 16 (final cutover) is dense/high-stakes — the original brief flagged it, along
with ticket 14 (already done), as worth defaulting to a stronger model rather than
starting cheap and escalating. If Codex has an equivalent effort/model tier, use it
for ticket 16 from the start rather than discovering mid-ticket that it needed more.

## Ticket 16 starting context

Not yet opened this session. Read `.scratch/architecture-rebuild/issues/16-final-migration-and-cutover.md`
and its `Blocked by:` line before doing anything else — it very likely depends on a
fresh final spreadsheet export (per the spec: "not solely the workbook copy in the
repo") and on the live Google sign-in acceptance blocker every other ticket has been
deferring, so it may turn out to be mostly owner-gated rather than agent-actionable.
Don't assume; read it first.
