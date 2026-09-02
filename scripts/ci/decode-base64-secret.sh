#!/usr/bin/env bash
#
# Decode a base64 repository secret into a file.
#
# Secrets pick up stray formatting on the way into GitHub: a pasted value can
# arrive wrapped in quotes, line-broken, PEM-armoured, URL-safe encoded, or
# stripped of its padding. base64(1) rejects every one of those with the same
# opaque "error decoding base64 input stream", and under `set -e` the calling
# step dies before it can say which applied.
#
# So this tolerates all of them, and when the value genuinely cannot be
# decoded it reports what is wrong with it — length, padding, which class of
# stray character — without ever printing the value itself.
#
# Usage: decode-base64-secret.sh VAR_NAME OUTPUT_PATH [LABEL] [--expect-der]

set -uo pipefail

VAR=${1:?usage: decode-base64-secret.sh VAR_NAME OUTPUT_PATH [LABEL] [--expect-der]}
OUT=${2:?output path required}
LABEL=${3:-$VAR}
EXPECT_DER=false
[ "${4:-}" = "--expect-der" ] && EXPECT_DER=true

fail() {
  echo "::error::$LABEL: $1"
  exit 1
}

raw=${!VAR-}
[ -n "$raw" ] || fail "the secret $VAR is empty or not set."

# Order matters: strip the armour before the whitespace, or the BEGIN/END
# lines merge into the payload and every character of them reads as invalid.
clean=$(printf '%s' "$raw" | sed -E '/-----(BEGIN|END)[^-]*-----/d')
clean=$(printf '%s' "$clean" | tr -d '[:space:]')
clean=$(printf '%s' "$clean" | sed -E 's/^["'"'"']+//; s/["'"'"']+$//')
# base64url, which some tools emit and standard base64 will not accept.
clean=$(printf '%s' "$clean" | tr '_-' '/+')
# Restore padding a copy-paste dropped.
case $(( ${#clean} % 4 )) in
  2) clean="${clean}==" ;;
  3) clean="${clean}=" ;;
esac

# openssl is the tolerant decoder of the two and is present on every runner;
# BSD base64 is the fallback for a stripped image.
if printf '%s' "$clean" | openssl base64 -d -A > "$OUT" 2>/dev/null && [ -s "$OUT" ]; then
  :
elif printf '%s' "$clean" | base64 -D > "$OUT" 2>/dev/null && [ -s "$OUT" ]; then
  :
else
  rm -f "$OUT"
  # Nothing below prints the value: only its shape.
  echo "::group::What is wrong with $VAR"
  echo "characters in the secret: ${#raw}"
  echo "after stripping whitespace, quotes and any PEM armour: ${#clean}"
  echo "length modulo 4 (0 is correct): $(( ${#clean} % 4 ))"
  stray=$(printf '%s' "$clean" | tr -d 'A-Za-z0-9+/=' | wc -c | tr -d ' ')
  echo "characters outside the base64 alphabet: $stray"
  case "$raw" in
    *"-----BEGIN"*) echo "note: the value is PEM-armoured; base64 of the raw DER file is wanted, not the PEM text." ;;
  esac
  case "$raw" in
    *'"'*|*"'"*) echo "note: the value contains quote characters; paste it without surrounding quotes." ;;
  esac
  echo "::endgroup::"
  fail "the value is not valid base64. Regenerate it with: base64 -i <file> | pbcopy (macOS) or base64 -w0 <file> (Linux), and paste the result with no quotes or line breaks."
fi

SIZE=$(wc -c < "$OUT" | tr -d ' ')
echo "$LABEL: decoded $SIZE bytes."

if $EXPECT_DER; then
  # DER always opens with a SEQUENCE tag. A value that decodes to anything
  # else is base64 of the wrong file.
  if [ "$(od -An -tx1 -N1 "$OUT" | tr -d ' \n')" != "30" ]; then
    rm -f "$OUT"
    fail "the value decoded, but the result is not DER, so $VAR holds base64 of the wrong file."
  fi
  [ "$SIZE" -ge 1000 ] || fail "the decoded file is only $SIZE bytes, far smaller than a real one. The secret looks truncated."
  echo "$LABEL: content is DER, as expected."
fi
