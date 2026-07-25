#!/usr/bin/env bash
# Lädt die Website per SFTP auf den Strato-Webspace.
# Zugangsdaten liegen in .env (nicht im Repo). Nach jeder Änderung ausführen.
set -euo pipefail
cd "$(dirname "$0")"
source .env

lftp -u "$DEPLOY_USER,$DEPLOY_PASS" -p "$DEPLOY_PORT" "sftp://$DEPLOY_HOST" <<LFTP
set sftp:auto-confirm yes
set mirror:parallel-transfer-count 4
mirror -R --delete \
  -x '^\.git/' \
  -x '^\.gitignore$' \
  -x '^\.env$' \
  -x '(^|/)\.DS_Store$' \
  -x '^deploy\.sh$' \
  -x '^README\.md$' \
  -x '^CHANGELOG\.md$' \
  -x '^ideen\.txt$' \
  -x '^SEARCH-CONSOLE\.md$' \
  . $DEPLOY_DIR
LFTP
echo "✓ Deploy auf $DEPLOY_HOST:$DEPLOY_DIR fertig."
