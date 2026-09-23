# 01: Authenticated catalog and anonymous review tracer

**What to build:** A Google-authenticated user can open the rebuilt app, inspect one approved course and offering, submit a rating and written review, and see that review without a public author identity. This first slice proves Vercel hosting, Neon Managed Better Auth, PostgreSQL data access, and ownership end to end; a failed browser-authentication proof triggers an explicit backend/hosting decision before expansion.

Blocked by: None (can start immediately)

Status: needs-info

- [ ] A Vue 3, TypeScript, and Vite app using Bootstrap 5 CSS and selectively imported BootstrapVueNext components can be built for Vercel; its header, colors, typography, banner/about content, and course cards remain recognizably based on the current page.
- [ ] Interactive controls are Vue-managed; the old Bootstrap JavaScript bundle and imperative DOM handlers are not copied into the rebuilt app.
- [ ] Live application reads and writes use Neon PostgreSQL with enforced database permissions, not Google Sheets or Apps Script; no database or auth-management secret is embedded in the frontend.
- [ ] Google is the only enabled sign-in method in Neon, not just the only visible button; alternate password, OTP, and other enabled-provider entry points are denied.
- [ ] Google sign-in, session refresh, and sign-out work in a deployed Vue preview, including Safari or restrictive-cookie conditions; the sign-in/callback/static shell may be public, but protected data and actions reject signed-out access.
- [ ] Sign-out clears local session and private displayed data. The observed lifetime of a copied bearer token after sign-out is recorded; immediate revocation is not a v1 requirement.
- [ ] A signed-in user can read a seeded approved course and offering and publish one review with an integer overall rating from 1 to 5 and nonempty text.
- [ ] The review is tied to the validated Neon Auth user ID and approved offering, not a typed email, raw Google subject, or spreadsheet row; a second record by that user for the offering is rejected across all review states.
- [ ] Another signed-in user can read the review without author ID, email, token, or private revision data and cannot edit or withdraw it by calling the data interface directly; grants and exposed schemas prevent bypassing the anonymous projection.
- [ ] Automated data-interface tests cover missing/invalid credentials, authenticated catalog read, review validation, concurrent duplicate prevention, direct author-data access, and denied cross-user mutation; browser acceptance uses two Google test accounts for sign-in and review submission.
- [ ] The sign-in, catalog, course/review detail, and review composer have usable desktop and narrow-mobile layouts, visible labels/focus, and loading, empty, validation, and error states; the composer does not ask students to edit factual schedule fields.
- [ ] Live acceptance uses an owner-controlled Neon project, Google OAuth configuration, and a deployed preview with secrets kept out of the repo; if Vue/cookie compatibility fails, document the result and revise the architecture before treating the ticket as complete.

## Comments

### 2026-09-23 — Local implementation complete; live acceptance pending

Implemented the local Vue 3, TypeScript, Vite, Bootstrap, and BootstrapVueNext application scaffold. Added Neon Managed Better Auth and Data API browser clients that use only public endpoint variables, plus a Drizzle schema and migration history for private course, offering, and review tables.

The Drizzle migration sequence creates the seeded approved `JC100` offering, restricts private-table grants, enables RLS, and exposes only task-oriented catalog and anonymous-review RPCs. Vercel SPA routing and a release setup guide are included. `npm test` passes with four tests, `npm run build` succeeds, and `npm run db:generate` reports no pending schema changes.

The ticket now needs owner-controlled external configuration and evidence: apply the migration to Neon, configure Google as the sole provider, set trusted Vercel origins and public endpoint variables, deploy a preview, and run the two-account browser and data-interface acceptance checks. Record Safari/restrictive-cookie behavior and the observed copied-token lifetime after sign-out here.

### 2026-09-23 — Neon production branch provisioned

Linked and deployed Neon project `soft-surf-84712820` on its production branch. Managed Better Auth, the `api` Function, and Data API are active. The Data API exposes only the `api` schema, its schema cache was refreshed after applying both Drizzle migrations, and an unauthenticated RPC request was rejected for missing bearer credentials.

Neon currently lists only the shared Google OAuth provider. Its shared credentials are development-only, and no trusted deployment domain exists yet. Before this ticket can close, configure the owner-managed Google OAuth client and callback, add the deployed Vercel preview and production origins, set the two public Vite endpoint variables in Vercel, then run and record the two-account browser and token-lifetime acceptance checks.
