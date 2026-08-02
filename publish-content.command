#!/bin/zsh
set -euo pipefail
cd "${0:A:h}"
if [[ "$#" -ne 2 || "$1" != "--slug" || ! "$2" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Usage: ./publish-content.command --slug <slug>"
  exit 1
fi
exec node scripts/unified-publish.mjs --kind content --slug "$2"
