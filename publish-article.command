#!/bin/zsh
set -euo pipefail
cd "${0:A:h}"
if [[ "$#" -ne 2 || "$1" != "--slug" || ! "$2" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Usage: ./publish-article.command --slug <slug>"
  exit 1
fi
if [[ -n "$(git status --porcelain)" ]]; then
  echo "文章发布已停止：工作区仍有未提交修改。"
  exit 1
fi
SLUG="$2"
if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "文章发布已停止：当前分支不是 main。"
  exit 1
fi
if [[ "$(git remote get-url origin 2>/dev/null || true)" != "https://github.com/Chizheng4/xingbuild.git" ]]; then
  echo "文章发布已停止：origin 不是预期的 xingbuild GitHub 仓库。"
  exit 1
fi
npm run article:check
npm run article:scope-check -- --slug "$SLUG" --commit HEAD
npm run build
npm run test:sites
COMMIT="$(git rev-parse HEAD)"
PARENT="$(git rev-parse HEAD^)"
ORIGIN="$(git rev-parse origin/main)"
if [[ "$ORIGIN" == "$PARENT" ]]; then
  git push origin main
elif [[ "$ORIGIN" != "$COMMIT" ]]; then
  echo "文章发布已停止：origin/main 既不是 HEAD^ 也不是 HEAD。"
  exit 1
fi
./node_modules/.bin/edgeone makers deploy dist/client --name "${XINGBUILD_EDGEONE_PROJECT:-xingbuild-nochina}" --env production
node scripts/verify-article-release.mjs "${XINGBUILD_PUBLIC_URL:-https://xingbuild.top/}" "v$(node -p "require('./package.json').version")" "$COMMIT" "$SLUG"
