#!/bin/bash
# Chrome Web Store 提出用 ZIP を生成
set -e

NAME="amazon2mfcloud"
VERSION=$(grep '"version"' manifest.json | sed 's/.*: *"\(.*\)".*/\1/')
OUT="${NAME}-v${VERSION}.zip"

rm -f "$OUT"

zip -r "$OUT" \
  manifest.json \
  popup/ \
  content/ \
  lib/ \
  icons/ \
  -x "*.DS_Store"

echo "Created: $OUT"
