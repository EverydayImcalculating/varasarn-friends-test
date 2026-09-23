# 15: Repeatable deployment and recovery

**What to build:** The project owner can deploy a production-like build and recover the database from a maintained export without relying on memory or routine manual backups.

Blocked by: 01 Authenticated catalog and anonymous review tracer

Status: needs-info

- [ ] Deployment instructions identify the required Google, Neon, and Vercel configuration, safe secret handling, environment separation, and a production-like build check.
- [ ] An automated export or equivalent recovery mechanism retains usable database backups without routine manual action and documents retention and access control.
- [ ] A restore exercise into an isolated environment succeeds, with course/review counts and access policies verified after recovery.
- [ ] Current free-tier terms and quotas, including Vercel eligibility and Neon's idle-resume behavior, are checked before launch; an eligible static-host fallback is documented if Vercel terms do not fit.
- [ ] The recovery procedure explains how to pause cutover or return to the old read-only data export without silently losing new writes.

## Comments

### 2026-09-23 — Platform constraints recorded for release review

The recovery guide now records that Vercel Hobby must be reassessed for organization or commercial use and documents a static-host fallback for the built Vite output. It also records Neon’s normal five-minute idle transition and requires an idle-resume request in the production-like check. Snapshot creation and isolated-branch restore instructions remain the recovery mechanism; a completed restore exercise and launch-time plan review still require owner-controlled external evidence.

### 2026-09-23 — Production recovery snapshot created

Created Neon snapshot `snap-wispy-river-b3otmaob` (`recovery-20260923T085735Z`) from the production branch at `2026-09-23T08:57:37Z`. The snapshot is now listed by `neon snapshots list --branch production`. An isolated restore exercise and post-restore permission/count verification remain required before cutover.
