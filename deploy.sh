#!/usr/bin/env bash
# Lädt die Website auf den Webspace. Zugangsdaten liegen in .env (nicht im Repo).
# Nach jeder Änderung ausführen.
#
#   ./deploy.sh              → Server aus .env
#   ./deploy.sh .env.neu     → Server aus einer anderen Datei (z. B. beim Umzug)
#   DRY=1 ./deploy.sh ...    → nur anzeigen, was übertragen/gelöscht würde
#
# Zwei Wege, je nachdem, was in der Datei steht:
#   DEPLOY_SSH=<ssh-host>                        → rsync über SSH (Schlüssel aus ~/.ssh/config)
#   DEPLOY_HOST/PORT/USER/PASS                   → lftp über SFTP (Strato: kein Shell-Login)
# DEPLOY_DIR ist in beiden Fällen das Zielverzeichnis.
set -euo pipefail
cd "$(dirname "$0")"
ENV_DATEI="${1:-.env}"
[ -f "$ENV_DATEI" ] || { echo "Zugangsdaten-Datei $ENV_DATEI fehlt." >&2; exit 1; }
source "$ENV_DATEI"

# Whisper-Modelle sind nicht im Git; fehlen sie lokal, würde --delete sie vom Server löschen.
if [ -z "$(ls -d vendor/whisper/whisper-*/ 2>/dev/null)" ]; then
  echo "vendor/whisper/whisper-*/ fehlt lokal — erst vendor/whisper/holen.sh ausführen." >&2
  exit 1
fi

if [ -n "${DEPLOY_SSH:-}" ]; then
  PROBE=(); [ "${DRY:-0}" = "1" ] && PROBE=(--dry-run -v)
  rsync -az --delete --stats "${PROBE[@]}" \
    --exclude='/.git' --exclude='/.gitignore' --exclude='/.env*' --exclude='.DS_Store' \
    --exclude='/deploy.sh' --exclude='/README.md' --exclude='/CHANGELOG.md' \
    --exclude='/ideen.txt' --exclude='/SEARCH-CONSOLE.md' --exclude='/nginx.conf' \
    ./ "$DEPLOY_SSH:$DEPLOY_DIR/" | grep -E "^(deleting|Number of (regular files transferred|deleted)|Total transferred)|^[^ ]" | tail -40
  echo "✓ Deploy auf $DEPLOY_SSH:$DEPLOY_DIR fertig."
else
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
  -x '^nginx\.conf$' \
  . $DEPLOY_DIR
LFTP
  echo "✓ Deploy auf $DEPLOY_HOST:$DEPLOY_DIR fertig."
fi
