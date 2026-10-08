#!/bin/sh
# Checks that a running container serves the app the way the threat model and
# ADR 0012 require. Used in CI against the built image, and locally:
#
#   docker run -d --rm -p 8080:8080 --name spending-insights spending-insights
#   sh scripts/docker-smoke-test.sh http://localhost:8080
#
# Exits non-zero and lists every failed check.

set -u

BASE_URL="${1:-http://localhost:8080}"
EXPECTED_CSP="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"

failures=0
headers_file="$(mktemp)"
body_file="$(mktemp)"
trap 'rm -f "$headers_file" "$body_file"' EXIT

pass() { printf '  ok    %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; failures=$((failures + 1)); }

# Fetches a path, storing lower-cased headers and the body. Prints the status.
fetch() {
  curl -sS --compressed -H 'Accept-Encoding: gzip' -D "$headers_file" -o "$body_file" \
    -w '%{http_code}' "$BASE_URL$1" | tr -d '\r'
  tr -d '\r' < "$headers_file" | tr '[:upper:]' '[:lower:]' > "$headers_file.lc"
  mv "$headers_file.lc" "$headers_file"
}

header() { sed -n "s/^$1: //p" "$headers_file" | tail -n 1; }

expect_status() {
  if [ "$2" = "$3" ]; then pass "$1 returns $3"; else fail "$1 returns $3 (got $2)"; fi
}

expect_header() {
  actual="$(header "$2")"
  if [ "$actual" = "$3" ]; then pass "$1: $2"; else fail "$1: $2 is '$3' (got '$actual')"; fi
}

expect_header_contains() {
  actual="$(header "$2")"
  case "$actual" in
    *"$3"*) pass "$1: $2 contains '$3'" ;;
    *) fail "$1: $2 contains '$3' (got '$actual')" ;;
  esac
}

# Every response must carry the security headers, including cached assets
# and errors (threat model, "Security headers").
expect_security_headers() {
  lc_csp="$(printf '%s' "$EXPECTED_CSP" | tr '[:upper:]' '[:lower:]')"
  expect_header "$1" content-security-policy "$lc_csp"
  expect_header "$1" x-content-type-options nosniff
  expect_header "$1" referrer-policy strict-origin-when-cross-origin
  expect_header "$1" permissions-policy "camera=(), microphone=(), geolocation=(), payment=()"
  expect_header "$1" cross-origin-opener-policy same-origin
}

echo "Smoke testing $BASE_URL"

echo "Index page"
status="$(fetch /)"
expect_status "GET /" "$status" 200
expect_header_contains "GET /" content-type text/html
expect_header "GET /" cache-control no-cache
expect_security_headers "GET /"
if grep -q '<div id="root">' "$body_file"; then pass "GET / serves the app"; else fail "GET / serves the app"; fi
server="$(header server)"
case "$server" in
  *[0-9]*) fail "Server header hides the version (got '$server')" ;;
  *) pass "Server header hides the version" ;;
esac
asset_path="$(grep -o '/assets/[^"]*\.js' "$body_file" | head -n 1)"

echo "Client-side routes"
status="$(fetch '/transactions?category=Groceries')"
expect_status "Deep link" "$status" 200
expect_header_contains "Deep link" content-type text/html
expect_header "Deep link" cache-control no-cache

echo "Hashed assets"
if [ -z "$asset_path" ]; then
  fail "index.html references a hashed JavaScript asset"
else
  status="$(fetch "$asset_path")"
  expect_status "GET $asset_path" "$status" 200
  expect_header_contains "Asset" content-type javascript
  expect_header "Asset" cache-control "public, max-age=31536000, immutable"
  expect_header "Asset" content-encoding gzip
  expect_security_headers "Asset"
fi

echo "Things that must not be served"
status="$(fetch /assets/does-not-exist.js)"
expect_status "Missing asset (not the index page)" "$status" 404
expect_security_headers "404 response"
status="$(fetch /assets/index.js.map)"
expect_status "Source map" "$status" 404
status="$(fetch /.env)"
expect_status "Dotfile" "$status" 404

echo "Health"
status="$(fetch /healthz)"
expect_status "GET /healthz" "$status" 200

if [ "$failures" -gt 0 ]; then
  printf '\n%s check(s) failed.\n' "$failures"
  exit 1
fi
printf '\nAll checks passed.\n'
