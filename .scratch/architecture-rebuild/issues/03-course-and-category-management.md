# 03: Course and category management

**What to build:** An administrator can maintain the course catalog and categories in the dashboard, while signed-in users can search and browse only the resulting approved catalog.

Blocked by: 02 Owner and administrator access

Status: needs-info

- [ ] Administrators can add and edit courses with normalized unique codes, user-facing names, and a maintained category; invalid or duplicate codes are rejected.
- [ ] Add/edit/archive controls appear in the administrator dashboard, not in the student catalog; the student course-card layout remains recognizable from the old page.
- [ ] Administrators can maintain categories without changing application code; signed-in users can search courses by code or name and filter by category.
- [ ] Administrators can archive courses; archived courses and their historical content remain readable but cannot receive new offerings.
- [ ] Course and category changes record actor, action, and time; ordinary users cannot perform them through the interface or direct data requests.
- [ ] Automated and browser checks cover catalog search/filtering, create/edit, duplicate rejection, archive behavior, and access control.

## Comments

### 2026-09-23 — Database catalog-management foundation applied

Added normalized categories, catalog audit records, administrator-only create/update/archive course RPCs, and an authenticated category-list RPC. The existing public catalog RPC now joins categories and continues to return approved courses only. Migration `0004_course_and_category_management.sql` is applied to Neon and the Data API schema cache is refreshed.

The client-side administrator catalog UI and browser acceptance remain pending alongside the deferred OAuth/Vercel configuration.
