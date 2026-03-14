#!/usr/bin/env bash

set -euo pipefail

repo_url="https://github.com/hojinzs/auto-press.git"

if [ ! -d .git ]; then
  git clone --depth 1 "$repo_url" .
fi

if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
