# AnyTrade

An Australian trades directory and hiring marketplace, built around the jobs
most tradies won't cross town for: **the home handyman list**.

Homeowners post a job for free, up to six local tradies quote on it, and both
sides rate each other once the work is signed off.

- **Directory + job board** — browse rated, licence-checked tradies by trade and
  suburb, or post a job and let them come to you.
- **Freelancer-style bidding** — tradies spend lead credits to quote; clients get
  a side-by-side comparison with lowest/average/highest, shortlisting and a
  single-click hire that declines the rest.
- **Uber-style two-way ratings** — the customer rates the tradie on quality,
  punctuality, value, communication and tidiness; the tradie rates the customer
  back. Ratings only come from completed jobs.
- **Stripe billing** — lead credit packs, monthly memberships and optional
  escrow on job payments. Runs in demo mode until keys are added.
- **Password-protected admin** — a full back office behind an ADMIN role *and* a
  separate passcode.
- **Password-protected Homegirls section** — a members-only network for women in
  the trades, with its own directory, noticeboard and mentoring.

Look and feel is deliberately old-school: enamel signwriting, manila dockets,
hazard tape and hard drop shadows. Reliable and reasonably priced, not glossy.

## Stack

| Layer     | Choice                                              |
| --------- | --------------------------------------------------- |
| Framework | Next.js 14 (App Router, Server Actions)             |
| Database  | PostgreSQL via `pg` — plain SQL, no ORM             |
| Auth      | Auth.js (NextAuth v5), credentials + JWT sessions   |
| Payments  | Stripe Checkout + webhooks                          |
| Styling   | Tailwind CSS                                        |
| Tests     | Playwright end-to-end suite                         |

Data access is hand-written SQL in `lib/repos/*`. There is no ORM and no
migration tool — the schema is a single file, `db/schema.sql`.

## Getting started

Requires Node 18.17+ and a PostgreSQL 14+ database.

```bash
npm install
cp .env.example .env        # then set DATABASE_URL and NEXTAUTH_SECRET
npm run db:setup            # create the schema
npm run db:seed             # fill it with a realistic demo marketplace
npm run dev
```

Open http://localhost:3000.

### Demo logins (local development only)

`npm run db:seed` fills a **local** database with a fictional marketplace and
prints these at the end. They exist only so you can click around; the seed
refuses to run against anything but a local database, so they can never be
planted in production.

| Role      | Email                                          | Password        |
| --------- | ---------------------------------------------- | --------------- |
| Admin     | `admin@anytrade.com.au`                        | `Admin!2345`    |
| Homeowner | `margaret.doyle@example.com`                   | `Password!123`  |
| Tradie    | `bruce.kowalski@kowalski-home-handyman.com.au` | `Password!123`  |

### Passcodes

The admin and Homegirls sections sit behind a passcode on top of normal sign-in.
**There are no default passcodes.** A gate with none configured stays locked to
everyone, because any default would be published with the source.

Set them in the environment (or in `.env` locally), at least 12 characters each:

```bash
ADMIN_PASSCODE="…"
HOMEGIRLS_PASSCODE="…"
```

Generate one with `openssl rand -base64 18 | tr -d '/+='`. They can also be
changed from Admin → Settings, but the environment variable takes precedence.

## Scripts

| Command            | Does                                                        |
| ------------------ | ----------------------------------------------------------- |
| `npm run dev`      | Development server                                          |
| `npm run build`    | Production build                                            |
| `npm start`        | Serve the production build                                  |
| `npm run lint`     | ESLint                                                      |
| `npm run db:setup` | Apply `db/schema.sql` (add `-- --reset` to drop everything)  |
| `npm run db:seed`  | **Local only.** Wipes the data tables and reseeds the demo marketplace |
| `npm run db:reset` | **Local only.** `db:setup --reset` then `db:seed`            |
| `npm run db:backup`| Encrypted `pg_dump` of the database (see BACKUPS.md)         |
| `npm run db:restore`| Restore an encrypted backup into an empty database           |
| `npm run test:e2e` | Playwright end-to-end suite (see below)                      |

## How the pieces fit

### Bidding

A tradie's lead feed (`/tradie/leads`) shows only open jobs in their trades and
service areas that they have not already quoted on and that are under the bid
cap (six by default). Submitting a quote costs lead credits, scaled by job size
(`BID_CREDIT_COST` in `lib/constants.ts`).

`placeBid()` in `lib/repos/bids.ts` does the whole thing in one transaction with
`SELECT … FOR UPDATE` on both the job and the tradie, so two tradies racing for
the last slot cannot both get in and credits can never go negative.

Accepting a quote (`awardJob()`) accepts one bid, declines every other live bid
and moves the job to `AWARDED` atomically.

### Ratings

Ratings unlock when the customer signs the job off. Both directions are stored
in one `reviews` table, distinguished by `direction`:

- `CLIENT_TO_TRADIE` — overall score plus five sub-scores and quick-tap tags.
- `TRADIE_TO_CLIENT` — overall score plus tags, shown to other tradies quoting
  on that customer's future jobs.

Averages are denormalised onto `tradespeople` and `users` and recomputed by
`refreshTradieRatings()` / `refreshClientRating()` whenever a review is written,
hidden or restored — so moderating a review immediately corrects the average.

### Billing

Three purchase types, all through Stripe Checkout: lead credit packs (one-off),
memberships (subscription) and job deposits (held in escrow until sign-off).

Every purchase records a `PENDING` payment first, then either hands off to
Stripe or — when `STRIPE_SECRET_KEY` is absent — settles locally through the
same `fulfilPayment()` used by the webhook. Both paths end in identical database
state, so the flows are demonstrable without keys and nothing needs rewriting
when keys are added.

