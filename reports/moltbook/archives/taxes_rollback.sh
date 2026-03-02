#!/bin/bash
# Restore taxes bot snapshot (manual review recommended)
SNAPSHOT="$1"
if [ -z "$SNAPSHOT" ]; then
  echo "Usage: $0 /path/to/taxes_snapshot.zip"
  exit 1
fi
DEST=/data/.openclaw/workspace/kraken-regime-bot_restore
mkdir -p "$DEST"
unzip -o "$SNAPSHOT" -d "$DEST"
chown -R $(id -u):$(id -g) "$DEST"
echo "Restored to $DEST. To run: cd $DEST && ./run.sh"
