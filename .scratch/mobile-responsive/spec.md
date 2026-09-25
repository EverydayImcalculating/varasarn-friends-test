# Mobile responsive: every screen usable on a 360–393px phone

Status: ready-for-agent

Source: [`audit.md`](audit.md) (2026-09-25, iPhone 16 393×852 and 360×780, through `npm run dev:mock`).

## Problem Statement

Most students open Varasarn Close Friends on a phone. The audit found that several screens are unusable or read badly at 393px and 360px wide.

- **Account menu out of reach.** On the Timetable, My Reviews and Admin dashboard screens there is no account menu on a phone. A student can't sign out, open "รีวิวของฉัน", or jump to "แดชบอร์ดผู้ดูแล" without first tapping "หน้าหลัก". The desktop dropdown is hidden below `md`. The mobile account button is only drawn on the catalog.
- **Timetable mostly hidden.** The timetable is a fixed 900px-wide week grid inside a sideways-scrolling box. A phone shows about 08:00–11:00 and nothing says there is more. A class at 13:00 is invisible until the student happens to swipe the grid. This is the biggest usability risk in the audit.
- **My Reviews action buttons.** The buttons on each review card ("แก้ไข", "ถอนรีวิว"/"เผยแพร่อีกครั้ง", "ดูประวัติการแก้ไข") squeeze into one row. They wrap mid-word into 3-line pills 90–130px tall that no longer look like buttons.
- **Header buttons.** The Timetable header buttons ("ล้างตาราง", "หน้าหลัก") wrap mid-word into tall narrow boxes.
- **Import example.** The JSON example on the admin import screen is inline prose. It reflows across about 8 short lines.
- **Small touch targets.** Most small buttons, pills and every close "×" are 23–39px tall, below the 44pt iOS guidance. The modal close button is the tightest, and it is the main way to dismiss a dialog.
- **Scroll strips.** The category pill strip and the admin section strip scroll sideways with no visual hint that more items exist.
- **Merge arrow.** On the admin merge screen the "→" arrow floats next to the first select once the two selects stack, so it points at nothing.
- **Safe areas.** The floating contact button and the toast ignore the notch and home-indicator areas on real iPhones.
- **Modal overflow.** Short centred dialogs (add course, contact, confirm) have no scroll fallback. If their content ever grows taller than the screen, the top gets clipped.
- **Long course names.** They wrap the course-review dialog title to 3 lines and push the close button down.

## Solution

Every signed-in screen fits and works at 360–393px with no sideways page scroll. Desktop and tablet layouts stay as they are. The changes are only to layout, markup and styling. Every action a student or admin takes calls the same RPCs and service methods with the same arguments, and shows the same Thai messages, toasts and confirm dialogs as today.

- **Account menu everywhere.** The full-width account button already used on the catalog (name → รีวิวของฉัน / แดชบอร์ดผู้ดูแล / ออกจากระบบ) appears at the top of every signed-in screen on phones, not only the catalog.
- **Timetable becomes a daily agenda on phones.** Below 768px the week grid is replaced by one card per day that has classes, Monday to Sunday. Each card lists that day's classes in start-time order: the time range, the course code and section, and the instructor, in the same colour as on the grid. Tapping a class opens the same "remove from timetable?" confirmation as tapping a grid block. Days with no classes are left out. From 768px up the grid is unchanged.
- **Tidy action rows.** On phones, My Reviews card actions become a neat two-row block. "แก้ไข" sits next to "ถอนรีวิว"/"เผยแพร่อีกครั้ง", and "ดูประวัติการแก้ไข" gets its own full-width row. No label breaks mid-word.
- **Stacked headers.** On phones, the Timetable and My Reviews headers put the title on one row and the buttons in an equal-width row below it.
- **Scrollable import example.** The import JSON example sits in a small scrollable code block on one line.
- **Touch targets.** On phones and touch screens every button, pill, menu item, the navbar brand, the IG link and every close "×" is at least 44px tall. Close buttons are also at least 44px wide.
- **Scroll hints.** The category strip and the admin section strip fade out at the right edge, so it's clear they scroll. The last item can still scroll fully clear of the fade.
- **Merge arrow.** When the merge fields stack, the arrow turns to point down from the source course to the course being kept.
- **Safe areas.** The floating contact button and the toast clear the iPhone home indicator and notch. Page content leaves room at the bottom so the floating button never covers the last card.
- **Modal overflow.** Small dialogs still open centred, and scroll instead of clipping if they're ever taller than the screen.
- **Course-review header.** On phones the header keeps the full course name at a slightly smaller size, with a large close button pinned to the top-right.

