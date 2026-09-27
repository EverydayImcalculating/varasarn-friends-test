# Course catalog page: usable at full-catalog scale

Status: implemented; signed-in production acceptance pending

## Problem Statement

The course catalog (the signed-in home page) was designed and checked against the legacy layout in `docs/original-ui-reference.md` when it only ever rendered up to 100 courses. Since `.scratch/course-catalog-admin/spec.md` fixed the silent 100-row Data API cap, `loadCatalog()` loads the full catalog through three paginated requests — 214 approved courses across 10 categories in production (checked read-only against `api.list_approved_catalog()` on 2026-09-27), and only 13 of them (6%) have any reviews. The page's search, category filter and card grid were never exercised at that size. Measured against a mock catalog of the same shape (`npm run dev:mock`, `?catalog=large`):

- The page was 39,920px tall on a 375px phone (about 49 screens of cards) and 14,751px on a 1024px desktop. Search and the category buttons exist only at the top, so a student 30 screens into the list had no way back to them but scrolling.
- The category row was 1,864px wide in a 936px container on desktop with no hint that more existed (the fade was mobile-only); about two of ten categories were visible on a phone.
- "ยังไม่มีรีวิว" was printed on roughly 200 cards, and there was no way to find the 13 reviewed courses except scrolling past everything else.
- No result count and no announcement when filters changed; category buttons had no `aria-pressed`.
- Searching `jc 22` (with a space, the way codes are often typed) returned nothing; the empty state was a single line with no way out.
- While the three catalog requests were in flight the whole page (including the static banner and about card) was replaced by the text "กำลังโหลดข้อมูล...", then everything appeared at once and shifted.
- If a follow-up page of the paginated fetch failed, `fetchAllRows` returned the rows it had, but `loadCatalog()` discarded them and showed only the raw error — together with "ไม่พบรายวิชาที่ตรงกับการค้นหา", which implied a search mismatch. There was no retry.
- The catalog screen had no `h1`; its headings were an `h5` (about card) and an `h4` (รายวิชาทั้งหมด).

Rendering speed was measured and is not a problem: re-rendering all 214 cards took 24–33ms in dev mode. Virtualization or pagination of the grid would not address the real issue (distance from the controls, not render cost) and would hurt scanning, so neither was done.

## Solution

### Approved refinement — 2026-09-27

Owner follow-up: hide the visible `เรียงตาม:` label while retaining its accessible association with the sort dropdown. `มีรีวิว` off includes all courses (also unreviewed); on includes reviewed courses only. Final border preference: retain the native 3px purple top border; the full-corner accent trial was reverted at the owner's request.

The owner approved the following refinements using the design skill. These supersede the original top-accent, visible result-count, and mobile category presentation details below:

- Course cards retain the white surface, category badge, purple tokens and typography. Replace the clipped 5px flat stripe with a thin 3px purple top border that curves cleanly around both upper corners.
- Desktop shows all category pills wrapped. Mobile keeps a horizontal pill row and adds a clearly labeled `ทุกหมวด` disclosure button. Expanded mode reveals the full category list in a bounded, vertically scrollable area so the sticky toolbar does not consume the screen; selecting a category collapses it and brings the selected pill into view. Use `aria-expanded` and `aria-controls`, and allow explicit collapse.
- Remove the visible result-count line (`พบ 24 จาก 214`). Keep a visually hidden live announcement for accessibility and retain counts on category/reviewed controls.
- Keep `มีรีวิว` as an independent optional filter. Give sorting a visible `เรียงตาม:` label with `รหัสวิชา`, `★ คะแนนสูงสุด`, and `รีวิวมากสุด`. Highest average rating sorts descending with existing tie-breaks and unrated courses last; no minimum-star filter. Default remains course-code order.
- Preserve sticky full-bleed styling and repositioning, search, loading/retry, admin modal, and back-to-top behavior. No unrelated refactors.

