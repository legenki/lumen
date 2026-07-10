#!/usr/bin/env bash
# Vendors the deployed filtr-tool (GitHub Pages) into reference/filtr/live/
# verbatim — no path rewriting; serve live/ so URLs keep the /filtr-tool/ prefix.
set -euo pipefail
cd "$(dirname "$0")"
BASE="https://antlii.github.io"
DEST="../live"
while IFS= read -r path; do
  [ -z "$path" ] && continue
  mkdir -p "$DEST/$(dirname "$path")"
  echo "GET $path"
  curl -sSf "$BASE/$path" -o "$DEST/$path"
done < assets-manifest.txt
echo "Done: $(find "$DEST" -type f | wc -l | tr -d ' ') files"
