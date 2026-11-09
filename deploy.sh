#!/usr/bin/env bash
# Lädt die Website per SFTP auf den Webspace.
# Zugangsdaten liegen in .env (nicht im Repo). Nach jeder Änderung ausführen.
#
#   ./deploy.sh              → Server aus .env (der aktuelle)
#   ./deploy.sh .env.neu     → Server aus einer anderen Datei (z. B. beim Umzug)
#   DRY=1 ./deploy.sh ...    → nur anzeigen, was übertragen/gelöscht würde
set -euo pipefail
cd "$(dirname "$0")"
ENV_DATEI="${1:-.env}"
[ -f "$ENV_DATEI" ] || { echo "Zugangsdaten-Datei $ENV_DATEI fehlt." >&2; exit 1; }
source "$ENV_DATEI"
PROBE=""; [ "${DRY:-0}" = "1" ] && PROBE="--dry-run"

lftp -u "$DEPLOY_USER,$DEPLOY_PASS" -p "$DEPLOY_PORT" "sftp://$DEPLOY_HOST" <<LFTP
set sftp:auto-confirm yes
set mirror:parallel-transfer-count 4
mirror -R --delete $PROBE \
  -x '^\.git/' \
  -x '^\.gitignore$' \
  -x '^\.env' \
  -x '(^|/)\.DS_Store$' \
  -x '^deploy\.sh$' \
  -x '^README\.md$' \
  -x '^CHANGELOG\.md$' \
  -x '^ideen\.txt$' \
  -x '^SEARCH-CONSOLE\.md$' \
  . $DEPLOY_DIR
LFTP
echo "✓ Deploy auf $DEPLOY_HOST:$DEPLOY_DIR fertig."