Implementation/verification plan: add rendered-UI regression tests for the hidden live status, explicit sort labels/rating order, and category disclosure/selection; run each behavioral slice red then green. Verify the rounded accent and responsive category layouts visually at 375px and 1280px, then run the full test suite and production build. Log the outcome under Comments before requesting any commit/push.

Keep the legacy layout and visual language — banner, about card, "รายวิชาทั้งหมด" heading, pill search, category pills, three-column cards with the gradient top line, floating contact button, the existing tokens and `.btn-purple` / `.btn-outline-purple` / badge classes — and make the controls scale with the list:

- A sticky catalog toolbar (search, category pills, result count, reviewed toggle, sort) that pins to the top of the viewport once scrolled past, in a white full-bleed bar with the existing `--line` hairline.
- Category pills show how many courses picking them would give, carry `aria-pressed`, wrap onto multiple rows from the `md` breakpoint (no hidden overflow on desktop), and keep the original horizontal scroll with its fade on phones, scrolling the chosen pill into view.
- A "มีรีวิว" toggle and a sort select (รหัสวิชา / รีวิวมากสุด / คะแนนสูงสุด).
- Search ignores case and whitespace; a clear button appears inside the field; the empty state names the query and offers one button per active filter to undo it.
- The banner and about card render immediately; the grid shows six placeholder cards (`aria-busy`) while the catalog loads.
- Load failures are distinct from "no match": a full failure shows its own retryable state; a partial failure keeps the loaded rows with a retryable warning.
- A back-to-top button after two screens of scrolling, stacked above the contact button.
- Unreviewed cards show no rating line at all (owner request, 2026-09-27), instead of "ยังไม่มีรีวิว".

## Implementation Decisions

