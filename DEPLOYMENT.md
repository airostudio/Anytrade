# Deploying AnyTrade

Next.js 14 App Router + PostgreSQL. Nothing here is Vercel-specific — it runs on
any Node host — but Vercel is the quickest path.

## 1. Provision PostgreSQL

Anything running PostgreSQL 14 or newer: Supabase, Neon, RDS, Railway, or your
own server. Copy the connection string.

The pool in `lib/db.ts` enables TLS automatically for non-local hosts (with
`rejectUnauthorized: false`, which most managed providers need). Append
`?sslmode=disable` for a plain local database.

On serverless platforms use your provider's **pooled** connection string
(Supabase's pgBouncer port, Neon's `-pooler` host) and consider setting
`PGPOOL_MAX=1`, since each serverless instance keeps its own pool.

## 2. Create the schema

From a machine that can reach the database:

```bash
DATABASE_URL="postgresql://…" npm run db:setup
```

**Never seed production.** `db:seed` and `db:setup --reset` are destructive and
the seed creates accounts with well-known passwords, so both refuse to run
against any database that is not local. `npm run db:setup` is the only one meant
for a real database: it is non-destructive and safe to re-run.

You can also apply `db/schema.sql` by hand:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

## 3. Environment variables

| Variable                | Required | Notes                                                        |
| ----------------------- | -------- | ------------------------------------------------------------ |
| `DATABASE_URL`          | yes      | PostgreSQL connection string                                  |
| `NEXTAUTH_SECRET`       | yes      | `openssl rand -base64 32`                                     |
| `NEXTAUTH_URL`          | yes      | Canonical origin, e.g. `https://anytrade.com.au`              |
| `NEXT_PUBLIC_SITE_URL`  | no       | Absolute URLs; falls back to `NEXTAUTH_URL`                   |
| `ADMIN_PASSCODE`        | **yes**  | 12+ chars. No default — the admin gate stays locked without it |
| `HOMEGIRLS_PASSCODE`    | **yes**  | 12+ chars. No default — the Homegirls gate stays locked without it |
| `STRIPE_SECRET_KEY`     | no       | Omit to run billing in demo mode                              |
| `STRIPE_WEBHOOK_SECRET` | no       | Required if `STRIPE_SECRET_KEY` is set                        |
| `STRIPE_CONNECT_COUNTRY`| no       | Platform country for Connect accounts (default `AU`)          |
| `PGPOOL_MAX`            | no       | Max pooled connections (default 10)                           |

There are no default passcodes: a gate with none configured is closed to
everyone, since any default would be published with the source. The environment
variable takes precedence over Admin → Settings, so the passcode never has to sit
in the database, and rotating it immediately signs everybody out of that
section.

## 4. Deploy

```bash
npm ci
npm run build
npm start          # or your platform's start command
```

On Vercel: import the repo, add the environment variables, deploy. The default
build and output settings are correct — `vercel.json` pins them.

Note that `middleware.ts` runs on the edge runtime and deliberately does **not**
import the database. Auth for middleware comes from `lib/auth.config.ts`, which
has no provider attached; the credentials provider lives in `lib/auth.ts` and
only runs in Node. Keep it that way or the middleware bundle will fail to build.

`trustHost: true` is set in the auth config, which is required anywhere other
than Vercel — without it Auth.js rejects every request with `UntrustedHost`.
Make sure your proxy sets `X-Forwarded-Host`/`Host` correctly.

## 5. Stripe (optional)

Without keys the whole billing surface still works: checkout settles instantly,
nothing is charged, and purchases are recorded exactly as real ones. The UI says
"Demo mode" wherever that applies.

To go live:

1. Add `STRIPE_SECRET_KEY`.
2. Create a webhook endpoint pointing at `https://your-domain/api/stripe/webhook`.
3. Subscribe it to:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.payment_failed`
   - `invoice.paid`
   - `customer.subscription.deleted`
   - `charge.refunded`
4. Add the signing secret as `STRIPE_WEBHOOK_SECRET`.

`GET /api/stripe/webhook` returns a small JSON payload confirming the endpoint
is reachable and whether keys are configured.

Prices are defined in code (`CREDIT_PACKS` and `MEMBERSHIP_PLANS` in
`lib/constants.ts`) and sent to Checkout as inline `price_data`, so there are no
Stripe Price IDs to keep in sync.

## 6. Stripe Connect (paying tradies)

Tradies are paid via Connect **Express** accounts, using separate charges and
transfers so money can be held in escrow until the customer signs the job off.

1. **Enable Connect** in the Stripe dashboard (Connect → Get started) and pick
   **Express** as the account type.
2. **Set the platform country** if you are not operating in Australia:
   `STRIPE_CONNECT_COUNTRY=NZ` (defaults to `AU`).
3. **Brand the onboarding** under Connect → Settings → Branding. Tradies see
   this during sign-up, so it should look like AnyTrade, not like Stripe.
4. **Register the Connect webhook.** The same URL handles both, but Stripe
   treats them as separate endpoints — add
   `https://your-domain/api/stripe/webhook` a second time as a **Connect**
   endpoint and subscribe it to:
   - `account.updated`
   - `transfer.created`
   - `transfer.reversed`
   - `payout.failed`

   Use the same `STRIPE_WEBHOOK_SECRET` if Stripe issues one secret, or set the
   Connect endpoint's secret if it differs.
5. **Fund transfers.** Transfers draw on the platform's Stripe balance. Because
   each transfer is sourced from the original charge, the money is normally
   already there — but a negative balance will make transfers fail, so keep an
   eye on Balance → Overview while volume is low.

### What tradies see

`/tradie/billing` shows a payout panel in one of five states: not set up, half
finished, being checked, ready, or action needed. Stripe's requirement keys are
translated into plain English, and the panel links straight into their Express
dashboard once connected.

### If a tradie is not onboarded when money is released

The payout is parked (`payments.transfer_status = 'pending_account'`), the
tradie is told what is waiting, and it transfers automatically once their
account goes live. Nothing is lost and nothing needs manual intervention.
Admin → Payments shows the total parked and who it is waiting on.

### Testing Connect

In Stripe test mode, onboarding accepts test values — use `000-000` as the SMS
code and the prefilled test data Stripe offers. Test-mode transfers settle
instantly. `GET /api/stripe/webhook` confirms which events the endpoint expects.

## 7. First admin account

`npm run db:seed` creates `admin@anytrade.com.au`. On a production database
seeded only with the schema, promote an account you have signed up:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Then sign in and enter the admin passcode at `/admin/unlock`.

## 8. After deploying — worth checking

- `/` renders and the directory lists tradies.
- Sign in lands each role on its own dashboard.
- `/admin` redirects to `/admin/unlock` for an admin and to `/` for anyone else.
- `/homegirls` redirects to `/homegirls/enter`.
- A test job can be posted, quoted on and hired.
- If Stripe is live, a test-mode purchase reaches the webhook and credits land.
- A tradie can start Connect onboarding and comes back with payouts enabled.
- Signing a funded job off releases the escrow and transfers the tradie's share.

The Playwright suite covers all of this — point it at the deployment:

```bash
BASE_URL="https://your-domain" npm run test:e2e
```

Be aware that it posts real data (a quote, a hire, ratings, an enquiry), so run
it against staging rather than production.
