#!/bin/zsh
set -euo pipefail
cd "${0:A:h}"
if [[ "$#" -ne 2 || "$1" != "--id" || ! "$2" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Usage: ./publish-practice.command --id <practiceId>"
  exit 1
fi
exec node scripts/content-release.mjs --kind practice --id "$2" --authorize-publish
