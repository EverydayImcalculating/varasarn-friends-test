#!/usr/bin/env bash
set -euo pipefail
npm test
npm run build
neon config status
echo "Release gate requires recorded fresh-export counts, restore evidence, two-account permission checks, and deployed Google sign-in acceptance before production cutover."
exit 1
