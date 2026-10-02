# Backups

A scheduled, encrypted, **restore-tested** backup of the production database,
run nightly by GitHub Actions. This is in addition to whatever your Supabase plan
provides, not instead of it.

## What you get

Every night at 2:30am Sydney time (and on demand from the Actions tab) the
`Database backup` workflow:

1. dumps the `public` schema over a connection that works from GitHub's runners
2. checks the dump is readable and contains all 14 AnyTrade tables
3. encrypts it with your passphrase
4. **restores it into a throwaway database and checks it came back**
5. uploads the encrypted file, kept for 30 days

If any step fails the workflow goes red and GitHub emails you. A backup that
cannot be restored is the failure mode this exists to catch.

## One-time setup

You need two repository secrets. Go to the repo → **Settings → Secrets and
variables → Actions → New repository secret**.

### 1. `BACKUP_DATABASE_URL`

In Supabase: **Connect** → **Session pooler**. It looks like:

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

It must be the **session pooler**, port **5432**. Two look-alikes will not work:

| String | Why it fails here |
| --- | --- |
| Direct (`db.<ref>.supabase.co`) | IPv6-only. GitHub's runners are IPv4-only |
| Transaction pooler (port `6543`) | Cannot run `pg_dump` |

If your password contains `@ : / ? # %` it must be percent-encoded.

### 2. `BACKUP_PASSPHRASE`

Generate it on your own machine, not in a chat or a shared document:

```bash
openssl rand -base64 36 | tr -d '/+='
```

**Store it in a password manager as well as GitHub.** GitHub will not show it
again, and if it is lost every backup is permanently unreadable. Nobody, including
us, can recover an encrypted backup without it.

### 3. Run it once

Actions tab → **Database backup** → **Run workflow**. Watch it go green, then
download the artifact and do a test restore (below) before you rely on any of this.

## Why it is encrypted

A dump contains password hashes, emails, phone numbers and addresses. This
repository is public, and workflow artifacts from a public repository can be
downloaded by anyone, so the file is encrypted (AES-256, authenticated) before it
leaves the runner. The checksum files beside it are not secret.

## Restoring

Needs `gpg` and the PostgreSQL client tools (`pg_restore`, `psql`).

1. Download the artifact from the Actions run and unzip it.
2. Create the database to restore into. For a disaster, that is a **new Supabase
   project**. Apply nothing to it; the backup contains the schema.
3. Restore, with the passphrase and the target's connection string:

```bash
export BACKUP_PASSPHRASE="…"
export RESTORE_DATABASE_URL="postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres"
bash scripts/db-restore.sh anytrade-20261002T163000Z.dump.gpg
```

It restores into an **empty** database and stops rather than overwrite anything.
To overwrite an existing database, add `--clean`. Against anything that is not
local that also needs `RESTORE_CONFIRM="user@host"` set to the exact target, so it
cannot happen by habit.

4. Point `DATABASE_URL` in Vercel at the restored database and redeploy.

Supabase's `auth.*` and `storage.*` schemas are not backed up, because
AnyTrade does not use them (it has its own `users` table).

### Practise it

Do a real restore into a scratch database once, today, and then again each
quarter. The nightly job proves the file restores; practising proves *you* can.

## Things to know

- **Retention is 30 days**, in `retention-days` in the workflow. GitHub's maximum
  is 90. For a longer history, download a monthly copy and keep it elsewhere.
- **Scheduled workflows only run from the repository's default branch.** If you
  change the default branch, the workflow file has to exist there.
- **GitHub pauses scheduled workflows in a public repository after 60 days with
  no repository activity.** Any push resets it. If backups stop, check the Actions
  tab for a banner offering to re-enable them.
- **Failures email whoever last edited the schedule.** Make sure that mailbox is
  one you read.
- **Supabase's own backups.** Look under **Database → Backups** in the dashboard
  to see what your plan includes (daily backups and point-in-time recovery depend
  on the plan). Treat those as the first line and this as the independent copy you
  control.
- **A Postgres major upgrade at Supabase** may need the `postgres:17` image in the
  workflow bumped. The restore step fails loudly if so.

## Running it locally

```bash
BACKUP_DATABASE_URL="postgresql://…" BACKUP_PASSPHRASE="…20+ chars…" npm run db:backup
```

Writes `backups/anytrade-<timestamp>.dump.gpg`. The `backups/` folder is
git-ignored so a dump can never be committed by accident.
