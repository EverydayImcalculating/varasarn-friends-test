# 15: Repeatable deployment and recovery

**What to build:** The project owner can deploy a production-like build and recover the database from a maintained export without relying on memory or routine manual backups.

Blocked by: 01 Authenticated catalog and anonymous review tracer

Status: ready-for-agent

- [ ] Deployment instructions identify the required Google, Neon, and Vercel configuration, safe secret handling, environment separation, and a production-like build check.
- [ ] An automated export or equivalent recovery mechanism retains usable database backups without routine manual action and documents retention and access control.
- [ ] A restore exercise into an isolated environment succeeds, with course/review counts and access policies verified after recovery.
- [ ] Current free-tier terms and quotas, including Vercel eligibility and Neon's idle-resume behavior, are checked before launch; an eligible static-host fallback is documented if Vercel terms do not fit.
- [ ] The recovery procedure explains how to pause cutover or return to the old read-only data export without silently losing new writes.

