#!/bin/sh
# Submits the built zip to the Chrome Web Store. The service account's JSON key (base64-encoded) and the publisher ID
# live in the macOS Keychain (encrypted at rest), never in a file:
#   security add-generic-password -U -s slack-hebrew-rtl-lite -a chrome-service-account -w "$(base64 -i key.json)"
#   security add-generic-password -U -s slack-hebrew-rtl-lite -a chrome-publisher-id -w <publisher-id>
set -eu

keychain() { security find-generic-password -s slack-hebrew-rtl-lite -a "$1" -w; }
key=$(keychain chrome-service-account | base64 -d)
field() { printf '%s' "$key" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).$1"; }
CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL=$(field client_email)
CHROME_SERVICE_ACCOUNT_PRIVATE_KEY=$(field private_key)
CHROME_PUBLISHER_ID=$(keychain chrome-publisher-id)
export CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL CHROME_SERVICE_ACCOUNT_PRIVATE_KEY CHROME_PUBLISHER_ID

exec wxt submit \
  --chrome-api-version v2 \
  --chrome-extension-id aodnmkaoomnpjijhackbkncdpflnnnbh \
  --chrome-zip ".output/slack-hebrew-rtl-lite-${npm_package_version}-chrome.zip" \
  "$@"
