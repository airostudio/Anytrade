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

Optionally load the demo marketplace — useful for a staging or demo deployment,
**not** for production:

```bash
DATABASE_URL="postgresql://…" npm run db:seed
```

Both scripts are re-runnable. `npm run db:setup -- --reset` drops every AnyTrade
table and type first.

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
| `ADMIN_PASSCODE`        | strongly | Overrides the passcode stored in the database                 |
| `HOMEGIRLS_PASSCODE`    | strongly | As above, for the Homegirls section                           |
| `STRIPE_SECRET_KEY`     | no       | Omit to run billing in demo mode                              |
| `STRIPE_WEBHOOK_SECRET` | no       | Required if `STRIPE_SECRET_KEY` is set                        |
| `PGPOOL_MAX`            | no       | Max pooled connections (default 10)                           |

Set the two passcodes in the environment for production. They take precedence
over the values in Admin → Settings, so they never sit in the database and
rotating one immediately signs everybody out of that section.

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
Stripe Price IDs to keep in sync. Escrow payouts to tradies are recorded against
each payment (`tradesperson_amount`); wiring actual transfers requires Stripe
Connect onboarding, for which the `stripe_account_id` and `stripe_onboarded`
columns are already in place.

## 6. First admin account

`npm run db:seed` creates `admin@anytrade.com.au`. On a production database
seeded only with the schema, promote an account you have signed up:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Then sign in and enter the admin passcode at `/admin/unlock`.

## 7. After deploying — worth checking

- `/` renders and the directory lists tradies.
- Sign in lands each role on its own dashboard.
- `/admin` redirects to `/admin/unlock` for an admin and to `/` for anyone else.
- `/homegirls` redirects to `/homegirls/enter`.
- A test job can be posted, quoted on and hired.
- If Stripe is live, a test-mode purchase reaches the webhook and credits land.

The Playwright suite covers all of this — point it at the deployment:

```bash
BASE_URL="https://your-domain" npm run test:e2e
```

Be aware that it posts real data (a quote, a hire, ratings, an enquiry), so run
it against staging rather than production.
