# Mobile responsive audit — iPhone 16 (393×852) and 360×780

Date: 2026-09-25
Scope: whole app, signed-out login screen + signed-in owner/admin session
Method: `npm run dev:mock` (fake signed-in owner session + RPC fixtures, see below) driven through the in-app browser, resized with `resize_window` to 393×852 and 360×780. For each screen: a JS probe (`document.documentElement.scrollWidth` vs `clientWidth`, plus a scan for elements whose right edge exceeds the viewport, touch targets under 44px, and `<input>/<select>/<textarea>` with computed `font-size < 16px`), `read_page` for structure, and a screenshot when something looked wrong. Login screen was checked against the real signed-out app (`npm run dev`, real Neon backend, no mock) since it needs no auth.

No app code was changed for this audit beyond the dev:mock scaffolding (`mock/neon.mock.ts`, `vite.mock.config.ts`, the `dev:mock` script, `.claude/launch.json`). Nothing below has been fixed yet.

**Severity key**: `broken` = feature unusable or unreachable on a small phone · `ugly` = renders but looks/reads badly (wrapping, cramped, no scroll affordance) · `minor` = polish-level.

---

## Cross-cutting findings (apply to many screens)

1. **[ugly] Touch targets under 44px height are the norm, not the exception.** Nearly every `.btn-sm` and several full-size buttons measure 24–39px tall at both widths: navbar brand button (36px), "ตารางเรียนเดิม" (31px), mobile account-menu toggle (34px), IG link (25px), "+ เพิ่มรายวิชาใหม่" (39px), category pills (39px), all `.btn-close` (23–24px square), "เขียนรีวิว / เพิ่มเซคชั่น" (29px), "เพิ่มลงตาราง" (31px). None of these are broken, but they're all under Apple's 44×44pt guidance for touch. **Selector**: `.btn-sm`, `.btn-close`, `.category-btn`, `.navbar-brand`. **Direction**: bump `.btn-sm` min-height/padding on touch, or add a `min-height:44px` utility for icon-only close buttons at minimum (those are the tightest, most-clicked case).

2. **[minor] Fixed-position elements don't reserve `env(safe-area-inset-*)`.** `.floating-contact-btn` (`bottom:22px`), `.toast-banner` (`top:20px`), and the various modal overlays don't account for the iPhone home-indicator/notch safe areas. Nothing overlapped in the emulated viewport (which doesn't model the inset), but on a real notched device the floating button and toast sit right at the edge of the safe area. **Selector**: `.floating-contact-btn`, `.toast-banner`. **Direction**: add `padding-bottom: max(22px, env(safe-area-inset-bottom))` (and similarly for the toast's `top`).

3. **[ugly] Horizontally-scrolling strips have no scroll affordance.** `.category-menu` (category pills) and `.admin-nav` (admin section pills) both rely on `overflow-x:auto` with no visible scrollbar, shadow/fade edge, or "swipe" hint. It works, and the admin pill strip at least shows a visibly cut-off pill at the edge as a hint — but the category strip's last pill can land flush with the viewport edge with no visual cue there's more to scroll. **Direction**: add a fading edge-mask or partial-next-item peek consistently to both strips.

---

## Login (signed-out)

Checked against the real app with no mock (Google sign-in unreachable in this environment, but the signed-out shell needs no auth).

- **393×852** and **360×780**: no findings. `document.scrollWidth` == viewport width at both sizes, no touch targets under 44px, no sub-16px inputs (there are no inputs). The login card, banner image, prompt, and Google button all scale cleanly with generous margins. This screen is in good shape.

---

## Navbar + account menus

