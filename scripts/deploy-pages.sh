#!/usr/bin/env bash
# 构建前端并发布到 GitHub Pages 的 gh-pages 分支
# gh-pages 是专用的构建产物分支，每次发布都会重建其历史，因此使用 -f 覆盖推送
set -euo pipefail

REPO="git@github.com:Anoxico/Ryan-Project.git"
GIT_NAME="Anoxico"
GIT_EMAIL="Anoxico1011@email.com"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> 构建"
npm run build

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp -R dist/. "$TMP/"
touch "$TMP/.nojekyll"

echo "==> 发布 gh-pages"
cd "$TMP"
git init -b gh-pages -q
git add -A
git -c user.name="$GIT_NAME" -c user.email="$GIT_EMAIL" commit -q -m "deploy: $(date '+%Y-%m-%d %H:%M')"
git remote add origin "$REPO"
git push -f origin gh-pages

echo "==> 完成: https://anoxico.github.io/Ryan-Project/"
