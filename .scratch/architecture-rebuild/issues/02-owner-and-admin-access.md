# 02: Owner and administrator access

**What to build:** The project owner can assign or revoke administrator access for verified Google accounts in the app, and an administrator can reach a protected dashboard without gaining owner-only powers.

Blocked by: 01 Authenticated catalog and anonymous review tracer

Status: needs-info

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

### 2026-09-23 — Owner role-management controls added

The dashboard now renders the owner-only membership list and verified-account list, with explicit appoint and revoke controls. Administrators do not receive this panel. Each action calls the existing owner-checked Data API RPC rather than trusting browser state. Service tests cover the role RPC selection; deployed two-account acceptance remains to be recorded.

### 2026-09-23 — Owner panels were blocked by a moderation-list bug

`openDashboard()` loads categories, courses, periods, proposals, and moderation reviews in sequence inside one `try`, and only then loads the owner's role assignments and verified accounts. `api.list_moderation_reviews` has thrown `column reference "id" is ambiguous` on every call since `0012`, so for the owner the role-management lists never loaded and the dashboard showed that error instead. The root cause is fixed in `0028_list_review_moderation_audit.sql` (see Ticket 11), which isn't yet applied to production. No change to this ticket's own RPCs was needed; `list_role_assignments` and `list_verified_accounts` both executed cleanly in the same branch probe.