- **[broken] No way to reach the account menu (sign out / admin dashboard / my reviews) from the Timetable or My Reviews screens on mobile.** `App.vue` only renders the mobile account-menu block (`.mobile-account-menu`, `d-md-none`) when `!dashboard && !timetable && !myReviewsScreen`, and the desktop dropdown (`.account-menu`) is `d-none d-md-block` — `display:none` at 393/360px width. Confirmed via computed style: `.account-menu { display: none }` and `.mobile-account-menu` simply isn't in the DOM while on Timetable/My Reviews/Admin Dashboard. The only way out is the screen's own "หน้าหลัก" (home) button — there is no way to sign out or jump to the admin dashboard directly from those screens on a phone. **Selector**: `src/App.vue` — the `v-if="!dashboard && !timetable && !myReviewsScreen"` guard on `.mobile-account-menu`. **Direction**: render the mobile account-menu (or at least a sign-out affordance) on every signed-in screen, or add the same dropdown to each screen's own header bar.

- **[ugly] Mobile account-menu dropdown itself is fine** — full-width, legible, good tap targets once open (confirmed on catalog page). No issues with its content.

- **[minor] Navbar brand button + "ตารางเรียนเดิม" badge button both under 44px tall** (see cross-cutting #1).

---

## Catalog page

- **[ugly] Course card grid**: no defects — cards stack full-width in a single column at both sizes, text wraps cleanly, badge/title/description all legible. (One apparent "giant blank gap" during testing turned out to be a screenshot-capture timing artifact of the browser tool, not a real rendering bug — re-verified via layout rects and a fresh screenshot.)

- **[ugly] Category pill strip (`.category-menu`)** — functions via horizontal scroll (page itself does not overflow, confirmed `scrollWidth === clientWidth`), but see cross-cutting #3 for the affordance issue. Also see #1: each pill is 39px tall, under the 44px guidance.

- **[minor] "รายวิชาทั้งหมด" heading + "+ เพิ่มรายวิชาใหม่" button row** wraps acceptably via `flex-wrap gap-2`; no overflow at either width. No action needed.

- Search input font-size is 16px+ (no zoom-on-focus risk). About card, contact strip, and IG link all readable and unclipped at both widths.

---

## Course review modal

- **[ugly] Filter select row (rating / semester / year)** stacks to one column below `sm` (576px) — reads fine, no overflow.

- **[minor] `.btn-close` in the modal header is 23–24px square**, well under the 44px target, and it's the only way to dismiss the modal besides clicking the overlay. (Same issue as cross-cutting #1, called out here because it's a primary dismiss action.)

- **[ugly] Modal header title wraps to up to 3 lines at 360px** for longer course names (e.g. "JC100 - หลักการวารสารศาสตร์เบื้องต้นและการสื่อสารมวลชนในยุคดิจิทัล"), pushing the close button down; not broken, just visually top-heavy. **Selector**: `.course-review-header h1`.

- **Review form (เขียนรีวิว / เพิ่มเซคชั่น)**: all fields stack cleanly at both widths, inputs are ≥16px font (no iOS zoom-on-focus), "บันทึกข้อมูล" submit button is full-width and easy to hit. No defects.

- **Report-only review card (no approved offering, e.g. BJM210 fixture)**: renders correctly — "ไม่มีกลุ่มเรียนที่อนุมัติ รีวิวนี้รายงานเวลาเรียนเอง" message, badge, and "เพิ่มลงตาราง" button all legible and unclipped.

- **Add-to-timetable confirm dialog and toast**: both render centered and fully within viewport at 393×852 and 360×780, text wraps, buttons are full width. No defects.

- **Add-course admin modal** (`.contact-panel` / `.contact-modal-card`, reused for "+ เพิ่มรายวิชาใหม่"): renders cleanly, no overflow, though note this modal has no `overflow-y:auto` on its own wrapper (unlike `.course-review-modal`) — with more fields than the 3 current fields it could clip at the top on a short viewport since it's vertically centered via `place-items:center` with no scroll fallback. Not currently broken since the form is short. **Selector**: `.contact-panel`. **Direction**: add `overflow-y:auto` defensively.

---

## Timetable page

