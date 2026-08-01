#!/bin/zsh
set -euo pipefail

cd "${0:A:h}"

if [[ "$#" -ne 2 || "$1" != "--id" || ! "$2" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Usage: ./publish-practice.command --id <practiceId>"
  exit 1
fi

PRACTICE_ID="$2"
BRANCH="$(git branch --show-current)"
VERSION="v$(node -p "require('./package.json').version")"
COMMIT="$(git rev-parse HEAD)"
PARENT_COMMIT="$(git rev-parse HEAD^)"
PUBLIC_URL="${XINGBUILD_PUBLIC_URL:-https://xingbuild.top/}"
EDGEONE_PROJECT="${XINGBUILD_EDGEONE_PROJECT:-xingbuild-nochina}"
EDGEONE_CLI="./node_modules/.bin/edgeone"
DEFAULT_GITHUB_PROXY="http://127.0.0.1:7897"
GITHUB_PROXY=""

if [[ "$BRANCH" != "main" ]]; then echo "Practice 发布已停止：当前分支必须是 main。"; exit 1; fi
if [[ -n "$(git status --porcelain)" ]]; then echo "Practice 发布已停止：工作区仍有未提交修改。"; exit 1; fi
if [[ "$(git remote get-url origin 2>/dev/null || true)" != "https://github.com/Chizheng4/xingbuild.git" ]]; then echo "Practice 发布已停止：origin 不是预期的 xingbuild GitHub 仓库。"; exit 1; fi
if [[ ! -x "$EDGEONE_CLI" ]] || ! "$EDGEONE_CLI" whoami >/dev/null 2>&1; then echo "Practice 发布已停止：EdgeOne CLI 未就绪。"; exit 1; fi

configure_github_network() {
  local candidate="${XINGBUILD_GITHUB_PROXY:-${HTTPS_PROXY:-${https_proxy:-$DEFAULT_GITHUB_PROXY}}}"
  if curl -fsSI --http1.1 --proxy "$candidate" --connect-timeout 3 --max-time 8 https://github.com >/dev/null 2>&1; then
    GITHUB_PROXY="$candidate"
    export HTTP_PROXY="$GITHUB_PROXY" HTTPS_PROXY="$GITHUB_PROXY" ALL_PROXY="$GITHUB_PROXY" http_proxy="$GITHUB_PROXY" https_proxy="$GITHUB_PROXY" all_proxy="$GITHUB_PROXY" NODE_USE_ENV_PROXY=1
  else
    unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy
    curl -fsSI --http1.1 --noproxy '*' --connect-timeout 10 --max-time 15 https://github.com >/dev/null
  fi
}

git_network() {
  if [[ -n "$GITHUB_PROXY" ]]; then git -c http.version=HTTP/1.1 -c http.proxy="$GITHUB_PROXY" "$@"; else git -c http.version=HTTP/1.1 "$@"; fi
}

configure_github_network
git_network fetch origin main

echo "==> 执行目标 Practice 检查"
npm run practice:check
npm run practice:scope-check -- --id "$PRACTICE_ID" --commit HEAD
npm run build
npm run test:sites

ORIGIN_COMMIT="$(git rev-parse origin/main)"
if [[ "$ORIGIN_COMMIT" == "$PARENT_COMMIT" ]]; then
  echo "==> 同步 GitHub main"
  git_network push origin main
elif [[ "$ORIGIN_COMMIT" != "$COMMIT" ]]; then
  echo "Practice 发布已停止：origin/main 既不是 HEAD^ 也不是当前 HEAD。"
  exit 1
fi
if [[ "$(git rev-parse origin/main)" != "$COMMIT" ]]; then echo "Practice 发布失败：GitHub main 与当前提交不一致。"; exit 1; fi

echo "==> 部署 EdgeOne 生产环境"
"$EDGEONE_CLI" makers deploy dist/client --name "$EDGEONE_PROJECT" --env production
echo "==> 验证公网 Practice"
node scripts/verify-practice-release.mjs "$PUBLIC_URL" "$VERSION" "$COMMIT" --id "$PRACTICE_ID"
echo "==> Practice 已正式上线：$PRACTICE_ID"
