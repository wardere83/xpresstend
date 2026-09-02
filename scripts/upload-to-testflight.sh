#!/usr/bin/env bash
#
# Send a build to TestFlight from a Mac.
#
# This is the App Store Connect API route from Apple's "Upload builds" page,
# with the same validate-then-upload sequence CI uses. It exists because the
# upload cannot be done from the Linux container this project is largely
# developed in: altool and Transporter are macOS-only, and Apple's hosts are
# not reachable from there.
#
# Usage:
#   scripts/upload-to-testflight.sh path/to/XpressTend.ipa
#   scripts/upload-to-testflight.sh path/to/XpressTend.xcarchive
#
# Required, from App Store Connect -> Users and Access -> Integrations -> Keys:
#   APPSTORE_KEY_ID           the key's ID, e.g. ABCD123456
#   APPSTORE_ISSUER_ID        the issuer ID shown above the key list
#   APPSTORE_PRIVATE_KEY_PATH path to the AuthKey_<KEY_ID>.p8 you downloaded
#                             (optional if it is already installed in
#                             ~/.appstoreconnect/private_keys/)

set -euo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
INPUT=${1:-}

die() { echo "error: $*" >&2; exit 1; }

[ -n "$INPUT" ] || die "give the path to a .ipa or .xcarchive. See the header of this script."
[ -e "$INPUT" ] || die "$INPUT does not exist."
[ "$(uname -s)" = "Darwin" ] || die "this has to run on a Mac: altool ships with Xcode and exists nowhere else."
command -v xcrun >/dev/null || die "xcrun not found. Install Xcode, then: xcode-select --install"

: "${APPSTORE_KEY_ID:?set APPSTORE_KEY_ID (App Store Connect -> Users and Access -> Integrations -> Keys)}"
: "${APPSTORE_ISSUER_ID:?set APPSTORE_ISSUER_ID (shown above the key list on the same page)}"

# altool reads the key from a fixed location named for the key id. Install it
# only if it is not already there, and remove only what this script installed.
KEY_DIR="$HOME/.appstoreconnect/private_keys"
KEY_FILE="$KEY_DIR/AuthKey_${APPSTORE_KEY_ID}.p8"
INSTALLED_KEY=false

cleanup() { $INSTALLED_KEY && rm -f "$KEY_FILE"; }
trap cleanup EXIT

if [ ! -f "$KEY_FILE" ]; then
  SRC=${APPSTORE_PRIVATE_KEY_PATH:-}
  [ -n "$SRC" ] || die "no key at $KEY_FILE. Set APPSTORE_PRIVATE_KEY_PATH to the AuthKey_${APPSTORE_KEY_ID}.p8 you downloaded."
  [ -f "$SRC" ] || die "APPSTORE_PRIVATE_KEY_PATH points at $SRC, which does not exist."
  mkdir -p "$KEY_DIR"
  cp "$SRC" "$KEY_FILE"
  chmod 600 "$KEY_FILE"
  INSTALLED_KEY=true
  echo "Installed the API key for this run; it will be removed at the end."
fi

# An archive still has to be exported. Reuse the very options CI exports with,
# so a local upload and a CI upload cannot drift apart.
if [ -d "$INPUT" ] && [[ "$INPUT" == *.xcarchive ]]; then
  EXPORT_DIR=$(mktemp -d)
  echo "Exporting an IPA from the archive..."
  xcrun xcodebuild -exportArchive \
    -archivePath "$INPUT" \
    -exportOptionsPlist "$HERE/ios/ci/ExportOptions.plist" \
    -exportPath "$EXPORT_DIR"
  IPA=$(find "$EXPORT_DIR" -name '*.ipa' | head -1)
  [ -n "$IPA" ] || die "the export produced no .ipa."
else
  IPA=$INPUT
fi

[[ "$IPA" == *.ipa ]] || die "$IPA is not a .ipa."
echo "Uploading $(basename "$IPA") ($(du -h "$IPA" | cut -f1))"

# Validate first: a binary App Store Connect will reject fails here with a
# readable reason, rather than silently a few minutes later during processing.
echo "Validating..."
xcrun altool --validate-app -f "$IPA" -t ios \
  --apiKey "$APPSTORE_KEY_ID" --apiIssuer "$APPSTORE_ISSUER_ID"

echo "Uploading..."
xcrun altool --upload-app -f "$IPA" -t ios \
  --apiKey "$APPSTORE_KEY_ID" --apiIssuer "$APPSTORE_ISSUER_ID"

cat <<'DONE'

Uploaded. App Store Connect takes roughly 10 to 15 minutes to process a build
before it appears under TestFlight -> iOS Builds. You will get an email either
way; a processing failure is reported there rather than here.
DONE
