# Add-course button on the course catalog page

Status: needs-info

## Problem Statement

The owner sent a screenshot of `https://varasarn-close-friend.vercel.app/` (a signed-in admin session) showing a "+ เพิ่มรายวิชาใหม่" (add new course) button next to the "รายวิชาทั้งหมด" heading on the course catalog page, opening a small modal with three fields (รหัสวิชา, ชื่อวิชา, หมวดหมู่) and a save button. This rebuild's catalog page has no such button — creating a course is only reachable through the separate "แดชบอร์ดผู้ดูแล" (admin dashboard) screen, in a larger inline form mixed with categories, offerings, bulk import, proposals, and moderation.

## Which site is `varasarn-close-friend.vercel.app`?

Worth flagging: an earlier entry in `.scratch/review-to-timetable/spec.md` (2026-09-24, "Removed the ข้อมูลจากรีวิว line...") stated this URL is "an older deployment of this same rebuild, not the pre-rebuild legacy HTML." That was not verified at the time and this session found evidence against it: the exact string "เพิ่มรายวิชาใหม่" and this modal's markup exist in `git show 0b1b1c8^:index.html` (the true legacy interface per `docs/original-ui-reference.md`) but appear nowhere in this repo's history — not in `src/App.vue` (`git log -S` across all branches finds no commit), and not in `old-repo/index.html` either (the "later Vite entry page, not the original interface" the docs also mention). The simplest explanation consistent with all the evidence is that `varasarn-close-friend.vercel.app` is the actual pre-existing production site (likely serving something at or near the true legacy interface) that this rebuild is meant to eventually replace via Ticket 16's cutover — a separate deployment/codebase, not a past commit of this repo. This still isn't independently confirmed (the page is behind Google sign-in, which this session cannot do), so treat it as a strong inference, not a fact, and correct both spec entries if it turns out wrong.

## Solution

Add the same button and modal to this rebuild's catalog page, backed by the admin dashboard's existing `createCourse` RPC path, gated to accounts with an admin/owner role (consistent with how the dashboard link itself is gated) rather than shown unconditionally — this rebuild has a real role system the legacy trust-based site didn't, and the create-course RPC is admin-only server-side regardless of what the button shows.

## Implementation Decisions

- Reuse `adminService.createCourse` / the existing `courseCode` / `courseName` / `courseCategoryId` / `categories` state rather than introducing a parallel form. Extracted the shared save logic from `addCourse()` (used by the dashboard's inline form) into `saveCourse()`, so the new catalog-page path (`openCourseModal()` / `submitCourseModal()`) doesn't inherit `addCourse()`'s post-save `openDashboard()` navigation, which would be wrong when triggered from the catalog page.
- Reused the existing `.contact-panel` / `.contact-modal-card` / `.contact-modal-header` overlay classes (already used for the "ติดต่อผู้ดูแล" panel) for visual consistency instead of introducing a new overlay family; added one new `.course-modal-body` rule (`.contact-modal-body` centers its content, which suits contact buttons but not a form).
- Button visibility: `v-if="accessRole"`, matching the existing `แดชบอร์ดผู้ดูแล` account-menu item's gating. The dashboard's own inline "เพิ่มรายวิชา" form is left as-is (untouched, still works, still mixed in with the rest of the dashboard) — this is an additive quick-access entry point, not a replacement.

## Testing Decisions

- New file `tests/course-catalog-admin.test.ts`: asserts the button is absent for a signed-in reader with no role, and that for an `administrator` role it opens the modal, submitting calls `create_course` with the expected `p_code`/`p_name_th`/`p_category_id` args, and the modal closes afterward.

## Comments

### 2026-09-24 — Implemented; signed-in acceptance pending

Added `courseModalOpen` state, `saveCourse()`/`openCourseModal()`/`submitCourseModal()` functions, the button (`.add-course-btn`, gated `v-if="accessRole"`) next to the "รายวิชาทั้งหมด" heading, and the modal in [`src/App.vue`](../../src/App.vue). Added `.course-modal-body` to [`src/styles.css`](../../src/styles.css). `npm test` (71/71, +2 new) and `npm run build` passed. Verified visually against the compiled CSS with a throwaway, uncommitted static HTML file in `dist/` (removed afterward) — the button and modal layout matched the owner's screenshot. Live signed-in browser acceptance (as an actual administrator account, confirming the button appears, the modal saves, and the new course shows up in the catalog) remains open — this session cannot sign in with Google.