- **[ugly] Header action buttons wrap their labels into 2–3 lines and balloon in height.** "ล้างตาราง" (Clear) and "หน้าหลัก" (Home) sit in a `.d-flex.gap-2` with no `flex-wrap`, so as the heading text grows (especially at 360px, where "ตารางเรียนส่วนตัว" itself wraps to 2 lines and crowds the buttons) each button's available width shrinks until the label wraps mid-phrase: "ล้าง" / "ตาราง" and "หน้า" / "หลัก" stack on separate lines. Measured button size at 393px: "ล้างตาราง" 68×86px (vs. its single-line ~120×39px on desktop). **Selector**: the `.d-flex.justify-content-between.align-items-center.mb-4` row in `App.vue`'s timetable section, buttons `.btn-outline-danger` / `.btn-purple`. **Direction**: icon-only buttons on narrow viewports, or drop to a 2-line header layout (title row, then a full-width button row below).

- **[broken-ish/ugly] The timetable grid requires horizontal scrolling to see most of the week.** `.timetable-grid` has `min-width:900px` inside `.timetable-container{overflow-x:auto}` — this is contained (no page-level overflow, confirmed `scrollWidth === clientWidth` at both sizes) so it's not a hard bug, but on a 393px phone only ~4 of the 12 hourly columns (08:00–11:00-ish) are visible at once, and per cross-cutting #3 there's no visual cue that the grid scrolls. A class meeting later in the day (e.g. 13:00+) is invisible until the user discovers they can swipe the grid sideways. **Selector**: `.timetable-grid`, `.timetable-container`. **Direction**: this is the single biggest usability risk in the whole audit — consider a day-by-day / agenda-list view under a breakpoint instead of a fixed 900px-wide week grid, or at minimum add a scroll shadow + "swipe for more hours" hint and default-scroll to the current time.

- **Legacy-import panel**: renders correctly — banner card, "ไว้ภายหลัง" (later) and "ตรวจสอบตารางเดิม" (check) buttons both fit and are tappable, description text wraps cleanly. No defects.

- Confirm-remove dialog (clicking a course block) renders centered and fully readable at 360×780, including a fairly long generated message ("ต้องการลบวิชา JC100 ออกจากตารางเรียนใช่ไหม?"). No defects.

---

## My Reviews page

- **[broken/ugly] Per-review action button row wraps into unreadable multi-line pills.** The 3 action buttons (`แก้ไข` / `ถอนรีวิว` or `เผยแพร่อีกครั้ง` / `ดูประวัติการแก้ไข`) sit in a `.d-flex.gap-2` with `rounded-pill` buttons and no wrap — at 393px width, "ดูประวัติการแก้ไข" wraps into 3 lines ("ดู" / "ประวัติการ" / "แก้ไข") inside what's supposed to be a pill shape, and "เผยแพร่อีกครั้ง" similarly wraps into "เผย" / "แพร่อีก" / "ครั้ง". The pill buttons balloon to ~90–130px tall and look broken rather than like buttons. **Selector**: `App.vue`'s My Reviews `article.review-box`, the `.d-flex.gap-2` row containing `.btn-outline-purple`, `.btn-outline-danger`/`.btn-purple`, `.btn-outline-secondary` (all `rounded-pill px-3`). **Direction**: stack these 3 actions full-width on mobile (one per row) instead of forcing them into a fixed-shape pill row, or shorten labels ("ประวัติ" instead of "ดูประวัติการแก้ไข") at narrow widths.

- **Edit-in-place form** (rating select + textarea + ยกเลิก/บันทึก): renders cleanly, no overflow, good touch targets on Cancel/Save. No defects.

- List/empty states, review text wrapping, and the "เผยแพร่แล้ว"/"ถอนการเผยแพร่" status badges all read fine at both widths.

---

## Admin dashboard (all 9 sections)

Shared shell: mobile pill-strip nav (`.admin-nav`, horizontal scroll) works and is reasonably discoverable (next pill visibly cut off at the edge). "← กลับหน้ารายวิชา" back button is small (26px tall) — see cross-cutting #1.

Per-section mobile layout (all checked at 393px, spot-checked at 360px):

