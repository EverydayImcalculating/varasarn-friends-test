# Admin dashboard: one screen per admin job, with real navigation

Status: ready-for-agent

## Problem Statement

The admin dashboard ("แดชบอร์ดผู้ดูแล") is a single long page inside the App root component. It stacks nine unrelated jobs top to bottom:
- category management
- course create/edit/archive
- merging duplicate courses
- academic periods
- per-course offerings
- JSON bulk import of offerings
- offering-proposal approval
- review moderation with its audit trail
- (owner only) granting and revoking administrator roles

There is no navigation between them, so an admin has to scroll past everything else to reach the one thing they came to do. Every save re-runs one loader that fetches data for all nine areas one after another. Most forms rely on placeholders instead of visible labels. Only course saves give any success feedback; every other action silently re-renders.

It has got bad enough that a separate quick "+ เพิ่มรายวิชาใหม่" button was added to the catalog page (see [`../course-catalog-admin/spec.md`](../course-catalog-admin/spec.md)), because the common "add a course" action was too buried here. The owner does not want another all-in-one page. They want a real information architecture, with separate views for distinct admin jobs and proper navigation between them.

## Solution

Replace the single page with a dashboard shell that has persistent navigation and one focused screen per admin job:

- **Header:** a purple gradient bar (same treatment as the course-review dialog header) titled "แดชบอร์ดผู้ดูแล", with a role pill (เจ้าของระบบ / ผู้ดูแล) and a "← กลับหน้ารายวิชา" button.
- **Navigation:** a grouped left sidebar on wide screens (≥992px). On narrower screens it becomes a horizontally scrollable strip of pill tabs, styled like the catalog's category buttons. The strip scrolls inside itself, and the page never scrolls sideways.
- **Nine sections in four groups.** The default landing section is รายวิชา.

| Group | Section | The one job it does |
|---|---|---|
| ข้อมูลรายวิชา | รายวิชา | Find, add, edit and archive courses |
| | หมวดหมู่ | Add and rename categories |
| | รวมรายวิชาซ้ำ | Merge a duplicate course into the one being kept |
| กลุ่มเรียน | ภาคการศึกษา | Add academic periods and see existing ones |
| | กลุ่มเรียน | Pick one course and add or edit its sections |
| | นำเข้ารายวิชา | Paste JSON, preview, confirm a bulk import |
| | ขอกลุ่มเรียน | Approve or reject pending offering proposals |
| ตรวจสอบ | รีวิว | Filter reviews, change moderation state with a reason, read the audit trail |
| ระบบ | ผู้ดูแลระบบ | See current admins, revoke, grant from verified accounts |

This is a restructuring of layout and navigation only. Every admin action keeps calling exactly the same service methods and RPCs, with the same arguments and the same Thai error messages. There are no database, migration, RPC, or admin-service changes.

## User Stories

