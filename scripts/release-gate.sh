#!/usr/bin/env bash
set -euo pipefail
npm test
npm run build
neon config status
echo "Automated checks passed. Complete docs/cutover-record.md with fresh-export counts, restore evidence, two-account permission checks, deployed Google sign-in, and idle-resume acceptance before production cutover."
exit 1
