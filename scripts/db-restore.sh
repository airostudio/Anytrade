#!/usr/bin/env bash
#
# Restore an encrypted AnyTrade backup made by scripts/db-backup.sh.
#
#   RESTORE_DATABASE_URL  database to restore INTO (required)
#   BACKUP_PASSPHRASE     the passphrase the backup was encrypted with (required)
#
#   scripts/db-restore.sh <file.dump.gpg> [--clean]
#
# By default this restores into an EMPTY database and fails rather than overwrite
# anything. Restoring into a fresh Supabase project is the normal recovery path:
# create the project, then run this against it.
#
# --clean drops each existing object before recreating it, i.e. it overwrites
# live data. Against any database that is not local it also needs
# RESTORE_CONFIRM set to the exact user@host being overwritten.
#
set -euo pipefail

FILE="${1:-}"; CLEAN="no"
[ "${2:-}" = "--clean" ] && CLEAN="yes"

if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "usage: scripts/db-restore.sh <file.dump.gpg> [--clean]" >&2; exit 2
fi
: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is not set}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is not set}"

# user@host of the target, for the overwrite confirmation.
TARGET="$(node -e '
  try { const u = new URL(process.env.RESTORE_DATABASE_URL);
        console.log(decodeURIComponent(u.username) + "@" + u.hostname); }
  catch { console.log("unparseable@unparseable"); }')"
HOST="${TARGET#*@}"

if [ "$CLEAN" = "yes" ]; then
  case "$HOST" in
    localhost|127.0.0.1|::1|\[::1\]|host.docker.internal) ;;
    *)
      if [ "${RESTORE_CONFIRM:-}" != "$TARGET" ]; then
        echo "Refusing to --clean (overwrite) $TARGET." >&2
        echo "If that is really the database to overwrite, set RESTORE_CONFIRM=\"$TARGET\"." >&2
        exit 4
      fi ;;
  esac
fi

PLAIN="$(mktemp)"
trap 'rm -f "$PLAIN"' EXIT

echo "Decrypting…"
if ! gpg --batch --yes --quiet --pinentry-mode loopback --passphrase-fd 3 \
         --decrypt --output "$PLAIN" "$FILE" 3<<<"$BACKUP_PASSPHRASE" 2>/dev/null; then
  echo "Could not decrypt: wrong passphrase, or the file is damaged." >&2
  exit 5
fi

# Every database already has a `public` schema, so the dump's CREATE SCHEMA entry
# always fails. It is harmless, but a permanent "1 error ignored" teaches you to
# stop reading the output, so leave that one entry out and treat anything else as
# fatal.
LIST="$(mktemp)"
trap 'rm -f "$PLAIN" "$LIST"' EXIT
pg_restore --list "$PLAIN" | grep -vE '^[0-9]+; [0-9]+ [0-9]+ SCHEMA - public ' > "$LIST"

FLAGS=(--no-owner --no-acl --exit-on-error --use-list="$LIST" --dbname="$RESTORE_DATABASE_URL")
[ "$CLEAN" = "yes" ] && FLAGS+=(--clean --if-exists)

echo "Restoring into $TARGET…"
pg_restore "${FLAGS[@]}" "$PLAIN"
echo "Restore complete."
