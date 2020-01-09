#!/usr/bin/env bash
# 保证build.sh脚本有任何错误就退出
set -e
export PATH=$NODEJS_BIN_LATEST:$YARN_BIN_LATEST:$PATH

echo "node: $(node -v)"
echo "npm: v$(npm -v)"

yarn

echo '------------build doc------------'
yarn build:doc

echo '---------------------------------'
echo 'docs pack success'