1. As an administrator, I want the dashboard to open on the course list, so that the most common job is one click from the account menu.
2. As an administrator, I want a persistent navigation menu listing every admin area, so that I can see at a glance what the dashboard can do.
3. As an administrator, I want the menu grouped (course data, sections, community, system), so that related jobs sit together and the menu is quick to scan.
4. As an administrator, I want the current section highlighted in the menu, so that I always know where I am.
5. As an administrator, I want each section to show only the controls for its one job, so that I am not scrolling past unrelated forms.
6. As an administrator, I want a clear heading and one-line description at the top of each section, so that I understand what the screen is for.
7. As an administrator, I want a "back to catalog" button in the dashboard header, so that I can return to the student-facing site without hunting for it.
8. As an administrator, I want to see my role in the dashboard header, so that I know which powers I have.
9. As an administrator, I want to search the course list by code or Thai name, so that I can find one course among 200+ quickly.
10. As an administrator, I want to filter the course list by category, so that I can review one category's courses at once.
11. As an administrator, I want to filter the course list by status (active / archived), so that archived courses don't clutter day-to-day work but can still be found.
12. As an administrator, I want a count of how many courses match my filters, so that I know whether the filter worked.
13. As an administrator, I want each course row to show its code, name, category and status clearly, so that I can recognise it without opening it.
14. As an administrator, I want an "add course" button that opens a labelled form (code, name, category), so that adding a course is obvious.
15. As an administrator, I want "edit" on a course row to open the same form pre-filled, with a cancel option, so that I can fix a typo without starting over.
16. As an administrator, I want a confirmation before a course is archived, so that a mis-click in a dense list doesn't take a course off the catalog.
17. As an administrator, I want a friendly message when I enter a course code that already exists, so that I understand why the save failed (the existing duplicate-code message is kept).
18. As an administrator, I want courses I add or edit here to appear on the public catalog and in the catalog's quick-add category list straight away, so that the two stay in sync.
19. As an administrator, I want to add a category from a small labelled form, so that category setup is its own simple task.
20. As an administrator, I want to rename a category inline in its row, so that I don't have to use a browser prompt box.
21. As an administrator, I want each category row to show how many courses use it, so that I can spot empty or overloaded categories.
22. As an administrator, I want the merge screen to show the source course, an arrow, and the course being kept, so that the direction of the merge is unmistakable.
23. As an administrator, I want to preview a merge (sections moved, reviews preserved) before confirming, so that I know the impact first.
24. As an administrator, I want a final confirmation on merge, so that an irreversible action can't happen by accident.
25. As an administrator, I want academic periods on their own screen, shown as term chips, so that term setup is separate from section editing.
26. As an administrator, I want an empty state when no periods exist, so that a blank screen isn't mistaken for a loading failure.
27. As an administrator, I want to narrow the offerings course picker by typing, so that I don't scroll a 200+ item dropdown.
28. As an administrator, I want the picker to show code and name, so that I pick the right course.
29. As an administrator, I want to see a course's existing sections before adding one, so that I don't create duplicates.
30. As an administrator, I want the section form to have visible labels for year, semester, section, instructor, day, start and end time, so that I know which box is which.
31. As an administrator, I want "edit" on a section to pre-fill the form including its meeting time, so that I can correct a section in place.
32. As an administrator, I want the bulk-import screen laid out as steps (paste → check → confirm), so that I understand the flow.
33. As an administrator, I want a JSON example on the bulk-import screen, so that I know the expected shape.
34. As an administrator, I want preview totals (new / updated / unchanged / errors) above the preview table, so that I can judge a large import at a glance.
35. As an administrator, I want a result summary after importing, so that I know what actually changed.
36. As an administrator, I want a pending-proposal count badge in the menu, so that proposals needing a decision are noticed without opening that screen.
37. As an administrator, I want the proposals screen to explain that new sections currently publish automatically, so that an always-empty list doesn't look broken.
38. As an administrator, I want approve and reject buttons on each pending proposal, so that moderation works if review is switched back on.
39. As an administrator, I want the review-moderation list to reload as soon as I change the state filter, so that I don't have to press a separate search button.
40. As an administrator, I want live text search over loaded reviews, so that I can find a specific review quickly.
41. As an administrator, I want a colour-coded state badge on each review (visible / hidden / removed), so that I can scan states quickly.
42. As an administrator, I want to give a reason when changing a review's state, and see the audit trail per review, so that moderation is accountable.
43. As the owner, I want a roles screen listing current admins with Thai role labels, so that I can see who has access.
44. As the owner, I want to filter verified accounts by name or email before granting admin, so that I can find the right person.
45. As the owner, I want to revoke an administrator from the same screen, so that access management lives in one place.
46. As an administrator (not owner), I want the roles section to be absent from my menu, so that I only see what I can use.
47. As any admin, I want a short success toast after every successful change, so that I know it worked. A missing toast was the root of a real owner report in the course-catalog-admin spec.
48. As any admin, I want errors shown at the top of the section I'm working in, so that I see them next to the task that failed.
49. As any admin, I want a loading indicator while a section fetches its data, so that an empty list isn't mistaken for "no data".
50. As any admin, I want half-typed forms and pasted import text to survive switching sections, so that checking something elsewhere doesn't lose my work.
51. As any admin, I want each section to load its data only when I first open it, so that the dashboard opens fast and doesn't fetch data I won't use.
52. As any admin on a phone, I want the section menu as a swipeable pill strip and all rows to wrap instead of overflowing, so that the dashboard is usable at 375px.
53. As a keyboard user, I want every menu item and control reachable by Tab with a visible focus ring, and focus moved to the new section's heading when I switch sections, so that I can operate the dashboard without a mouse.
54. As a screen-reader user, I want the menu exposed as a labelled navigation region with the current item marked, so that I know where I am.
55. As a user with reduced-motion settings, I want hover and active transitions disabled, so that the interface doesn't animate against my preference.
56. As a student (no admin role), I want nothing about the admin dashboard to be visible or reachable, so that my experience is unchanged.

## Implementation Decisions

