#!/bin/zsh
set -euo pipefail

cd "${0:A:h}"

BRANCH="$(git branch --show-current)"
VERSION="v$(node -p "require('./package.json').version")"
COMMIT="$(git rev-parse HEAD)"
DEFAULT_GITHUB_PROXY="http://127.0.0.1:7897"
GITHUB_PROXY=""
PUBLIC_URL="${XINGBUILD_PUBLIC_URL:-https://xingbuild.top/}"
EDGEONE_PROJECT="${XINGBUILD_EDGEONE_PROJECT:-xingbuild-nochina}"
EDGEONE_CLI="./node_modules/.bin/edgeone"

if [[ "$BRANCH" != "main" ]]; then
  echo "内容发布已停止：当前分支是 $BRANCH，请切换到 main。"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "内容发布已停止：工作区仍有未提交修改。"
  exit 1
fi

if find .content-workspace -type f -name '*.json' -print -quit 2>/dev/null | grep -q .; then
  echo "内容发布已停止：本地仍有 candidate、import 或 draft。"
  echo "请完成审核、提升或清理后再发布。"
  exit 1
fi

if [[ "$(git remote get-url origin 2>/dev/null || true)" != "https://github.com/Chizheng4/xingbuild.git" ]]; then
  echo "内容发布已停止：origin 不是预期的 xingbuild GitHub 仓库。"
  exit 1
fi

if [[ ! -x "$EDGEONE_CLI" ]]; then
  echo "内容发布已停止：项目内尚未安装 EdgeOne CLI。"
  exit 1
fi

if ! "$EDGEONE_CLI" whoami >/dev/null 2>&1; then
  echo "内容发布已停止：EdgeOne CLI 尚未登录。"
  exit 1
fi

CONTENT_FILE="$(git diff-tree --no-commit-id --name-only -r HEAD^ HEAD | grep -E '^content/(products|business-observations|observations|articles|profile)/[a-z0-9-]+\.json$|^content/media/[a-z0-9-]+/manifest\.json$')"
node scripts/content-scope-check.mjs --commit HEAD
case "$CONTENT_FILE" in
  content/observations/*) CONTENT_SLUG="$(node -p "require('./${CONTENT_FILE}').slug")"; TARGET_PATH="/observations/${CONTENT_SLUG}"; VERIFY_KIND="observation" ;;
  content/products/*) TARGET_PATH="/products"; VERIFY_KIND="page" ;;
  content/business-observations/*) TARGET_PATH="/business-observations"; VERIFY_KIND="page" ;;
  content/profile/*) TARGET_PATH="/about"; VERIFY_KIND="page" ;;
  content/articles/*) CONTENT_SLUG="$(node -p "require('./${CONTENT_FILE}').slug")"; TARGET_PATH="/observations/${CONTENT_SLUG}"; VERIFY_KIND="observation" ;;
  content/media/*/manifest.json) TARGET_PATH="/products"; VERIFY_KIND="page" ;;
  *) echo "内容发布已停止：未找到唯一内容对象。"; exit 1 ;;
esac

configure_github_network() {
  local proxy_candidate="${XINGBUILD_GITHUB_PROXY:-${HTTPS_PROXY:-${https_proxy:-$DEFAULT_GITHUB_PROXY}}}"

  echo "==> 检查 GitHub 网络连接"
  if curl -fsSI --http1.1 --proxy "$proxy_candidate" --connect-timeout 3 --max-time 8 https://github.com >/dev/null 2>&1; then
    GITHUB_PROXY="$proxy_candidate"
    export HTTP_PROXY="$GITHUB_PROXY"
    export HTTPS_PROXY="$GITHUB_PROXY"
    export ALL_PROXY="$GITHUB_PROXY"
    export http_proxy="$GITHUB_PROXY"
    export https_proxy="$GITHUB_PROXY"
    export all_proxy="$GITHUB_PROXY"
    export NODE_USE_ENV_PROXY=1
    echo "==> 已使用本地代理：$GITHUB_PROXY"
    return 0
  fi

  unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy
  if ! curl -fsSI --http1.1 --noproxy '*' --connect-timeout 10 --max-time 15 https://github.com >/dev/null; then
    echo "内容发布已停止：当前无法连接 GitHub，请检查网络或代理后重试。"
    return 1
  fi
  echo "==> 本地代理不可用，已使用直连"
}

push_main_with_retry() {
  local attempt=1
  while [[ "$attempt" -le 3 ]]; do
    echo "==> 推送 main（第 $attempt/3 次）"
    if [[ -n "$GITHUB_PROXY" ]]; then
      git -c http.version=HTTP/1.1 -c http.proxy="$GITHUB_PROXY" push origin main && return 0
    elif git -c http.version=HTTP/1.1 push origin main; then
      return 0
    fi
    attempt=$((attempt + 1))
  done
  echo "内容发布失败：main 无法推送到 GitHub。"
  return 1
}

echo ""
echo "开始内容发布：${CONTENT_SLUG}"
echo "稳定产品版本保持：${VERSION}"
echo "目标页面：${PUBLIC_URL%/}${TARGET_PATH}"

configure_github_network

echo "==> 执行内容与构建检查"
npm run content:check
npm run practice:check
npm run build
npm run test:sites

echo "==> 同步 GitHub main"
push_main_with_retry
if [[ "$(git rev-parse origin/main)" != "$COMMIT" ]]; then
  echo "内容发布失败：GitHub main 与当前提交不一致。"
  exit 1
fi

echo "==> 部署 EdgeOne 生产环境"
"$EDGEONE_CLI" makers deploy dist/client --name "$EDGEONE_PROJECT" --env production

echo "==> 验证公网内容"
if [[ "$VERIFY_KIND" == "observation" ]]; then
  node scripts/verify-content-release.mjs "$PUBLIC_URL" "$VERSION" "$COMMIT" "$TARGET_PATH"
else
  node scripts/verify-public-release.mjs "${PUBLIC_URL%/}${TARGET_PATH}" "$VERSION" "$COMMIT"
fi

echo ""
echo "==> 内容已正式上线"
echo "文章：${PUBLIC_URL%/}${TARGET_PATH}"
echo "版本：${VERSION}"
echo "提交：${COMMIT}"