### Timetable-on-phone decision

We chose an agenda list, not the other options:
- **Keeping the grid with a "swipe for more" hint or auto-scroll:** a phone would still show about 4 of 12 hours at a time.
- **A transposed grid (days as columns):** each column would be about 45px wide at 360px, too narrow for a course code.

The ui-ux-pro-max UX guidelines support this. "Avoid horizontal scrolling" is rated high severity. For wide tables on mobile they say "use horizontal scroll or card layout". An agenda is the card layout, and it removes the hidden scroll completely.

## User Stories

1. As a student on a phone, I want an account button at the top of the Timetable screen, so that I can sign out without going back to the catalog first.
2. As a student on a phone, I want an account button at the top of the My Reviews screen, so that I can switch screens or sign out from there.
3. As an administrator on a phone, I want an account button at the top of the Admin dashboard, so that I can reach "รีวิวของฉัน" or sign out without leaving the dashboard first.
4. As a student on a phone, I want the account menu to show the same items as on desktop (รีวิวของฉัน, แดชบอร์ดผู้ดูแล for admins, ออกจากระบบ), so that phone and desktop behave the same.
5. As a student on a phone, I want each account-menu item to be easy to tap, so that I don't hit "ออกจากระบบ" by mistake.
6. As a student on a phone, I want my timetable shown as a list of days, so that I can see every class without swiping sideways.
7. As a student on a phone, I want each day's classes in start-time order, so that I can read my day from top to bottom.
8. As a student on a phone, I want days with no classes left out of the list, so that the list stays short and I can see my free days at a glance.
9. As a student on a phone, I want each class to show its time range, course code, section and instructor, so that I get the same information as a grid block.
10. As a student on a phone, I want each class in the same colour as on the desktop grid, so that the same course looks the same everywhere.
11. As a student on a phone, I want classes after 13:00 to be as visible as morning classes, so that I don't miss an afternoon class.
12. As a student on a phone, I want to tap a class in the list and get the same "remove from timetable?" confirmation, so that removing works the same as on desktop.
13. As a student on a phone, I want the removal toast and the updated list after I confirm, so that I know the class is gone.
14. As a student on a phone, I want classes I added from a review's reported time to appear in the list like approved sections, so that my whole timetable is in one place.
15. As a student on a tablet or desktop, I want the week grid to stay as it is, so that I keep the week-at-a-glance view where there is room for it.
16. As a student on a phone, I want the Timetable title on its own row with "ล้างตาราง" and "หน้าหลัก" side by side below it, so that neither label breaks mid-word.
17. As a student on a phone, I want the My Reviews header laid out the same way, so that both personal screens look consistent.
18. As a student on a phone, I want the legacy-timetable import banner to keep working as it does today, so that importing my old timetable is unaffected.
19. As a student on a phone, I want each review card's actions laid out as clean full-size buttons, so that they look and work like buttons.
20. As a student on a phone, I want "แก้ไข" and "ถอนรีวิว" (or "เผยแพร่อีกครั้ง") on one row and "ดูประวัติการแก้ไข" on its own row, so that every label fits on one line.
21. As a student on a phone, I want the review date to sit above the actions, so that it isn't squeezed next to the buttons.
22. As a student on a phone, I want editing, withdrawing, republishing and viewing history to behave exactly as before, so that nothing changes except the layout.
23. As a student on a phone, I want every button to be at least 44px tall, so that I can tap it reliably with a thumb.
24. As a student on a phone, I want the "×" close button on every dialog to be at least 44×44px, so that closing a dialog doesn't take several tries.
25. As a student on a phone, I want the category pills to be tall enough to tap comfortably, so that filtering the catalog is easy.
26. As a student on a phone, I want the category strip to fade at the right edge, so that I know there are more categories to swipe to.
27. As a student on a phone, I want the last category pill to scroll fully clear of the fade, so that I can read and tap it.
28. As a student on a phone, I want the navbar brand (home) button to be easy to tap, so that getting home is quick.
29. As a student on a phone, I want the IG contact link in the about card to be easy to tap, so that I can reach the student committee.
30. As a student on a phone, I want a long course name in the review dialog header to wrap neatly, with the close button staying at the top-right, so that the header doesn't look top-heavy.
31. As a student on a phone, I want to still see the full course name in the review dialog, so that I can confirm I opened the right course.
32. As a student on a phone, I want the "เขียนรีวิว / เพิ่มเซคชั่น" and "เพิ่มลงตาราง" buttons to be full-size touch targets, so that writing a review and adding a section are easy.
33. As a student on an iPhone with a home indicator, I want the floating contact button to sit above the home indicator, so that I don't trigger the system gesture instead.
34. As a student on a notched iPhone, I want the success toast to appear below the notch, so that I can read it.
35. As a student on a phone, I want enough space at the bottom of every screen that the floating contact button never covers the last card or button, so that I can reach everything.
36. As a screen-reader user on a phone, I want the icon-only floating contact button to announce "แจ้งปัญหา/ติดต่อ", so that I know what it does.
37. As an administrator on a phone, I want the add-course dialog to scroll if it ever gets taller than my screen, so that its top and its save button stay reachable.
38. As a student on a phone, I want confirmation dialogs to scroll instead of clipping if a message is long, so that I can always reach the confirm and cancel buttons.
39. As an administrator on a phone, I want the admin section strip to fade at the right edge, so that I can tell more sections are available.
40. As an administrator on a phone, I want "← กลับหน้ารายวิชา" to be a full-size touch target, so that leaving the dashboard is easy.
41. As an administrator on a 360px phone, I want slightly tighter dashboard padding, so that forms and lists have room without wrapping unnecessarily.
42. As an administrator on a phone, I want the bulk-import JSON example in a scrollable code block, so that it doesn't take over the step.
43. As an administrator, I want the bulk-import example text to stay exactly the same, so that I can still copy the expected shape.
44. As an administrator on a phone, I want the merge arrow to point down from the source course to the course being kept once the fields stack, so that the merge direction stays clear.
45. As an administrator on a phone, I want every admin section action (edit, archive, approve, reject, hide, remove, grant, revoke) to be a full-size touch target, so that moderation on a phone is reliable.
46. As an administrator, I want the desktop sidebar dashboard to look the same as today, so that the phone fixes don't change my desktop workflow.
47. As a student on any screen at 360px, I want the page never to scroll sideways, so that the layout feels stable.
48. As a student using a desktop browser with a mouse, I want the catalog, dialogs and screens to look as they do today, so that the phone work doesn't change my experience.
49. As a signed-out visitor on a phone, I want the login screen to stay as it is, so that the one screen that already works keeps working.

