#!/bin/zsh
set -e

cd "${0:A:h}"

LOCAL_URL="http://127.0.0.1:4317/"
ONLINE_URL="https://xingbuild.top/"

if ! command -v node >/dev/null 2>&1; then
  echo "未找到 Node.js，无法启动 xingbuild。"
  read "?按回车键关闭..."
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "正在安装项目依赖..."
  npm ci
fi

npm run check

if node scripts/preview-runtime.mjs check "${LOCAL_URL}"; then
  echo ""
  echo "xingbuild 已在本地运行，直接打开现有服务。"
  echo "本地网站：${LOCAL_URL}"
  echo "线上网站：${ONLINE_URL}"
  open "${LOCAL_URL}"
  exit 0
fi

if lsof -nP -iTCP:4317 -sTCP:LISTEN >/dev/null 2>&1; then
  echo ""
  echo "端口 4317 已被其他进程占用，但没有返回正常的 xingbuild 页面。"
  echo "请先关闭占用该端口的旧终端或进程，再重新双击此启动指令。"
  read "?按回车键关闭..."
  exit 1
fi

echo ""
echo "xingbuild 正在启动。"
echo "本地网站：${LOCAL_URL}"
echo "线上网站：${ONLINE_URL}"
echo "保持此窗口开启；按 Control-C 停止。"
echo ""

# 预览 supervisor 记录 worktree/commit/PID，并在退出时释放 npm/Vite 和租约。
node scripts/preview-runtime.mjs
