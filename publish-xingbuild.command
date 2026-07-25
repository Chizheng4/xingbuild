#!/bin/zsh
set -euo pipefail

cd "${0:A:h}"

BRANCH="$(git branch --show-current)"
VERSION="v$(node -p "require('./package.json').version")"
HEAD_TAG="$(git describe --tags --exact-match HEAD 2>/dev/null || true)"
COMMIT="$(git rev-parse HEAD)"
DEFAULT_GITHUB_PROXY="http://127.0.0.1:7897"
GITHUB_PROXY=""
PUBLIC_URL="${XINGBUILD_PUBLIC_URL:-https://xingbuild.top/}"
EDGEONE_PROJECT="${XINGBUILD_EDGEONE_PROJECT:-xingbuild-nochina}"
EDGEONE_CLI="./node_modules/.bin/edgeone"

if [[ "$BRANCH" != "main" ]]; then
  echo "发布已停止：当前分支是 $BRANCH，请切换到 main。"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "发布已停止：工作区仍有未提交修改。"
  echo "请先完成版本检查、提交和标签，再重新发布。"
  exit 1
fi

if [[ "$HEAD_TAG" != "$VERSION" ]]; then
  echo "发布已停止：当前提交标签为 ${HEAD_TAG:-无}，项目版本为 $VERSION。"
  exit 1
fi

if [[ "$(git remote get-url origin 2>/dev/null || true)" != "https://github.com/Chizheng4/xingbuild.git" ]]; then
  echo "发布已停止：origin 不是预期的 xingbuild GitHub 仓库。"
  exit 1
fi

if [[ ! -x "$EDGEONE_CLI" ]]; then
  echo "发布已停止：项目内尚未安装 EdgeOne CLI。"
  echo "请先执行：npm ci"
  exit 1
fi

if ! "$EDGEONE_CLI" whoami >/dev/null 2>&1; then
  echo "发布已停止：EdgeOne CLI 尚未登录。"
  echo "请先执行：npx edgeone login"
  exit 1
fi

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
    echo "发布已停止：当前无法连接 GitHub，请检查网络或代理后重试。"
    return 1
  fi
  echo "==> 本地代理不可用，已使用直连"
}

push_with_retry() {
  local ref="$1"
  local attempt=1

  while [[ "$attempt" -le 3 ]]; do
    echo "==> 推送 $ref（第 $attempt/3 次）"
    if [[ -n "$GITHUB_PROXY" ]]; then
      git -c http.version=HTTP/1.1 -c http.proxy="$GITHUB_PROXY" push origin "$ref" && return 0
    elif git -c http.version=HTTP/1.1 push origin "$ref"; then
      return 0
    fi
    attempt=$((attempt + 1))
  done

  echo "发布失败：$ref 无法推送到 GitHub。"
  return 1
}

echo ""
echo "开始发布 $VERSION："
echo "1. 推送版本标签和 main 到 GitHub"
echo "2. 部署到 EdgeOne Makers 生产项目：$EDGEONE_PROJECT"
echo "3. 验证 $PUBLIC_URL"

configure_github_network

echo "==> 执行发布前检查"
npm run release:check

echo "==> 同步 GitHub"
push_with_retry "$HEAD_TAG"
push_with_retry main

if [[ "$(git rev-parse origin/main)" != "$COMMIT" ]]; then
  echo "发布失败：GitHub main 与当前提交不一致。"
  exit 1
fi

echo "==> 部署 EdgeOne 生产环境"
"$EDGEONE_CLI" makers deploy dist/client --name "$EDGEONE_PROJECT" --env production

echo "==> 验证公网版本"
node scripts/verify-public-release.mjs "$PUBLIC_URL" "$VERSION" "$COMMIT"

echo ""
echo "==> $VERSION 已正式上线"
echo "网站：$PUBLIC_URL"
echo "代码：https://github.com/Chizheng4/xingbuild"
