# Deployment and recovery

Run `npm test` and `npm run build` before deployment. Vercel needs only `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL`; never expose database or OAuth secrets. Register each Vercel origin with Neon Auth and Data API CORS.

Create a recovery point before every migration or cutover:

```bash
npm run recovery:snapshot
neon snapshots list --branch production
```

If the project has reached its snapshot limit, create a separate branch from the current production state before migrating. Record the branch ID and parent LSN in the ticket, and retain that branch until the migration is verified. Keep this recovery branch inside the same owner-controlled Neon project; it contains production data.

Restore into an isolated Neon branch first, then verify catalog/review counts, Data API exposure, and authenticated access. If cutover fails, stop new writes and return to the old export read-only before restoring.

Re-check current Vercel eligibility and Neon quotas before launch. The Vercel Hobby plan is intended for personal, noncommercial work; choose an eligible plan before using this project for an organization or commercial service. If Vercel is unsuitable, deploy the Vite `dist/` output to another static host and register its origin in Neon.

Neon computes normally transition to idle after five minutes without activity and wake on the next request. Test the first request after an idle period in the production-like release check. Keep the production recovery snapshot access limited to project owners; it contains the complete database state.
