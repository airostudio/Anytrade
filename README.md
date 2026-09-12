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

### Demo logins

`npm run db:seed` prints these at the end:

| Role      | Email                                          | Password        |
| --------- | ---------------------------------------------- | --------------- |
| Admin     | `admin@anytrade.com.au`                        | `Admin!2345`    |
| Homeowner | `margaret.doyle@example.com`                   | `Password!123`  |
| Tradie    | `bruce.kowalski@kowalski-home-handyman.com.au` | `Password!123`  |

Passcodes for the two gated sections:

| Section     | URL           | Passcode          |
| ----------- | ------------- | ----------------- |
| Admin       | `/admin`      | `toolbox-1972`    |
| Homegirls   | `/homegirls`  | `homegirls-2024`  |

**Change both before deploying** — set `ADMIN_PASSCODE` and
`HOMEGIRLS_PASSCODE` in the environment (they override the database), or edit
them in Admin → Settings.

## Scripts

| Command            | Does                                                        |
| ------------------ | ----------------------------------------------------------- |
| `npm run dev`      | Development server                                          |
| `npm run build`    | Production build                                            |
| `npm start`        | Serve the production build                                  |
| `npm run lint`     | ESLint                                                      |
| `npm run db:setup` | Apply `db/schema.sql` (add `-- --reset` to drop everything)  |
| `npm run db:seed`  | Wipe the data tables and reseed the demo marketplace         |
| `npm run db:reset` | `db:setup --reset` then `db:seed`                            |
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

### The two passcode gates

`lib/gates.ts` implements both. The cookie stores an HMAC of the *current*
passcode, not the passcode itself, so rotating it in Admin → Settings instantly
invalidates every cookie already issued. Comparisons are constant-time and
failed attempts are written to the audit log.

Admin is protected twice over: `middleware.ts` requires a signed-in `ADMIN`
account, and `app/admin/(gated)/layout.tsx` requires the passcode. The unlock
page sits outside the gated route group so it stays reachable.

## Testing

The end-to-end suite drives a real browser through the whole marketplace:
quoting, credit spend, shortlisting, hiring, sign-off, both ratings, both
passcode gates, role guards and every admin page.

```bash
npm run db:reset            # the suite mutates data, so start fresh
npm run build && npm start
npm run test:e2e            # BASE_URL=… if not on :3000
```

`CHROME_PATH` can point at an existing Chromium if you would rather not run
`npx playwright install`.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md).

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
