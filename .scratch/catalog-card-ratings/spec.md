# Catalog card rating summary, and star ratings shown out of 5

Status: ready-for-agent

## Problem Statement

Two related problems with how ratings appear.

1. **A review's rating reads as a bare count of stars.** Everywhere a review's rating is shown, it renders only filled stars equal to the rating. A 2-star review shows `★★` with nothing to say "out of 5", so readers can't tell a low rating from a layout quirk.
   - Affected places: course-review cards in the course dialog, the My Reviews page, the My Reviews edit-history rows, and the admin ตรวจสอบรีวิว (review moderation) section.
   - The legacy site (`git show 0b1b1c8^:index.html`) rendered `'★'.repeat(rating) + '☆'.repeat(5 - rating)`, so this is also a regression from legacy.
   - Screen readers hear a run of "star" characters, not a rating.
2. **The catalog course card tells a student nothing about reviews.** This is a course-review site, but each card shows only the category badge, course code and Thai name. To learn whether a course has any reviews, or what students thought of it, a student has to open every course one by one.

## Solution

1. **Every individual rating renders as five star glyphs out of 5.**
   - The rating's number of filled stars `★` comes first, then hollow stars `☆` up to five. For example, a 4-star review reads `★★★★☆`.
   - Filled stars keep the existing amber colour, and hollow stars use a light purple tint. The filled vs. hollow shape carries the meaning, not colour alone.
   - Each rating carries screen-reader text "ให้คะแนน N จาก 5 ดาว", and the glyphs themselves are hidden from assistive technology.
   - No visible "N/5" text next to individual ratings. The owner chose stars plus screen-reader text only.
2. **Each catalog course card gains a rating summary line under the course name.**
   - With reviews: the average shown as five stars (rounded to the nearest whole star), the average to one decimal, and the review count. For example: `★★★★☆ 4.2 · 12 รีวิว`.
   - With no reviews: `ยังไม่มีรีวิว` in muted text.
   - Screen-reader text: "คะแนนเฉลี่ย 4.2 จาก 5 จาก 12 รีวิว".
   - The counts come from the same set of reviews the course dialog lists (visible, author-published), so the card and the dialog always agree.

## User Stories

1. As a student browsing the catalog, I want to see each course's average rating on its card, so that I can compare courses without opening each one.
2. As a student, I want to see how many reviews a course has on its card, so that I can judge how much to trust the average.
3. As a student, I want a course with no reviews to say "ยังไม่มีรีวิว", so that I don't mistake a missing rating for a bad one.
4. As a student, I want the card's review count to match the number of reviews I see when I open the course, so that the site feels consistent.
5. As a student, I want hidden, removed, or author-withdrawn reviews excluded from the card's average and count, so that moderation decisions are respected everywhere.
6. As a student, I want imported legacy reviews included in the card's average and count exactly when they're shown in the course dialog, so that older courses don't look unreviewed.
7. As a student, I want every review's rating shown as five stars with the rating filled in, so that I can instantly tell a 2 from a 5.
8. As a student, I want filled and empty stars to differ in shape as well as colour, so that I can read ratings on any screen or with colour-vision differences.
9. As a student on My Reviews, I want my own reviews' ratings shown out of 5 as well, so that the page matches the course dialog.
10. As a student viewing my review's edit history, I want each past version's rating shown out of 5, so that I can see how my rating changed.
11. As an administrator moderating reviews, I want ratings shown out of 5, so that I can scan the moderation list consistently with the public site.
12. As a screen-reader user, I want ratings announced as "ให้คะแนน N จาก 5 ดาว" rather than a list of star characters, so that the rating is understandable.
13. As a screen-reader user, I want the card's summary announced as "คะแนนเฉลี่ย X จาก 5 จาก N รีวิว", so that I get the same information sighted users do.
14. As a student on a phone (down to 360px wide), I want the card's rating line to fit on the card without overflowing, so that the recent mobile layout work isn't undone.
15. As a student, I want the card's rating line to keep the card's existing look (purple top line, badge, Kanit code, 2-line name clamp), so that the catalog still feels like the same site.
16. As the site owner, I want the frontend to keep working if it's deployed before the database migration, so that deploy order can't break the catalog.
17. As the site owner, I want the production migration applied only after I confirm, as with every previous migration.