**Modules**
- **AdminDashboard (new shell component)**
  - Props: the RPC client and the viewer's role (`owner` | `administrator`). This follows the existing LegacyTimetableImport convention of a `client: RpcClient` prop and typed `defineEmits`.
  - Emits:
    - `close`
    - `catalog-changed`, after any course or category mutation, so App reloads the public catalog and its category list
    - `toast` with a message string, which App forwards to its existing `showToast`
  - Builds its own AdminService from the client.
  - Owns the shared reference data used by several sections: the category list and the manageable-course list. It loads them with the existing service calls, and course listing must keep going through the existing paginated fetch because the Data API caps pages at 100 rows.
  - Owns the active-section key (default `courses`) and the pending-proposal count, loaded once on open.
  - Renders the header, the grouped nav, and the active section inside `<KeepAlive>`.
- **Section components (new, one per row of the table above)**
  - Names: AdminCourses, AdminCategories, AdminMerge, AdminPeriods, AdminOfferings, AdminImport, AdminProposals, AdminReviews, AdminRoles.
  - Each gets the AdminService, plus the shared lists where needed. AdminOfferings also gets the raw client, because loading a section's meeting time for edit calls `list_approved_offering_meetings` directly today. Keep that as a direct RPC call instead of adding a service method.
  - Each owns its local form state, a `loading` flag and an `error` string, and fetches its own data on first mount.
  - Shared-data mutations (course, category, merge) emit `changed` to the shell, which refreshes the shared lists and emits `catalog-changed`. Section-local mutations reload their own list.
  - Every successful mutation emits `toast`. Keep the existing "เพิ่มรายวิชาสำเร็จ" / "บันทึกรายวิชาสำเร็จ" wording and add short equivalents for the rest (category added/renamed, course archived, merge done, period added, section saved, import done, proposal approved/rejected, review state changed, admin granted/revoked).
  - AdminProposals reports its current count back to the shell after it loads or resolves, so the nav badge stays correct.
- **App root component**
  - The whole inline dashboard section is replaced by `<AdminDashboard>`, rendered only while the dashboard view is open, a role is present, and the Neon client exists.
  - Opening the dashboard becomes a plain view switch, with no data loading in App.
  - All dashboard-only state and handlers move out of App: members, verified accounts, manageable courses, course editing, merge, periods, offerings, bulk import, proposal resolution and moderation.
  - App keeps the catalog-page quick-add modal exactly as it is (its own category list, code/name/category fields, and create-course save path). That save path simplifies to create-only, since editing now lives in AdminCourses.
  - Student-side proposal state is not admin and stays in App.
  - Sign-out resets stay consistent.

**Behaviour carried over verbatim**
- Service method, arguments, and Thai error text for every admin action.
- Merge keeps its existing `window.confirm`.
- Bulk-import confirm-button enablement is unchanged.
- The review-moderation live text search is unchanged.

**Deliberate small UX changes (no business-logic changes)**
- Archiving a course gets a `window.confirm`, matching merge.
- Category rename moves from `window.prompt` to inline editing, using the same `updateCategory` call.
- The moderation state filter reloads on change, and the old button becomes "โหลดใหม่" (reload).
- Success toasts on all mutations.
- Per-section loading indicators and empty states.
- Visible form labels everywhere.
- Thai role labels instead of raw `owner` / `administrator`.
- The roles section is fetched only when an owner opens it.

**Visual system**
- Extend this app's existing tokens and classes. The legacy page has no admin UI to copy.
  - Tokens: the purple scale `#2a1b47` / `#6f42c1` / `#7c4fda` / `#c9b3f0` / `#f2ecfb` / `#fbf9ff`, amber `#f5a623`, line `#e7e1f5`, ink-600, radius-md/lg/pill, and the card/float shadows.
  - Classes: `.btn-purple`, `.btn-outline-purple`, `.review-box`, `.section-label`, `.selected-badge`, `.category-btn`, `.review-empty`, `.offering-term`, the gradient header.
  - Fonts: Prompt for body text and Kanit for headings.
  - Icons come from Bootstrap Icons, which are already loaded. No emoji.
- New `admin-*` rules:
  - Layout: a 240px sidebar next to the content from 992px up, one column below that.
  - Nav items: at least 44px tall. The active state uses the lightest purple background, purple-700 text and a 3px left bar. Hover uses the palest purple. Keyboard focus shows a visible purple-300 outline. Count badges are amber.
  - Content sits in white cards.
  - Rows are flex rows that wrap on small screens. The only table is the import preview, which scrolls inside its own card.
  - Moderation state badges: visible = existing green badge, hidden = amber (`#fff4e0` / `#8a5a00`), removed = red (`#fdecec` / `#b42318`).
