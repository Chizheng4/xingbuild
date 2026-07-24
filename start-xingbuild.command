#!/bin/zsh
set -e

cd "${0:A:h}"

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

echo ""
echo "xingbuild 正在启动：http://localhost:4317/"
echo "保持此窗口开启；按 Control-C 停止。"
echo ""

npm run dev -- --host 127.0.0.1 --port 4317
