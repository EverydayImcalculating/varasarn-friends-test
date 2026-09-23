# 01: Authenticated catalog and anonymous review tracer

**What to build:** A Google-authenticated user can open the rebuilt app, inspect one approved course, submit a rating and written review with self-reported class details even when no official offering exists, and see that review without a public author identity. This first slice proves Vercel hosting, Neon Managed Better Auth, PostgreSQL data access, and ownership end to end; a failed browser-authentication proof triggers an explicit backend/hosting decision before expansion.

Blocked by: None (can start immediately)

Status: needs-info

- [ ] A Vue 3, TypeScript, and Vite app using Bootstrap 5 CSS and selectively imported BootstrapVueNext components can be built for Vercel; its header, colors, typography, banner/about content, and course cards remain recognizably based on the current page.
- [ ] Interactive controls are Vue-managed; the old Bootstrap JavaScript bundle and imperative DOM handlers are not copied into the rebuilt app.
- [ ] Live application reads and writes use Neon PostgreSQL with enforced database permissions, not Google Sheets or Apps Script; no database or auth-management secret is embedded in the frontend.
- [ ] Google is the only enabled sign-in method in Neon, not just the only visible button; alternate password, OTP, and other enabled-provider entry points are denied.
- [ ] Google sign-in, session refresh, and sign-out work in a deployed Vue preview, including Safari or restrictive-cookie conditions; the sign-in/callback/static shell may be public, but protected data and actions reject signed-out access.
- [ ] Sign-out clears local session and private displayed data. The observed lifetime of a copied bearer token after sign-out is recorded; immediate revocation is not a v1 requirement.
- [ ] A signed-in user can read an approved course and publish a review with an integer overall rating from 1 to 5, nonempty text, and self-reported class details without an official offering.
- [ ] The review is tied to the validated Neon Auth user ID and approved course, not a typed email, raw Google subject, or spreadsheet row; a second record by that user for the same course, academic year, term, and normalized section is rejected across all review states.
- [ ] Another signed-in user can read the review without author ID, email, token, or private revision data and cannot edit or withdraw it by calling the data interface directly; grants and exposed schemas prevent bypassing the anonymous projection.
- [ ] Automated data-interface tests cover missing/invalid credentials, authenticated catalog read, review validation, concurrent duplicate prevention, direct author-data access, and denied cross-user mutation; browser acceptance uses two Google test accounts for sign-in and review submission.
- [ ] The sign-in, catalog, course/review detail, and review composer have usable desktop and narrow-mobile layouts, visible labels/focus, and loading, empty, validation, and error states; the composer labels teacher and schedule entries as student-reported rather than official data.
- [ ] Live acceptance uses an owner-controlled Neon project, Google OAuth configuration, and a deployed preview with secrets kept out of the repo; if Vue/cookie compatibility fails, document the result and revise the architecture before treating the ticket as complete.

## Comments

### 2026-09-23 — Local implementation complete; live acceptance pending

Implemented the local Vue 3, TypeScript, Vite, Bootstrap, and BootstrapVueNext application scaffold. Added Neon Managed Better Auth and Data API browser clients that use only public endpoint variables, plus a Drizzle schema and migration history for private course, offering, and review tables.

The Drizzle migration sequence creates the seeded approved `JC100` offering, restricts private-table grants, enables RLS, and exposes only task-oriented catalog and anonymous-review RPCs. Vercel SPA routing and a release setup guide are included. `npm test` passes with four tests, `npm run build` succeeds, and `npm run db:generate` reports no pending schema changes.

The ticket now needs owner-controlled external configuration and evidence: apply the migration to Neon, configure Google as the sole provider, set trusted Vercel origins and public endpoint variables, deploy a preview, and run the two-account browser and data-interface acceptance checks. Record Safari/restrictive-cookie behavior and the observed copied-token lifetime after sign-out here.

### 2026-09-23 — Neon production branch provisioned

Linked and deployed Neon project `soft-surf-84712820` on its production branch. Managed Better Auth, the `api` Function, and Data API are active. The Data API exposes only the `api` schema, its schema cache was refreshed after applying both Drizzle migrations, and an unauthenticated RPC request was rejected for missing bearer credentials.

Neon currently lists only the shared Google OAuth provider. Its shared credentials are development-only, and no trusted deployment domain exists yet. Before this ticket can close, configure the owner-managed Google OAuth client and callback, add the deployed Vercel preview and production origins, set the two public Vite endpoint variables in Vercel, then run and record the two-account browser and token-lifetime acceptance checks.

### 2026-09-23 — Test deployment connected

The separate Vercel test project is deployed and its public endpoint variables, Neon Auth trusted domains, and Data API CORS origins are configured. The deployed app was manually confirmed working after Google authentication. The remaining evidence is a recorded two-account review/permission check and observed copied-token lifetime after sign-out.

