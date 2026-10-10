#!/usr/bin/env bash
# Regenerates the app icons in icons/ from icons/icon.svg (macOS: Chrome + sips).
# Run from the repo root: bash scripts/make-icons.sh
set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

cat > "$TMP/icon.html" <<HTML
<!doctype html><html><body style="margin:0">
<img src="file://$PWD/icons/icon.svg" width="1024" height="1024" style="display:block">
</body></html>
HTML

"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1024,1024 \
  --screenshot="$TMP/icon-1024.png" "file://$TMP/icon.html" >/dev/null 2>&1

for size in 512 192 180; do
  sips -z "$size" "$size" "$TMP/icon-1024.png" --out "icons/icon-$size.png" >/dev/null
done
echo "Wrote icons/icon-512.png, icons/icon-192.png, icons/icon-180.png"
