#!/usr/bin/env bash
# Regenerates iOS and Android launcher icons and splash screens from the
# vector sources in assets/. Rerun after any change to the brand mark.
#
# Uses only macOS built-ins (qlmanage renders the SVG, sips resizes), so there
# is no image-processing dependency in package.json to keep patched.
set -euo pipefail

cd "$(dirname "$0")/.."
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

render() { # render <svg> <size> <out.png>
  cp "$1" "$TMP/src.svg"
  qlmanage -t -s "$2" -o "$TMP" "$TMP/src.svg" >/dev/null 2>&1
  sips -z "$2" "$2" "$TMP/src.svg.png" --out "$3" >/dev/null
}

# ---- iOS ---------------------------------------------------------------
# The App Store rejects icons with an alpha channel; the JPEG round trip
# drops it without touching the visible pixels.
render assets/icon.svg 1024 "$TMP/ios-icon.png"
sips -s format jpeg "$TMP/ios-icon.png" --out "$TMP/ios-icon.jpg" >/dev/null
sips -s format png "$TMP/ios-icon.jpg" \
  --out ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png >/dev/null

render assets/splash.svg 2732 "$TMP/splash.png"
for n in splash-2732x2732.png splash-2732x2732-1.png splash-2732x2732-2.png; do
  cp "$TMP/splash.png" "ios/App/App/Assets.xcassets/Splash.imageset/$n"
done

# ---- Android -----------------------------------------------------------
# Legacy square/round launcher icons, then the adaptive foreground layer,
# which is drawn larger because the launcher crops it to its own shape.
for spec in "mdpi 48 108" "hdpi 72 162" "xhdpi 96 216" "xxhdpi 144 324" "xxxhdpi 192 432"; do
  set -- $spec
  dir="android/app/src/main/res/mipmap-$1"
  render assets/icon.svg "$2" "$dir/ic_launcher.png"
  cp "$dir/ic_launcher.png" "$dir/ic_launcher_round.png"
  render assets/icon-foreground.svg "$3" "$dir/ic_launcher_foreground.png"
done

# Splash across every density bucket Capacitor ships.
for dir in android/app/src/main/res/drawable*/; do
  [ -f "$dir/splash.png" ] || continue
  render assets/splash.svg 1920 "$dir/splash.png"
done

echo "Native icons and splash screens regenerated."