### 2026-09-23 — Public deployment verification blocked by Vercel SSO

An unauthenticated request to the stable test deployment alias redirects to Vercel SSO rather than returning the Vite application shell. Public Google sign-in and browser acceptance cannot be reverified until the deployment’s Vercel protection is disabled for the intended test audience or an authorized reviewer session is used. This does not change Neon Auth or Data API configuration.

### 2026-09-23 — Original home interface restored in Vue

The original UI source is `git show 0b1b1c8^:index.html`; `old-repo/index.html` is a later Vite shell. The Vue home page now uses the original banner, about text, student-committee label, contact links, heading, search field, medium-screen three-column cards, purple design tokens, Prompt/Kanit fonts, and Bootstrap Icons. The navigation and contact controls remain Vue-managed. `npm test -- --run` passed 22 tests and `npm run build` passed. Course-detail modal, My Reviews layout, and live visual/browser acceptance still need comparison; this does not close Ticket 01.

### 2026-09-23 — Student detail and My Reviews styling aligned

The selected course view now uses the original modal-like overlay, gradient title treatment, responsive review cards, and filtered review controls. My Reviews uses the original two-column card treatment on desktop and one column on narrow screens. Existing proposal and moderation controls remain available but are not part of the visual acceptance target. `npm test -- --run` passed 22 tests and `npm run build` passed.

### 2026-09-23 — Signed-out landing and contact modal corrected

The signed-out screen now retains the branded banner and about shell while clearly presenting Google sign-in. The floating contact control opens a centered modal matching the original light header and action buttons. All Instagram destinations use the requested canonical `https://www.instagram.com/varasarn_official` URL, which returned HTTP 200 during verification. `npm test -- --run` passed 22 tests and `npm run build` passed.

### 2026-09-23 — Signed-out screen matched to original reference

Compared with the original reference capture, the signed-out route now hides the authenticated navigation, fills the viewport with the mint dotted background, and centers the white rounded login card. The card contains the original banner, Thai description, dashed Google prompt, and compact Google sign-in control; the action still calls the Neon Auth Google flow. `npm test -- --run` passed 22 tests, `npm run build` passed, and `git diff --check` passed.

### 2026-09-23 — Google sign-in mark refined

The sign-in control now uses the full multicolor Google G mark shown in the original reference instead of a single-color Bootstrap icon. The account row shown after choosing Google is the Google OAuth account chooser, rendered by Google during the Neon Auth redirect; the app does not fabricate a recent account before authentication.

### 2026-09-23 — Course review modal aligned with original flow

The selected-course view now uses the original centered modal composition: purple course header with close control, review-and-schedule heading, write-review toggle, composer card, offering cards, filters, and review cards. Schedule fields in the composer are displayed as disabled approved data because factual schedule changes remain administrator-managed; rating and experience text continue to publish through the Neon review service. `npm test -- --run` passed 22 tests, `npm run build` passed, and `git diff --check` passed.

### 2026-09-23 — Review controls simplified for visual match

Removed the manual “ใช้ตัวกรอง” button; rating, semester, and academic-year filters now reload reviews when changed. The “ไม่พบกลุ่มเรียนที่ต้องการ?” proposal panel is hidden temporarily while the review flow is matched to the original interface; its service and backend remain available for a later pass. `npm test -- --run` passed 22 tests and `npm run build` passed.

### 2026-09-23 — Review filter and composer fields matched

The review filters now use the original term choices (`ทุกเทอม`, `เทอม 1`, `เทอม 2`, `ฤดูร้อน`) and academic-year choices (`ทุกปี`, 2569 through 2565), refreshing immediately on selection. The composer now provides editable teacher and section fields plus selectable weekday and start/end time controls. These factual fields remain UI-only until an approved offering-management path persists them; review rating and text continue using the existing review API. `npm test -- --run` passed 22 tests and `npm run build` passed.

### 2026-09-23 — Review term and academic year selectors completed

The create-review form now includes editable `เทอมที่เรียน` and `ปีการศึกษา` selectors with the same choices as the review filters. They initialize from the selected offering and remain available for correction before submission. `npm test -- --run` passed 22 tests, `npm run build` passed, and `git diff --check` passed.

### 2026-09-23 — Public test shell rechecked

The test deployment URL `https://varasarn-friends-test-tau.vercel.app/` now returns HTTP 200 and the Vite application shell, so the earlier Vercel SSO blocker is no longer present for the shell. Full Ticket 01 closure still requires the authenticated two-account, cross-user, Safari, and sign-out token checks.

### 2026-09-23 — Release gate and deployment headers verified

