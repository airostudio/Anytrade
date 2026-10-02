#!/usr/bin/env bash
#
# Take an encrypted logical backup of the AnyTrade database.
#
#   BACKUP_DATABASE_URL   Postgres connection string to back up (required)
#   BACKUP_PASSPHRASE     encrypts the dump (required, 20+ chars, keep it safe)
#   OUT_DIR               where to write the result (default: ./backups)
#
# Produces  anytrade-<UTC timestamp>.dump.gpg  and a .sha256 beside it.
#
# The dump holds password hashes and personal details, so it is encrypted before
# it touches disk anywhere durable. That matters because this repository is
# public, and a CI artifact from a public repo is readable by anyone.
#
# Before encrypting, the dump is checked: it must be readable and must contain
# every AnyTrade table. A backup that cannot be read is worse than none, because
# you only find out when you need it.
#
set -euo pipefail

: "${BACKUP_DATABASE_URL:?BACKUP_DATABASE_URL is not set}"
: "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE is not set}"

if [ "${#BACKUP_PASSPHRASE}" -lt 20 ]; then
  echo "BACKUP_PASSPHRASE must be at least 20 characters." >&2
  exit 2
fi

EXPECTED_TABLES=(
  audit_log bids contact_enquiries credit_ledger homegirls_members homegirls_posts
  jobs messages notifications payments reviews site_settings tradespeople users
)

OUT_DIR="${OUT_DIR:-backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FINAL="$OUT_DIR/anytrade-$STAMP.dump.gpg"
mkdir -p "$OUT_DIR"

PLAIN="$(mktemp)"
trap 'rm -f "$PLAIN"' EXIT      # the plaintext dump never outlives this script

echo "Dumping…"
# Custom format is compressed and lets pg_restore pick tables back out later.
# Only the public schema: Supabase's own schemas (auth, storage…) are managed by
# Supabase and are not ours to restore. No owners/ACLs, so it restores anywhere.
pg_dump \
  --format=custom \
  --schema=public \
  --no-owner \
  --no-acl \
  --dbname="$BACKUP_DATABASE_URL" \
  --file="$PLAIN"

echo "Verifying the dump is readable and complete…"
TOC="$(pg_restore --list "$PLAIN")"
missing=()
for table in "${EXPECTED_TABLES[@]}"; do
  if ! grep -qE " TABLE public $table " <<<"$TOC"; then
    missing+=("$table")
  fi
done
if [ "${#missing[@]}" -gt 0 ]; then
  echo "BACKUP REJECTED: the dump is missing tables: ${missing[*]}" >&2
  echo "Is this the right database, and has db/schema.sql been applied?" >&2
  exit 3
fi

echo "Encrypting…"
gpg --batch --yes --quiet \
    --pinentry-mode loopback --passphrase-fd 3 \
    --symmetric --cipher-algo AES256 --compress-algo none \
    --output "$FINAL" "$PLAIN" 3<<<"$BACKUP_PASSPHRASE"

( cd "$OUT_DIR" && sha256sum "$(basename "$FINAL")" > "$(basename "$FINAL").sha256" )

SIZE="$(wc -c < "$FINAL" | tr -d ' ')"
echo "OK  $FINAL  (${SIZE} bytes, ${#EXPECTED_TABLES[@]} tables verified)"
# GitHub Actions: expose the path to later steps.
if [ -n "${GITHUB_OUTPUT:-}" ]; then echo "file=$FINAL" >> "$GITHUB_OUTPUT"; fi