## Implementation Decisions

**Shared star-rating component (new).** A small presentational Vue component used in all five places: four individual-rating spots and the card summary.
- Inputs: a numeric value from 0 to 5, whole or fractional, and the accessible label text.
- It renders five glyphs, with filled count = the value rounded to the nearest whole number and the rest hollow. The glyph wrapper is `aria-hidden="true"`, and a Bootstrap `visually-hidden` span holds the label.
- It keeps the existing `.stars` amber styling for filled glyphs. Add a rule for hollow glyphs using the light purple tint token (`--purple-300`), and keep the existing letter-spacing.
- Replace every existing `'★'.repeat(...)` call: three in the App root (course-review cards, My Reviews cards, My Reviews revision history) and one in the admin moderation section.

**Catalog RPC extended (database migration).** Extend the existing catalog function (`api.list_approved_catalog`) instead of adding a new RPC, so the api function inventory, and the pause-writes classification test that pins it at 45 functions, stays unchanged.
- The return type gains `review_count integer` and `average_rating numeric`, rounded to one decimal and null when there are no reviews.
- Aggregate over reviews where `course_id` matches, `author_active` is true and `moderation_visible` is true. That's the same filter the public review-list function applies, which is what keeps the card and the dialog consistent. Legacy reviews count exactly when those flags allow it.
- Courses with no qualifying reviews return count 0. Keep the existing `status = 'approved'` filter and the `ORDER BY code`.
- Changing a function's return type requires `DROP FUNCTION` then `CREATE FUNCTION`. That discards its existing EXECUTE grant: the original grant came from a one-time `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA api` in the first security migration, and default privileges revoke from PUBLIC. The migration must therefore explicitly `REVOKE ALL … FROM PUBLIC` and `GRANT EXECUTE … TO authenticated`, following the student-reported-reviews migration that dropped and re-created the review-list function.
- Keep it `LANGUAGE sql SECURITY DEFINER SET search_path = app_private, pg_temp`, like its siblings.
- Hand-written migration numbered after the current last one (0035), with a header comment explaining why. Add a matching entry to the drizzle migration journal, the same way the duplicate-code-error migration was added.

**Catalog loading.** No change to how the catalog is fetched. It stays on the existing paginated fetch because of the Data API's 100-row cap. The catalog course type gains two optional fields.

**Card.** A new summary line sits under the 2-line-clamped name inside the existing card markup: the star component, the average, and "· N รีวิว", or "ยังไม่มีรีวิว".
- It uses the existing tokens (`--ink-600` for the count text) at roughly the card-text size. It must not wrap awkwardly or overflow at 360–393px.
- Keep the card's existing structure, badge, code, name and hover/focus treatment.

**Deploy-order safety.** If the catalog rows lack the new fields (`review_count` undefined), render no rating line at all, not "ยังไม่มีรีวิว". That way a frontend deployed before the migration shows today's card instead of a wrong "no reviews" claim. Only an explicit `review_count === 0` shows "ยังไม่มีรีวิว".

**Out of the component's scope:** the rating inputs in the review form (a select/number control) are unchanged.

## Testing Decisions

- **Seam: App-level only**, the same seam as the course-catalog-admin, my-reviews-page, review-to-timetable-app and admin-dashboard tests. Mount the App root with the mocked Neon module and assert on rendered DOM, never on the star component directly.
- Good tests assert what a user or screen reader gets. Expected strings are literals in the test (e.g. `★★★★☆`, `ให้คะแนน 4 จาก 5 ดาว`, `4.2 · 12 รีวิว`), never rebuilt with `'★'.repeat` or any other logic that mirrors the implementation.
- New or extended App-level tests:
  1. Catalog card with `review_count: 12, average_rating: 4.2` shows `★★★★☆`, `4.2`, `12 รีวิว`, and the screen-reader text.
  2. Card with `review_count: 0, average_rating: null` shows `ยังไม่มีรีวิว`.
  3. Card whose fixture row has no rating fields at all (as in every existing fixture) shows no rating line and no `ยังไม่มีรีวิว`.
  4. A 2-star review in the course dialog renders `★★☆☆☆` with `ให้คะแนน 2 จาก 5 ดาว`, extending the review-to-timetable app test's fixture.
  5. My Reviews card and its revision history both show the out-of-5 stars, extending the my-reviews-page test.
  6. The admin ตรวจสอบรีวิว section shows out-of-5 stars, extending the admin-dashboard test.
