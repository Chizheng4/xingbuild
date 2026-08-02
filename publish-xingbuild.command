#!/bin/zsh
set -euo pipefail
cd "${0:A:h}"
exec node scripts/unified-publish.mjs --kind product --authorize-publish