- Transitions are colour and background only, 150–200ms, and turned off under `prefers-reduced-motion`. All text/background pairs are at least 4.5:1 contrast.
- Nav semantics: a `<nav>` labelled "เมนูผู้ดูแล", button items, `aria-current="page"` on the active one. Switching section moves focus to the new section's heading.
- Nav icons: `bi-journal-bookmark` (courses), `bi-tags` (categories), `bi-intersect` (merge), `bi-calendar3` (periods), `bi-collection` (offerings), `bi-upload` (import), `bi-inbox` (proposals), `bi-shield-check` (reviews), `bi-people` (roles).
- The ui-ux-pro-max design-system search suggested a dark slate palette with Fira fonts. That was rejected in favour of the app's own tokens. Only its structural guidance was kept: minimal/dense layout, status colours, visible focus, reduced motion, and checks at 375/768/1024/1440.

## Testing Decisions

- **Single seam: the App root mounted with a mocked Neon module.** This is the existing, highest seam; prior art is the course-catalog-admin and my-reviews-page tests.
  - Tests enter the way a user does, through the account menu → "แดชบอร์ดผู้ดูแล", then click nav items and controls.
  - They assert only on rendered DOM (text, `aria-current`, presence or absence of controls, toast text) and on the recorded list of RPC names and arguments.
  - They do not mount AdminDashboard or section components directly, and don't assert on props, emits, or internal state, so the component split can change without breaking tests.
- A good test here checks external behaviour: what an admin sees and which RPCs fire with which arguments. Expected values come from the fixture, not from re-deriving the component's logic.
- New test file for the dashboard. The mocked RPC handles `current_access` (role switchable per test), catalog and category lists, `list_manageable_courses`, academic periods, pending proposals, moderation reviews and audit, role assignments and verified accounts, plus the mutations under test. Scenarios:
  1. An administrator opens the dashboard and lands on รายวิชา with courses listed. That nav item is marked current, and no role-assignment or moderation RPCs have fired yet (lazy loading).
  2. An administrator sees no ผู้ดูแลระบบ item. An owner sees it, and opening it fires the role-assignment and verified-account RPCs and lists them with Thai role labels.
  3. Adding a course from the dashboard calls `create_course` with the normalised code, shows the success toast, and re-fetches the public catalog.
  4. Archiving asks for confirmation (stub `window.confirm`). Declining fires nothing, and accepting calls `archive_course`.
  5. The pending-proposal badge shows the fixture count. Approving calls `resolve_offering_proposal` with approve = true, and the badge count drops.
  6. Changing the moderation state filter reloads with that state. Changing a review's state sends the typed reason.
  7. Text pasted into the bulk-import box is still there after switching to another section and back.
  8. A student with no role never sees the dashboard entry (already covered by the existing catalog test; keep it passing).
- The existing course-catalog-admin tests (catalog quick-add modal) must pass unchanged. That is the regression guard for the simplified create-only save path.
- Every existing test must keep passing. Earlier specs note that some tests mock the Neon module fully, so any new export the app starts importing from it must be added to those mocks.

## Out of Scope

- Any database, migration, RPC, or admin-service change.
- URL or hash deep-linking and browser-back support for admin sections. The app has no URL state anywhere yet; vue-router is installed but unused.
- An overview / statistics landing page.
- Showing the course code on moderation rows, which needs the moderation list RPC to return it.
- Blocking bulk-import confirmation when preview rows are invalid, which is business logic and currently allowed.
- Changes to the catalog-page quick-add modal, the student-facing proposal box (still hidden), or any non-admin screen.

## Further Notes

- **Do not commit or push without asking the owner first.** When implementation, tests, build, the visual check, and the log entry below are done, stop and ask.
  - The working tree already has unrelated uncommitted changes from before this work: the proposal-box re-hide entry in the offering-proposal spec, and the removed proposal test in the review-to-timetable app test. Ask whether they go in a separate commit, and don't fold them into this one silently.
  - The current branch is `main`.
- **Visual verification.** Google sign-in isn't possible from agent sessions, so use a throwaway, uncommitted preview harness, following the precedent in earlier specs:
  - A standalone HTML entry plus a small script that mounts AdminDashboard with an in-memory fake RPC client. Seed it with roughly 30 courses (active and archived), 3 categories, 2 periods, 2 pending proposals, reviews in all three states with audit rows, and owner plus admin members. The role comes from a `?role=` query param, and toasts go to a simple banner.
  - Serve it with the Vite dev server through a temporary launch config and the browser preview.
  - Check every section at 1440, 1024, 768 and 375 widths: no sideways page scroll, the sidebar ↔ pill-strip switch, focus order and rings, the active state, empty states, toasts and badge updates.
  - Screenshot the key states, then delete the harness and revert the launch config.
