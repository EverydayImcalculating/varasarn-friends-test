# 10: Author review lifecycle

**What to build:** A review author can manage their own contributions in My Reviews without losing earlier versions or creating duplicate reviews.

Blocked by: 01 Authenticated catalog and anonymous review tracer

Status: needs-info

- [ ] My Reviews lists only the signed-in user's reviews and exposes edit, withdraw, and republish actions for eligible records.
- [ ] Editing a rating or text atomically retains an immutable prior revision and updates the current version; only the author can inspect their full history.
- [ ] Withdrawal removes the review from shared reads while retaining its content and revision history; republishing reuses the same review record.
- [ ] Author withdrawal is separate from administrator moderation and cannot undo an administrator's hidden or removed status.
- [ ] Other users and administrators cannot edit the author's rating or text or browse private revisions via direct requests; tests cover revision and visibility transitions.

## Comments

### 2026-09-23 — My Reviews edit controls aligned

My Reviews now follows the original two-column card layout, with edit, withdraw, and republish actions. Editing uses the existing author-scoped `update_my_review` RPC, validates rating and text in the typed service, and refreshes the private list after save. `npm test -- --run` passed 22 tests and `npm run build` passed. Revision-history and cross-account acceptance evidence remain open.