## Implementation Decisions

**Scope and constraints**
- Only layout, markup and styling change. No RPCs, service modules, service method signatures, component props or emits, Thai copy (except one new accessible label), or database objects are added or changed.
- All styling extends the shared stylesheet: its `:root` tokens and its existing class vocabulary. It uses the stylesheet's existing breakpoints: `max-width: 575px` (phone), `max-width: 767px` (below `md`), `min-width: 992px` (admin sidebar). Bootstrap utilities stay in use.
- Phone fixes are additive rules inside media queries. Desktop rules are not rewritten.

**New tokens**
- `--tap-min` (44px): the minimum touch-target size.
- `--scroll-fade` (24px): the width of the edge fade on horizontal strips.
- `--safe-top`, `--safe-right`, `--safe-bottom`, `--safe-left`: the matching `env(safe-area-inset-*)` values, each falling back to 0px.
- The page viewport meta gains `viewport-fit=cover`. Without it iOS reports every safe-area inset as 0.

**Account menu (App root)**
- The existing mobile account menu is shown on every signed-in screen: catalog, Timetable, My Reviews and Admin dashboard. We remove the condition that limited it to the catalog.
- It keeps its `d-md-none` phone-only visibility, and its open state, items and handlers stay shared with the desktop dropdown.
- We chose this over adding an icon to the navbar. At 360px the navbar has no room for another control next to the brand and the timetable button, and this reuses a pattern that already works.

**Timetable agenda (App root)**
- A new agenda list renders next to the existing grid. The agenda shows only below `md` and the grid only from `md` up, both through Bootstrap display utilities. No JavaScript media query or resize listener is needed.
- A new computed value in the App root derives the agenda from the same timetable entries the grid uses:
  - an ordered list of `{ day, entries }`
  - days 1–7 in order, keeping only days that have entries
  - each day's entries sorted by start time
- Each agenda entry is a real button with class `timetable-agenda-item`. It carries the same colour class the grid uses for that course code and the same "คลิกเพื่อลบวิชานี้" title.
- Clicking an entry calls the same remove-confirmation handler the grid block calls. The confirm dialog, remove RPC, reload and toast are therefore identical.
- Each entry shows the time range, then "code (section)", then the instructor when there is one.
- New classes: `timetable-agenda` (the list), `timetable-agenda-day` (a white card per day in the existing card style: `--line` border, `--radius-lg`, `--shadow-card`), `timetable-agenda-day-label`, `timetable-agenda-item` (at least `--tap-min` tall, a two-column time | details layout), `timetable-agenda-time`.
- The grid's existing classes, including `timetable-course`, are unchanged. Existing tests and styles that target them keep working.