- Run the full suite (`npm test -- --run`) and `npm run build` (includes vue-tsc) before reporting.
- Log the implementation as a dated entry under `## Comments` below: what was built, test and build results, how the visual check was done, and that live signed-in acceptance on production is still open, as for the previous admin specs.
- Related decisions this must not contradict:
  - [`../course-catalog-admin/spec.md`](../course-catalog-admin/spec.md): the quick-add modal stays; success toasts; the paginated course listing.
  - [`../offering-proposal-auto-approve/spec.md`](../offering-proposal-auto-approve/spec.md): auto-approve stays live; the moderation path is kept for a possible return.

## Comments

### 2026-09-25: Spec written from the planning session

Written from the plan agreed in chat (IA, nav pattern, component split, visual system). Test seam confirmed with the owner: App-level only. Commit policy confirmed: stop and ask before committing or pushing. Ready for `/implement`.

### 2026-09-25: Implemented

**Built:** `AdminDashboard.vue` shell plus nine section components (`AdminCourses`, `AdminCategories`, `AdminMerge`, `AdminPeriods`, `AdminOfferings`, `AdminImport`, `AdminProposals`, `AdminReviews`, `AdminRoles`) under `src/components/admin/`, matching the module split, props/emits, and grouped-nav table in Implementation Decisions. `App.vue`'s inline dashboard block (~460 lines) was removed and replaced with a single `<AdminDashboard>` mount; the quick-add modal on the catalog page was simplified to its create-only save path as specified, and all other dashboard-only state/handlers (members, merge, periods, offerings, bulk import, owner-side proposals, moderation) moved out of `App.vue`. The shell loads categories + the paginated manageable-course list on mount (shared data), plus an initial pending-proposal count for the nav badge; each section fetches its own data lazily on first mount and is kept alive via `<KeepAlive>` across a `v-if`/`v-else-if` chain, so switching sections doesn't lose in-progress form state (verified for the bulk-import textarea). Added `admin-*` CSS rules to `src/styles.css` reusing the existing purple/amber tokens, the course-review-dialog header treatment for the dashboard header, and the catalog's pill-button styling for the mobile nav strip, per the Visual system section. Archiving now confirms via `window.confirm` (matching merge), category rename is inline instead of `window.prompt`, and every mutation across all nine sections toasts.

**Tests:** added `tests/admin-dashboard.test.ts` at the same App-mounted seam as the existing admin tests, covering all 8 scenarios from Testing Decisions (lazy-loaded landing on รายวิชา with no role/moderation RPCs fired yet; ผู้ดูแลระบบ hidden for an administrator and present with Thai labels for an owner; course creation with normalised code + toast + catalog refetch; archive confirm-before-archiving; the proposal badge count dropping on approval; the moderation state filter reloading and the typed reason being sent; bulk-import text surviving a section switch). `npm test -- --run` passes 90/90 across all 16 test files, including the unmodified `course-catalog-admin.test.ts` regression guard. `npm run build` (vue-tsc + vite build) passes clean.

**Visual check:** built a throwaway `admin-preview.html` / `admin-preview.ts` (deleted after) that mounted `AdminDashboard` standalone against an in-memory fake `RpcClient` seeded with 30 courses (2 archived via modulo), 3 categories, 2 periods, 2 pending proposals, reviews in all three moderation states with an audit trail, and owner + administrator members, with role driven by `?role=` and toasts to a plain banner. Served through a temporary `admin-dashboard-preview-dev` entry in `.claude/launch.json` (reverted after) and the browser preview. Checked at 1440/1024/768/375: sidebar-to-pill-strip switch at the 992px breakpoint works, courses/categories/merge/periods/offerings/import/proposals/reviews/roles sections all rendered and were exercised (add course, preview+confirm import, expand moderation audit, grant/revoke groundwork visible), the pending-proposal badge showed and toasts fired correctly, and no page ever showed a horizontal scrollbar down to 375px. One real bug the check caught and fixed: the active nav pill could switch off-screen on the mobile strip with no auto-scroll; added `scrollIntoView` on section-select (guarded against jsdom's unimplemented `scrollIntoView`, which otherwise threw during the test run).

**Open:** live signed-in acceptance on production is still outstanding, as with the previous admin specs — this session's checks were all against the mocked/faked RPC layer, not a real signed-in session against Neon.

**Not committed.** Per Further Notes, work is staged for review; the pre-existing uncommitted changes (proposal-box re-hide note in the offering-proposal spec, and the removed proposal test in `tests/review-to-timetable-app.test.ts`) were left untouched and not folded into this diff.
