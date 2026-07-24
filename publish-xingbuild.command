#!/bin/zsh
set -e

cd "${0:A:h}"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "发布已停止：工作区仍有未提交修改。"
  echo "请先完成版本检查、提交和标签，再重新发布。"
  read "?按回车键关闭..."
  exit 1
fi

npm run release:check

if ! command -v edgeone >/dev/null 2>&1; then
  echo ""
  echo "发布已停止：尚未安装 EdgeOne CLI。"
  echo "首次配置请执行：npm install -g edgeone"
  echo "安装后执行：edgeone login"
  read "?按回车键关闭..."
  exit 1
fi

if ! edgeone whoami >/dev/null 2>&1; then
  echo ""
  echo "发布已停止：EdgeOne CLI 尚未登录。"
  echo "请先执行：edgeone login"
  read "?按回车键关闭..."
  exit 1
fi

echo ""
echo "即将把当前稳定版本发布到 EdgeOne Makers 生产项目：xingbuild"
echo "目标正式域名：xingbuild.top"
read "answer?输入 publish 继续："

if [[ "$answer" != "publish" ]]; then
  echo "已取消，没有发布任何内容。"
  exit 0
fi

edgeone makers deploy dist/client --name xingbuild --env production

echo ""
echo "EdgeOne 已接收部署。请继续验证部署状态、xingbuild.top、HTTPS、桌面端和手机端。"