**Screen headers (Timetable, My Reviews)**
- A shared `screen-header` class on each screen's title/actions row adds wrapping and a gap. A `screen-header-actions` class goes on the button group.
- My Reviews' single "หน้าหลัก" button gets wrapped in that group so both headers share one structure.
- At ≤575px the actions group takes the full width below the title. Its buttons share the row equally and never wrap their labels.

**My Reviews card actions**
- New classes: `my-review-footer` (the date + actions row) and `my-review-actions` (the button group).
- At ≤575px:
  - The footer stacks the date above the actions.
  - The actions become a full-width two-column grid. The history toggle ("ดูประวัติการแก้ไข" / "ซ่อนประวัติ") spans both columns on its own row.
  - Labels don't wrap.
- From 576px up the layout is unchanged. Labels are unchanged at every width.

**Touch targets**
- These rules live in one block that applies at ≤575px *or* on coarse pointers, so touch tablets benefit too.
- **Every `.btn`:** gets a minimum height of `--tap-min` and becomes an inline flex box with centred content, so taller buttons keep their label vertically centred. This covers small buttons, category pills, the timetable navbar button, the account buttons and the admin back link. Bootstrap display utilities still win because they are `!important`.
- **`.btn-close`:** padding sized so the box is `--tap-min` square, and it won't shrink inside flex headers.
- **Navbar brand, account-menu items and the about-card IG link:** each gets a minimum height of `--tap-min`.
- **Spacing:** the existing 8px gaps (`gap-2`) already meet the "8px between targets" guideline.

**Horizontal strips**
- The category strip (≤767px) and the admin section strip (below 992px, while it is a horizontal strip) get a right-edge fade, done as a mask gradient over the last `--scroll-fade`.
- Each also gets a trailing pseudo-element spacer of the same width, so the last item can scroll out of the fade.
- The fade is removed in the existing ≥992px admin sidebar rules.

**Course-review dialog header**
- At ≤575px: header items align to the top, the title drops to 1rem with slightly tighter line height, and the close button keeps its 44px box at the top-right.
- The full course name is kept, not truncated.

**Overlays and fixed elements**
- **Floating contact button:** its bottom and right offsets add the matching safe-area inset to the current 22px. It gains an accessible label "แจ้งปัญหา/ติดต่อ", because on phones it shows only an icon.
- **Toast:** its top offset adds the top safe-area inset to the current 20px.
- **Course-review overlay:** its side padding becomes the larger of the current padding and the side safe-area insets, for landscape phones.
- **Small-dialog overlay** (contact, add course) and **confirm overlay:** switch from grid centring to a flex container that scrolls vertically, with the card centred by automatic margins. Short dialogs look the same. A dialog taller than the viewport scrolls from its top instead of clipping.
- **Bottom padding:** the signed-in page container's bottom padding moves from the `pb-5` utility to a new `app-body` class. It is 3rem as today, and at ≤575px it grows to clear the floating button plus the bottom safe-area inset.

**Admin dashboard**
- **Import section:** the JSON example moves out of the instruction sentence into its own `admin-code-example` block (a preformatted code block). The block scrolls sideways, doesn't wrap, uses a small monospace size, and has a `--line` border and `--radius-md` corners. The example text is unchanged.
- **Content column:** gets `min-width: 0` so wide preformatted content can't push out the flex row at the sidebar width.
- **Merge section:** at ≤767px the merge row becomes a column with full-width fields. The arrow rotates 90°, is centred, and points from the source course to the course being kept.
- **Padding at ≤575px:** the dashboard header, content area and section cards get slightly less padding, which gives about 24px more usable width at 360px.

## Testing Decisions

- **What makes a good test here:**
  - Tests assert what a user can see and do: which controls are present on which screen, what they say, and which RPC runs when one is tapped.
  - They don't assert class lists or CSS values.
  - jsdom doesn't evaluate media queries, so both the grid and the agenda are in the DOM during unit tests. Tests target the agenda by its own class.
