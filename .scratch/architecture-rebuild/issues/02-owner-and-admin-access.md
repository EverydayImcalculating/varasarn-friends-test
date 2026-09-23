# 02: Owner and administrator access

**What to build:** The project owner can assign or revoke administrator access for verified Google accounts in the app, and an administrator can reach a protected dashboard without gaining owner-only powers.

Blocked by: 01 Authenticated catalog and anonymous review tracer

Status: ready-for-agent

- [ ] The initial owner is established through a controlled, documented bootstrap tied to a verified account; possession of an email string or browser-side setting does not grant a role.
- [ ] The owner can find a verified account, grant or revoke its administrator role, and see the resulting membership in the dashboard.
- [ ] Role changes record actor, target, action, and time in an append-only audit trail.
- [ ] Ordinary users and administrators cannot grant or revoke roles, including through direct data requests; role changes take effect without sharing credentials.
- [ ] The administrator dashboard denies ordinary users, while owner-only controls deny non-owner administrators; automated permission tests cover each identity.
- [ ] The dashboard is clearly distinguished from student screens but uses the same branded header, typography, colors, and navigation patterns on desktop and mobile.

## Comments

### 2026-09-23 — Local role model and dashboard implemented

Added the private role membership and append-only role audit tables, a verified-Google membership trigger, and owner-checked Data API RPCs for current access, listing verified accounts, listing assigned roles, granting administrator access, and revoking it. The migration is applied to the linked Neon production branch and its Data API schema cache was refreshed.

The Vue dashboard is visible only after the database reports an owner or administrator role. Administrators see no role-management controls; owner changes go through database-enforced RPCs. The initial owner remains unconfigured because it requires a completed verified Google sign-in; use `db/bootstrap-owner.sql` with database-owner access after OAuth is enabled. Browser and cross-account acceptance therefore remain deferred with Ticket 01's OAuth/Vercel work.

### 2026-09-23 — Initial owner bootstrapped

The earliest verified Google account on the linked production branch was assigned the sole `owner` role through the database-owner bootstrap transaction. The membership and `bootstrap_owner` audit entry were verified. The ticket no longer needs external identity information; remaining work is deployed owner/dashboard and cross-account acceptance.
