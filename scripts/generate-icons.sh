#!/usr/bin/env bash
#
# generate-icons.sh
# Generates all required app icons and splash screens from a single source SVG.
#
# Prerequisites: Inkscape or ImageMagick (convert)
#
# Usage:
#   ./scripts/generate-icons.sh assets/icon-source.svg
#
# This creates:
#   - apps/mobile/assets/icon.png         (1024×1024, App Store / Play Store)
#   - apps/mobile/assets/adaptive-icon.png (1024×1024, Android adaptive)
#   - apps/mobile/assets/splash.png       (1284×2778, splash screen)
#   - apps/web/public/icons/icon-*.png    (72–512px, PWA icons)

set -euo pipefail

SOURCE="${1:-assets/icon-source.svg}"

if ! command -v convert &>/dev/null; then
  echo "❌ ImageMagick (convert) is required. Install with: brew install imagemagick"
  exit 1
fi

if [ ! -f "$SOURCE" ]; then
  echo "❌ Source file not found: $SOURCE"
  echo "   Create a 1024×1024 SVG or PNG at $SOURCE first."
  echo ""
  echo "   For now, generating placeholder icons..."

  # Generate a simple green circle placeholder
  convert -size 1024x1024 xc:"#22c55e" \
    -fill white -gravity center -pointsize 400 -annotate +0+0 "S" \
    /tmp/snt-icon-source.png
  SOURCE="/tmp/snt-icon-source.png"
fi

echo "🎨 Generating icons from $SOURCE..."

# ── Mobile icons ─────────────────────────────────────────────────
MOBILE_DIR="apps/mobile/assets"
mkdir -p "$MOBILE_DIR"

convert "$SOURCE" -resize 1024x1024 "$MOBILE_DIR/icon.png"
echo "  ✓ $MOBILE_DIR/icon.png (1024×1024)"

convert "$SOURCE" -resize 1024x1024 "$MOBILE_DIR/adaptive-icon.png"
echo "  ✓ $MOBILE_DIR/adaptive-icon.png (1024×1024)"

# Splash: icon centered on green background
convert -size 1284x2778 xc:"#22c55e" \
  \( "$SOURCE" -resize 400x400 \) -gravity center -composite \
  "$MOBILE_DIR/splash.png"
echo "  ✓ $MOBILE_DIR/splash.png (1284×2778)"

# ── Web PWA icons ────────────────────────────────────────────────
WEB_DIR="apps/web/public/icons"
mkdir -p "$WEB_DIR"

for SIZE in 72 96 128 144 152 192 384 512; do
  convert "$SOURCE" -resize "${SIZE}x${SIZE}" "$WEB_DIR/icon-${SIZE}.png"
  echo "  ✓ $WEB_DIR/icon-${SIZE}.png (${SIZE}×${SIZE})"
done

# Favicon
convert "$SOURCE" -resize 32x32 "apps/web/public/favicon.ico"
echo "  ✓ apps/web/public/favicon.ico (32×32)"

echo ""
echo "✅ All icons generated! Replace $SOURCE with your real logo and re-run."