- **Seam:** App-level component tests. We mount the App root with the mocked Neon client and its per-RPC fixtures, the same way the existing review-to-timetable, my-reviews-page and admin-dashboard App tests do. No new seam is introduced.
- **New or extended tests:**
  - **Account menu:** after opening the Timetable, My Reviews and Admin dashboard screens, the mobile account menu is present on each, and its sign-out item calls sign-out.
  - **Agenda:**
    - Fixtures with entries on several days, in mixed order, give one agenda day per day that has entries, in Monday→Sunday order, with entries sorted by start time.
    - Days without entries are absent.
    - Each item shows the time range, "code (section)" and the instructor.
  - **Agenda removal:** clicking an agenda item opens the same confirm dialog as clicking a grid block. Confirming calls the same remove RPC (for both an approved offering entry and a review-reported entry) and removes the item.
  - **Import example:** the admin import section shows the JSON example inside a preformatted code block, with exactly the same text as before.
  - **Unchanged behaviour:** existing assertions keep passing unmodified. These cover timetable grid blocks, desktop account-menu items, My Reviews history/edit/withdraw buttons found by their labels, and the toasts.
- **Visual verification (manual, in the in-app browser):**
  - Run the mock dev server (the `dev-mock` launch configuration) at 393×852 and 360×780.
  - On the catalog, the review dialog, the add-course dialog, Timetable (empty and populated), My Reviews, and all nine admin sections, re-run the audit's probe:
    - the page scroll width equals its client width
    - no interactive element is under 44px tall, except inline text links
    - no input has a font size under 16px
  - Screenshot the timetable agenda, a My Reviews card, and the Timetable header at 360px.
  - Spot-check that the ≥768px grid and the ≥992px admin sidebar look unchanged.
- **Gates:** the full unit test suite and the production build (which includes the type check) both pass.

## Out of Scope

- Any change to RPCs, services, the database, auth, or what any action does.
- A sticky course-review dialog header or a sticky close button.
- A special layout for 768–991px tablets. The grid keeps its contained horizontal scroll there.
- Scroll hints, auto-scroll to the current hour, or other changes to the desktop/tablet week grid.
- Landscape-phone layout beyond the safe-area padding described above.
- Cleaning up dead template blocks (the hidden "selected courses" list and the hidden proposal box) and the legacy `:has()` layout selectors.
- Closing the account menu on an outside tap. The current toggle-only behaviour is kept.
- Changing button labels or other copy, apart from the new accessible label on the floating contact button.

## Further Notes

- **Dev tooling:** the audit relied on the dev-only mock entry point: a fake signed-in owner session plus RPC fixtures, served by `npm run dev:mock`. The implementer should use the same entry point to verify screens behind Google sign-in. It is never part of the production build.
- **Why touch targets also use a pointer query:** the rule applies on coarse pointers as well as at ≤575px because the 44pt guidance is about fingers, not screen width. The width condition keeps it testable in an emulated phone viewport.
- **Why `viewport-fit=cover` is safe:** safe-area insets are 0 in portrait on the sides, and in landscape the Bootstrap container's margins already exceed the notch inset. Only the full-width course-review overlay needs the explicit side padding.
- **UX guideline lookups** (ui-ux-pro-max, `--domain ux`), used only where a decision needed them:
- "Horizontal Scroll" and "Table Handling" → the agenda decision
- "Touch Target Size" and "Touch Spacing" → 44px targets with the existing 8px gaps
- "Fixed Positioning" → the safe-area handling for fixed elements

## Comments

- **2026-09-25:** Added the phone account menu to every signed-in screen, the day-by-day timetable agenda, stacked personal-screen headers, two-row My Reviews actions, the scrollable import example, and the specified touch, strip, safe-area, modal, and admin layout rules. Added App-level coverage for the mobile account menu/sign-out, agenda ordering/removal, and the unchanged import example. `npm test -- --run` passed (16 files, 94 tests); `npm run build` passed (with the existing chunk-size advisory). Checked the mock app in the in-app browser at 393×852 and 360×780: catalog, review and add-course dialogs, populated and empty Timetable agenda, My Reviews, and all nine admin sections; also checked the contact dialog at 360×780. For the checked screens, the document scroll width matched the viewport, visible buttons met 44px, and inputs were at least 16px. Captured the 360px timetable, My Reviews card, and long-course review header. At 1024px, confirmed the week grid is visible and the admin dashboard retains its 240px sidebar. After review, ensured the Instagram link uses a flex display so its minimum touch height applies, preserved agenda item course colors, and applied safe-area side padding to landscape course-review dialogs. The empty Timetable state was rechecked at both phone sizes: no horizontal page scroll, undersized controls, or undersized inputs.