- All existing tests must keep passing unchanged, which also proves the deploy-order safety rule, because existing fixtures lack the new fields. The pause-writes classification test must stay at 45 functions.
- **SQL verification.** The repo verifies database behaviour with scripts in the `scripts/verify-*.mjs` family, run against a database, not in vitest.
  - Add a verify script (and matching npm script) or extend the review-discovery one. It asserts the catalog RPC returns the correct count and average for a course with mixed visible, hidden and author-withdrawn reviews, 0/null for a course with none, and that `authenticated` can still execute it.
  - Run it only against a non-production Neon branch.

## Out of Scope

- Half-star or fractional star glyphs. The card's average rounds to whole stars, and the exact decimal is shown as text.
- Sorting or filtering the catalog by rating or review count.
- Showing ratings on the admin course list.
- Any change to the review form's rating input, to review creation or moderation logic, or to the course dialog's review filters.
- Adding a visible "N/5" number next to individual review ratings (owner chose stars + screen-reader text).

## Further Notes

- **Production migration needs the owner's explicit go-ahead.** Do not apply it to production; the executor stops after local verification. Earlier specs used `.env.local` credentials in a subshell without printing them, then verified the live definition via `pg_get_functiondef`. Also re-check the grant, e.g. `has_function_privilege('authenticated', 'api.list_approved_catalog()', 'EXECUTE')`.
- **Do not commit or push without asking the owner first.** The current branch is `main`.
- Verify visually at 393×852 and 360×780 (plus one desktop width) using the app's mocked signed-in dev mode if it exists (see `.scratch/mobile-responsive/`), or a throwaway harness, following the admin-dashboard spec's precedent. Check that the rating line fits, the hollow stars are visibly distinct, and the card heights stay tidy in the grid.
- Run `npm test -- --run` and `npm run build` before reporting.
- Log the implementation as a dated entry under `## Comments`, including test/build results, how the visual check was done, and that the production migration and live signed-in acceptance are still pending.
- Related specs:
  - [`../course-catalog-admin/spec.md`](../course-catalog-admin/spec.md): the catalog's paginated fetch and the 100-row cap.
  - [`../admin-dashboard-redesign/spec.md`](../admin-dashboard-redesign/spec.md): the admin moderation section.
  - [`../mobile-responsive/`](../mobile-responsive/): small-screen layout rules this must not regress.

## Comments

### 2026-09-25: Spec written

Written after a ui-ux-pro-max review of the catalog card and rating display. Its guidance applied: don't convey meaning by colour alone, and give ratings an accessible text alternative. Owner decisions:
- Add a rating summary to the card (needs the catalog RPC migration).
- Individual ratings shown as five stars with screen-reader text, no visible N/5.
- Test seam App-level only.

Ready for implementation.

### 2026-09-25: Implementation

Implemented the shared five-star rating renderer, catalog rating summary RPC migration, typed optional catalog fields, `dev:mock` rating fixtures, App-mounted coverage, and extended the isolated review-discovery verifier. `npm test -- --run` passes (16 files, 97 tests); `npm run build` passes (with the existing large-chunk warning). The mock app was visually checked at the available 1280×720 desktop viewport, including the catalog, course dialog, My Reviews and history, and admin moderation. The in-app browser did not expose a reliable way to set 393×852 or 360×780, so those requested mobile viewport checks remain pending. The database verifier was skipped because no non-production Neon branch was configured. Production migration and live signed-in acceptance remain pending.