1. **รายวิชา (Courses)** — search/category/status filters stack cleanly; each course row's "แก้ไข"/"เก็บเข้าคลัง" buttons sit side by side and fit (49px + 84px wide, both readable, though under 44px tall). No overflow.
2. **หมวดหมู่ (Categories)** — add-category input + button, and the category list with inline "แก้ไข" — all clean, no issues.
3. **รวมรายวิชาซ้ำ (Merge)** — **[minor]** the "→" arrow between the "source course" and "target course" selects is meant to visually connect two side-by-side fields (desktop `.admin-merge-row` is a flex row); on mobile the two selects stack vertically instead, so the arrow ends up floating to the right of the first select with nothing to visually connect — mildly disorienting but not broken. **Selector**: `.admin-merge-arrow`.
4. **ภาคการศึกษา (Academic periods)** — year/semester inputs + add button + existing-period chips, all clean.
5. **กลุ่มเรียน (Offerings)** — course search/select plus the "เพิ่มกลุ่มเรียน" (add offering) form (year, semester, section, instructor, day, start/end time) all stack one-per-row cleanly, including native `type=time` inputs. No defects.
6. **นำเข้ารายวิชา (Bulk import)** — **[ugly]** the instructional JSON example (`[{"courseCode":"JC100","academicYear":2569,...}]`) is written as inline prose text rather than inside a `<pre>`/`<code>` block, so at 393px it force-wraps across ~8 short lines, eating a large amount of vertical space and reading worse than a scrollable code block would. The actual `<textarea>` below it wraps the same way (expected for a textarea, that part's fine). **Selector**: the JSON example inside `.admin-steps li` (step "1. วางข้อมูล") in `AdminImport.vue`. **Direction**: wrap the inline example in a `<pre>` with `overflow-x:auto` and a smaller monospace size so it stays on 1–2 scrollable lines instead of reflowing the whole paragraph.
7. **ขอกลุ่มเรียน (Proposals)** — pending-proposal card with "ปฏิเสธ"/"อนุมัติ" side-by-side buttons, badge count "1" on the nav pill — all clean, no overflow.
8. **รีวิว (Moderation)** — search + status filter + "โหลดใหม่" button + review card with reason textarea and "ซ่อน"/"นำออก" actions — all clean at 393px.
9. **ผู้ดูแลระบบ (Roles, owner-only)** — current-admin list with "ถอนสิทธิ์" action, verified-accounts search, "แต่งตั้งผู้ดูแล" per account — all clean, confirmed the owner-only section is reachable (mock session role set to `owner`) and its pill nav item and content render without overflow at 393px and 360px.

No horizontal page-level overflow (`scrollWidth === clientWidth`) was found on any of the 9 sections at either viewport width.

---

## Summary punch list (highest priority first)

| # | Screen | Severity | Issue |
|---|---|---|---|
| 1 | Navbar (Timetable / My Reviews / Admin Dashboard) | broken | No account-menu access on mobile outside the catalog screen — can't sign out or switch screens without going home first |
| 2 | Timetable grid | broken-ish | 900px-min-width grid on a 393px phone hides most of the week behind an undiscoverable horizontal scroll |
| 3 | My Reviews action buttons | broken/ugly | 3-button pill row wraps into unreadable multi-line blobs |
| 4 | Timetable header buttons | ugly | "ล้างตาราง"/"หน้าหลัก" wrap mid-word into tall narrow buttons |
| 5 | Admin → Import | ugly | Inline JSON example reflows across ~8 lines instead of a scrollable code block |
| 6 | App-wide | ugly | Most `.btn-sm`/pill/close buttons are under the 44px touch-target guidance |
| 7 | Category pills / Admin nav pills | ugly | Horizontal-scroll strips have little/no scroll affordance |
| 8 | Admin → Merge | minor | Arrow between merge selects is orphaned when fields stack vertically |
| 9 | App-wide | minor | Fixed elements (floating contact button, toast) don't reserve safe-area insets |
| 10 | Add-course modal | minor | No `overflow-y:auto` fallback if content ever grows taller than the viewport |