- All changes are in the catalog block of [`src/App.vue`](../../src/App.vue) and [`src/styles.css`](../../src/styles.css); no new component was extracted, matching how the rest of this page is built.
- **Search matching:** `searchKey()` lowercases and strips all whitespace from both the query and the field. Code and Thai name are matched separately, not concatenated, so a query cannot match across the code/name boundary.
- **Counts:** each control shows how many results choosing it would give. Category pills follow the search and reviewed filters (not the category filter); the reviewed toggle follows search and category (not itself). Counts are hidden until the catalog has loaded so a loading or failed catalog never reads as "0 courses in every category". Pills whose count is 0 are dimmed (`.is-empty`) but stay clickable.
- **Sort:** `code` keeps the server's order (already by code). `reviews` sorts by review count, then code. `rating` sorts by average rating (unrated last), then review count, then code.
- **Sticky detection:** a 1px `.catalog-toolbar-sentinel` sits directly above the toolbar; `updateScrollState()` (passive scroll listener, also run by the filter watcher) marks the toolbar stuck once the sentinel's top is above the viewport. IntersectionObserver was tried first and dropped: its callbacks lag behind a programmatic scroll the filter watcher needs to act on synchronously (observed in the preview), and it doesn't exist in jsdom.
- **Full-bleed stuck background without overflow:** the stuck toolbar uses spread `box-shadow`s shifted up by their own spread (so they end exactly at the bar's bottom edge) plus `clip-path: inset(0 -100vmax -16px)`, painting a white background, `--line` hairline and soft shadow across the viewport. An absolutely positioned pseudo-element was avoided because it would create horizontal page overflow.
- **Repositioning after a filter change:** when the toolbar is stuck, changing search / category / reviewed / sort scrolls so the results start directly under the toolbar. The scroll uses `behavior: 'instant'` because Bootstrap's reboot sets `scroll-behavior: smooth`; a smooth scroll still running when the list shrinks got clamped at the new page end, leaving the first cards hidden behind the toolbar (observed before the fix).
- **Load/error state:** `loadCatalog()` now sets `loading` at the start (the skeleton only shows when there are no courses yet, so a refresh after adding a course doesn't flash placeholders) and reports failures in a new `catalogError`, separate from the page-wide `error` that the review and course modals also use. On failure it keeps whatever rows `fetchAllRows` returned only when nothing was loaded before — a partial page set never replaces an already-loaded full list.
- **Headings:** a visually hidden `h1` "Varasarn Close Friends" precedes the banner; the about card title becomes `h2.h5` and "รายวิชาทั้งหมด" `h2.h4` — same rendered sizes, correct outline.
- **Contact button:** it hides on phones while the search field has focus (the on-screen keyboard pushes it over the field). On first load on a phone it can still sit over the right end of the search field before any scrolling, as a floating button does over any content; since the owner chose to keep the banner and about card as they are, nothing else moves.
- **Dev mock:** [`mock/neon.mock.ts`](../../mock/neon.mock.ts) gained `?catalog=large` (214 courses across the 10 production category names, ~6% reviewed, long Thai names), `?catalog-delay=<ms>` and `?catalog-error=1` (first catalog call fails, retry succeeds). Dev-only, never in `npm run build`.

## Testing Decisions

- New [`tests/catalog-page.test.ts`](../../tests/catalog-page.test.ts) (6 tests): whitespace/case-insensitive search plus the empty state and clear button; per-category counts following the search and `aria-pressed`; reviewed toggle and both sorts, including tie-breaking; skeleton and banner while loading with no "no match" text; full failure shows the retryable error state (not "ไม่พบรายวิชา") and retry recovers; a paged mock with `.range()` where the last page fails keeps the first pages' rows with a warning, and retry loads the rest.
- [`tests/course-catalog-admin.test.ts`](../../tests/course-catalog-admin.test.ts): the rating-summary test now asserts an unreviewed card has no rating line and no "ยังไม่มีรีวิว".
- The sticky toolbar, scroll repositioning and back-to-top depend on layout, which jsdom doesn't do; they were verified in the browser instead (below).

## Comments

### 2026-09-27 — Implemented and verified against the compiled page

Critique-first pass (the problem list above), direction agreed with the owner: all four proposed parts plus removing "ยังไม่มีรีวิว"; the banner and about card stay as they are on mobile; logged here as a new spec rather than in `.scratch/course-catalog-admin/spec.md`, since the scope is a page redesign beyond that spec's add-course and pagination work.

`npm test -- --run`: 134/134 passed (17 files; +6 new). `npm run build` passed.

Visual verification: in `npm run dev:mock` at 375px and 1024–1280px, then against a compiled build of the same source (`vite build --config vite.mock.config.ts` into a throwaway `dist/mock-preview`, served with `vite preview`, removed afterward). Its CSS asset (`index-DVNUS8M5.css`) is byte-identical by hash to the production `npm run build` output. Checked: toolbar sticks with the full-bleed white bar and no horizontal overflow; picking a category while stuck lands the first card directly under the toolbar; counts, `aria-pressed`, dimmed empty categories; "jc 2" matches; clear button; empty state with per-filter buttons; skeleton with banner/about during a delayed load; full failure → retry; back-to-top after two screens; no console errors.

Still open: signed-in acceptance on production (this session cannot sign in with Google) — in particular that all 214+ courses show and the counts add up against the real catalog.

Noticed, not changed: production's approved catalog contains `TEST`, `TEST1`, `TEST3`, `TEST4`, `TEST5` under กลุ่มวิชาบริหารการสื่อสาร, visible to every student — apparently left over from testing the add-course modal. Removing or archiving them is a production data decision for the owner.

### 2026-09-27 — Follow-up spec audit, TDD fixes, and responsive acceptance

Audited the existing uncommitted diff against every Solution and Implementation Decision, without rebuilding the redesign. Two confirmed count-state mismatches were fixed in `src/App.vue` through the rendered catalog seam in `tests/catalog-page.test.ts`, keeping the existing Neon RPC mock style:

1. A failed initial load announced `ทั้งหมด 0 วิชา` in the live result status. Added a regression assertion, observed red with that exact text, then made the status announce the load failure instead. Targeted test passed green; retry still recovers.
2. A successfully loaded empty catalog hid all category/reviewed counts and failed to dim empty categories because visibility depended only on `courses.length`. Added a regression test, observed red (`ทั้งหมด` instead of `ทั้งหมด0`), then allowed counts after a successful empty load while retaining hidden counts during initial loading/failure. The test verifies zero counts, dimming, and a still-clickable category; targeted green passed.

Compact requirement/evidence checklist (all checked; no further implementation mismatches found):

| Requirement | Evidence |
| --- | --- |
| Legacy banner/about/contact, pill controls, badges, gradient cards, three columns at md, existing tokens/button classes; catalog stays in App.vue/styles.css | Diff audit and screenshots at 375×812 and 1280×900; `:root` unchanged; desktop first-row card left positions 82/462/842px. |
| Sticky toolbar, synchronous 1px sentinel/passive scroll detection, full-bleed white/hairline/shadow without overflow | Source audit plus both browser widths: toolbar top 0; document scroll width exactly 375/1280; white bar visibly spans viewport. |
| Category wrapping on desktop, horizontal scrolling/fade and selected pill brought into view on phone | CSS/source audit and browser interaction; desktop menu client/scroll widths both 1116px; mobile selected category scrolls into view. |
| Category/reviewed counts follow the other filters, live result count, aria-pressed, dimmed clickable zero-count pills; counts hidden until usable data | Existing search/category/reviewed tests plus both red/green regressions; browser search yields 126 courses and reviewed toggle yields 8; initial delay/error has no numeric control counts. |
| Case/whitespace search with code/name matched separately, clear button, query-specific empty state and one undo per active filter | Source audit and catalog tests; `jc 2` matches all 126 JC2 cards at both widths; browser empty state exposes all three undo buttons and clearing only search retains category/reviewed filters (2 results). |
| Code preserves server order; reviews and rating use specified tie-breaks, unrated last | Comparator/source audit and existing sort test; desktop rating interaction produces descending ratings, unreviewed last in test. |
| Filter changes while stuck reposition results using instant scroll despite Bootstrap smooth behavior | Watcher/source audit; category selection lands first card at 209.45px under 194.59px mobile bar and 214.19px under 199.30px desktop bar (normal ~15px gap), measured after scroll settles. |
| Immediate banner/about, six aria-busy placeholders; refresh does not flash skeletons | Existing gated loading test, template audit, and `catalog-delay=5000` preview at both widths; six placeholders, no numeric counts or no-match message during initial load. |
| Separate full/partial retryable errors; retain partial initial rows and never replace an existing full list with failed partial refresh | Existing full-error and paged `.range()` regression tests plus loadCatalog source audit; `catalog-error=1` retry restores all 214 cards at both widths, with corrected failure status. |
| Back-to-top after two screens, stacked above contact; mobile contact hidden on search focus | Browser at both widths: absent at top, present beyond 2×height, click returns scrollY to 0; mobile search focus computes contact display `none`; source threshold and stacking verified. |
| No unreviewed rating line; h1 and correctly sized h2 headings | Admin rating-summary regression and browser cards (no review text on unreviewed cards); DOM/source audit of hidden h1 and h2.h5/h2.h4. |
| Dev-only 214-course/10-category fixture with long Thai names, delay/error switches; preserve admin modal and paginated fetch | Mock/config diff audit and browser counts (14 reviewed, ~6.5%); production build uses normal config; existing admin and pagination tests pass. |

Verification: `npm test -- --run` **135/135 passed in 17 files**; `npm run build` passed (Vite warns that the main minified JS chunk exceeds 500kB); `git diff --check` passed. Browser verification used the existing dev-mock preview at `http://localhost:5173/?catalog=large` and its delay/error variants, matching `.claude/launch.json`; no browser warnings/errors were recorded. Responsive viewport override was reset afterward.

Only this spec, `src/App.vue`, and `tests/catalog-page.test.ts` were edited in this follow-up. Pre-existing redesign work and unrelated working-tree changes were preserved. No commit or push performed. Remaining blockers unchanged: signed-in production acceptance requires a real Google login; production TEST/TEST1/TEST3–TEST5 course handling is the owner's data decision.

### 2026-09-27 — Owner-approved card and toolbar refinement implemented

Updated the spec before implementation after the owner approved the three design choices. Used the design skill's component/token guidance while retaining the existing Vue/Bootstrap structure and purple palette. Changes are limited to this spec, `src/App.vue`, `src/styles.css`, and `tests/catalog-page.test.ts`.

| Approved requirement | Implementation and evidence |
| --- | --- |
| Thin top accent that follows rounded corners | Replaced the clipped pseudo-element stripe with a native 3px purple top border; inspected actual cards at 375×812 and 1280×900. White surface, category badges, typography and other tokens retained. |
| All desktop categories; mobile horizontal row plus `ทุกหมวด` | Added an accessible disclosure with `aria-expanded`/`aria-controls`, `ย่อหมวด` collapse, and a 35vh scrollable expanded list. Red/green test covers expansion without filtering, selection/automatic collapse, pressed state, and manual collapse. Mobile browser exercised the last category in the expanded list; desktop wraps all pills and hides the disclosure. No horizontal page overflow at either width. |
| No visible result-count line | Kept the live status visually hidden for screen readers and removed its grid row. Targeted test failed before the hidden class was added, then passed. Browser measured status as a clipped 1×1px element. Category/reviewed counts remain. |
| Clear sorting, including highest average stars; independent reviewed filter | Visible `เรียงตาม:` label with code / `★ คะแนนสูงสุด` / review-count options. Updated sort test red/green; existing ordering behavior retained, including unrated-last and tie-breaks. Mobile first rated course and desktop descending 4.5/4.0/3.0/2.5 sequence verified; reviewed toggle still narrows results independently. |
| Sticky positioning preserved after expansion | Browser found that scrolling the chosen pill into view after collapsing could move the outer page away from the sentinel. Added a browser-layout-boundary regression that failed at scrollY 421 instead of 701, then restored the previously stuck position after the DOM update and pill scroll. Green test plus browser verification: toolbar top 0 and first card immediately below the bar at both widths (desktop bar bottom 168.19px, card top 183.07px). |

Final verification: `npm test -- --run` **137 tests passed in 17 files**; `npm run build` passed with the existing >500kB chunk-size warning; `git diff --check` passed. Dev-mock preview also retained six placeholders with the banner during delayed loading, and error → retry restored 214 cards. No browser warnings/errors recorded. Responsive viewport override reset. Screenshots saved as `catalog-refined-mobile.png` and `catalog-refined-desktop.png` in this chat's visualization directory.

No commit or push performed; unrelated working-tree changes preserved. Production Google-login acceptance and owner decisions about TEST courses remain open.

### 2026-09-27 — Simpler sort control and complete top-corner accent

Per owner feedback, hid the visible `เรียงตาม:` label while retaining the select's accessible label. Kept `มีรีวิว` as an optional filter: off includes unreviewed courses, on excludes them. Updated the regression test through red/green for the hidden label and explicitly checked all four fixture courses return when the toggle is turned off.

Replaced the native top-only border (which changes color partway around each corner) with a thin, non-interactive curved accent that continues through the full upper arcs and meets the neutral side border. Inspected at 375px and 1280px; no horizontal overflow. Browser check in วิชาศึกษาทั่วไป: 60 courses → 4 reviewed → all 60 restored. Full suite: 137 tests passed; build passed with the existing chunk-size warning. No commit or push.

### 2026-09-27 — Restore previous top border

Owner preferred the preceding border over the full-corner trial. Restored the native `3px solid var(--purple-700)` top border and removed the curved pseudo-element. Toolbar, sorting, and review-filter behavior unchanged. `git diff --check` and production build passed (existing bundle-size warning). No commit or push.