The webhook (`/api/stripe/webhook`) handles `checkout.session.completed`,
`checkout.session.expired`, `payment_intent.payment_failed`, `invoice.paid`,
`customer.subscription.deleted` and `charge.refunded`. It is idempotent —
Stripe retries, and an already-settled payment is skipped.

### Paying tradies — Stripe Connect

Tradies onboard as **Express** accounts. Job money uses **separate charges and
transfers**, not destination charges: the customer is charged to the platform,
the funds sit in escrow, and a `Transfer` moves the tradie's share across when
the customer signs the job off. A destination charge would pay out the moment
the card is captured, which is exactly what escrow exists to prevent.

The money path, end to end:

1. Customer accepts a quote and pays into escrow. The PaymentIntent carries a
   `transfer_group` of `job_<id>` so the two halves reconcile in Stripe.
2. Payment sits as `HELD_IN_ESCROW`. AnyTrade holds it, not the tradie.
3. The customer signs the job off. That releases the escrow **and** fires the
   payout — no separate "release" step to forget.
4. `payoutForPayment()` transfers `tradesperson_amount` to the connected
   account, sourced from the original charge. The platform keeps the fee simply
   by transferring less than it charged.

If the tradie has not finished onboarding when the money is released, the payout
is parked as `transfer_status = 'pending_account'` rather than failing silently.
They are told what is waiting, and `settlePendingTransfers()` sweeps it the
moment their account goes live — triggered by the `account.updated` webhook or
by the "Check with Stripe" button.

`lib/connect.ts` owns all of this. Connect webhook events (`account.updated`,
`transfer.created`, `transfer.reversed`, `payout.failed`) come into the same
endpoint — register the URL as a Connect endpoint as well as an account one.

Payout state is derived by `payoutSummary()` into one of five states —
`not_started`, `incomplete`, `pending_review`, `ready`, `restricted` — which is
what both the tradie's billing page and the admin tradie list render. Stripe's
raw requirement keys are translated into plain English by `describeRequirement()`
so a tradie reads "Bank account for payouts", not `external_account`.

Without Stripe keys, Connect runs in demo mode too: onboarding completes inline
against a clearly-fake `acct_demo_…` id and transfers are recorded as paid, so
the whole payout lifecycle is demonstrable before you have an account.

### The two passcode gates

`lib/gates.ts` implements both. The cookie stores an HMAC of the *current*
passcode, not the passcode itself, so rotating it in Admin → Settings instantly
invalidates every cookie already issued. Comparisons are constant-time and
failed attempts are written to the audit log.

Admin is protected twice over: `middleware.ts` requires a signed-in `ADMIN`
account, and `app/admin/(gated)/layout.tsx` requires the passcode. The unlock
page sits outside the gated route group so it stays reachable.

## Where the Homegirls section is heading

The Homegirls network currently lives inside AnyTrade as a passcode-gated
section. The plan is for it to become **an independent female-only trades
hiring site**, affiliated with AnyTrade so the two cross-refer and between them
cover roughly twice the audience.

It has been built with that split in mind, so the seam is already clean:

| Concern        | Where it lives now                                         |
| -------------- | ---------------------------------------------------------- |
| Routes         | `app/homegirls/` — its own route group, layout and gate      |
| Data           | `homegirls_members`, `homegirls_posts` — its own tables      |
| Queries        | `lib/repos/homegirls.ts` — nothing else reads those tables   |
| Access         | `lib/gates.ts`, the `homegirls` gate — independent of admin  |
| Link to trades | `tradespeople.is_homegirl` (a flag, not a separate profile)  |
| Link to jobs   | `jobs.prefer_homegirl` (routes a job to members only)        |

Two join points are all that couple it to the marketplace: a tradie's
`is_homegirl` flag and a job's `prefer_homegirl` flag. Everything else is
self-contained.

When it is split out, the likely shape is a separate Next.js app against the
same PostgreSQL database (or its own database plus a sync/affiliate API),
reusing `lib/repos/homegirls.ts` as-is. The pieces that would need building are
its own branding and design system, its own auth (or shared SSO with AnyTrade),
and a referral mechanism so a job posted on one site can surface on the other —
the `prefer_homegirl` flag is already the hook for that last part.

Until then, nothing here assumes Homegirls is permanent furniture: deleting the
`app/homegirls/` directory, the two tables and the `homegirls` gate would leave
the rest of the marketplace working.

## Testing

The end-to-end suite drives a real browser through the whole marketplace:
quoting, credit spend, shortlisting, hiring, sign-off, both ratings, both
passcode gates, role guards and every admin page.

```bash
npm run db:reset            # the suite mutates data, so start fresh (local DB only)
npm run build
export ADMIN_PASSCODE="…" HOMEGIRLS_PASSCODE="…"   # 12+ characters each
npm start                   # the app and the suite need the same two values
npm run test:e2e            # BASE_URL=… if not on :3000
```

`CHROME_PATH` can point at an existing Chromium if you would rather not run
`npx playwright install`.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md). Backups are covered in [BACKUPS.md](BACKUPS.md).

## Project layout

```
app/
  (site)/          public pages, client dashboard, tradie dashboard
  admin/           back office — unlock page + (gated) route group
  homegirls/       members' network — enter page + (inside) route group
  actions/         server actions (all mutations)
  api/stripe/      webhook
components/        shared UI — enamel panels, stamps, stars, cards
db/schema.sql      the entire database schema
lib/
  db.ts            pg pool + query helpers
  repos/           hand-written SQL per aggregate
  gates.ts         the two passcode gates
  stripe.ts        Stripe client + checkout
  fulfilment.ts    what happens once money is confirmed
scripts/           db setup + seed
tests/e2e.mjs      Playwright suite
```