`npm run release:gate` passed with 22 tests and a production build. The public test deployment also returned HTTP/2 200 with the Vercel shell and strict transport security headers. The gate still correctly requests fresh export, restore, two-account permission, deployed Google sign-in, and idle-resume evidence before final cutover; those checks require the owner-controlled browser accounts.

### 2026-09-23 — Data API credential rejection rechecked

The deployed Neon Data API rejected an unauthenticated catalog RPC with HTTP 400 and `missing authentication credentials`, and rejected a malformed bearer token with HTTP 400 and `Provided authentication token is not a valid JWT encoding`. No credential or secret was exposed during the check. Authenticated cross-user behavior still requires the two-account browser acceptance.

### 2026-09-23 — Session bootstrap failure state hardened

The Vue session bootstrap now catches Neon Auth session and initial protected-data failures, clears the signed-in state, stops loading, and shows an error message instead of leaving a blank or indefinitely loading screen. `npm test -- --run` passed 22 tests, `npm run build` passed, and `git diff --check` passed.

### 2026-09-23 — Review submission silent guard fixed

The review composer no longer silently returns when the selected course has no offering or the Neon review client is unavailable. It now shows a Thai error message, disables submission while the request is running, and changes the button label to `กำลังบันทึก...`; valid submissions still call `create_review` and refresh the anonymous review list. `npm test -- --run` passed 22 tests and `npm run build` passed.

### 2026-09-23 — Review button made actionable

The composer no longer disables the save button merely because the offering list is empty. It remains clickable until a request starts, allowing the explicit missing-offering error to be shown and making the failure diagnosable from the deployed UI. `npm test -- --run` passed 22 tests and `npm run build` passed.

### 2026-09-23 — Review approval requirement changed by owner

The owner confirmed that students should be able to submit a review with their own class details without waiting for an administrator to approve or create an offering. The ticket criteria above supersede earlier comments about requiring an approved offering. Official offerings remain the source for shared timetable selections; review context is self-reported. The current `create_review` RPC and Vue guard still enforce the old rule and must be changed before this ticket can close.

### 2026-09-23 — Student-reported review submission implemented

Migration `0024_student_reported_reviews.sql` makes review context course-scoped and self-reported, preserves existing review history through a backfill, and makes `offering_id` optional. The new `api.create_review` validates the approved course plus term, year, section, teacher, day, and time without querying an official offering. It enforces one normalized class-context review per authenticated user. Production migration application and the Neon Data API schema-cache refresh completed; an isolated Neon branch verified the new anonymous projection and duplicate constraint. The Vue composer sends the new context and labels displayed details as student-reported. `npm test` passed (23 tests), `npm run build` passed, and `git diff --check` passed. Live two-account browser acceptance remains required.

### 2026-09-23 — Commit ef6f116 confirmed deployed; two-account acceptance blocked on test credentials

Confirmed the public test deployment serves commit `ef6f116` exactly: `https://varasarn-friends-test-tau.vercel.app/` is the alias for Vercel deployment `dpl_4q7uGxD7WvGKAaA7C1nb6LEJF3Cm`, created at the same timestamp as the commit, and its served `index.html` references `assets/index-DDs2Tsnq.js` and `assets/index-yJJw95GY.css`, matching the content hashes from a local `npm run build` of this exact commit byte-for-byte. `npm test -- --run` re-passed 23 tests and `npm run build` re-passed on HEAD `ef6f116`.

Re-verified, with no test-account credentials involved, that the Neon Data API still rejects a request with no bearer token (`HTTP 400`, "missing authentication credentials") and a malformed bearer token (`HTTP 400`, "not a valid JWT encoding") on the production Data API endpoint. Opened the deployed test app signed out: the branded sign-in card renders, no Data API request fires before authentication (checked via network log), and clicking "เข้าสู่ระบบด้วย Google" correctly redirects to a real `accounts.google.com` "Sign in to continue to neon.tech" screen, confirming Google is the wired sign-in provider end to end up to the credential-entry step. Read `api.list_visible_reviews` and `api.list_my_reviews` in `db/drizzle/0024_student_reported_reviews.sql`: the anonymous projection returns only rating, text, date, and student-reported class context (no author ID, email, or revision data), `list_my_reviews` is scoped to `auth.user_id()`, and both functions are revoked from `PUBLIC` and granted only to `authenticated`.

**Blocker:** completing the two-Google-account acceptance (Account A submits/duplicates a review, Account B reads anonymously and is denied edit/withdraw/cross-user data access, sign-out clears local session/private UI, copied-token lifetime) requires signing in with real Google test-account credentials. No such credentials exist anywhere in this repo, environment, or session, and this agent does not enter account passwords into any sign-in form under any circumstance. This step needs the project owner (or someone they hand credentials to directly) to run the two-account browser walkthrough themselves and record the results here. Status remains `needs-info` pending that evidence.
