# Deployment and recovery

Run `npm test` and `npm run build` before deployment. Vercel needs only `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL`; never expose database or OAuth secrets. Register each Vercel origin with Neon Auth and Data API CORS.

Create a recovery point before every migration or cutover:

```bash
npm run recovery:snapshot
neon snapshots list --branch production
```

Restore into an isolated Neon branch first, then verify catalog/review counts, Data API exposure, and authenticated access. If cutover fails, stop new writes and return to the old export read-only before restoring.

Re-check current Vercel eligibility and Neon quotas before launch. If Vercel is unsuitable, deploy the Vite `dist/` output to another static host and register its origin in Neon.
