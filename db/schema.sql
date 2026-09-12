-- ============================================================================
--  AnyTrade — PostgreSQL schema
--  Trades directory, job board, Freelancer-style bidding, two-way ratings,
--  Stripe billing, admin back office and the Homegirls network.
--
--  Apply with:  npm run db:setup        (drop + recreate: npm run db:setup -- --reset)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Enumerated types ────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CLIENT', 'TRADESPERSON', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM
    ('DRAFT','OPEN','SHORTLISTING','AWARDED','IN_PROGRESS','COMPLETED','CANCELLED','EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE job_size AS ENUM ('ODD_JOB','HALF_DAY','FULL_DAY','MULTI_DAY','LARGE_PROJECT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE job_urgency AS ENUM ('EMERGENCY','THIS_WEEK','NEXT_FORTNIGHT','FLEXIBLE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE bid_status AS ENUM
    ('PENDING','SHORTLISTED','ACCEPTED','DECLINED','WITHDRAWN','EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM
    ('PENDING','PROCESSING','HELD_IN_ESCROW','RELEASED','REFUNDED','FAILED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM
    ('JOB_DEPOSIT','JOB_BALANCE','LEAD_CREDITS','MEMBERSHIP','FEATURED_LISTING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE membership_tier AS ENUM ('FREE','SUBBIE','GUVNOR','MASTER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE review_direction AS ENUM ('CLIENT_TO_TRADIE','TRADIE_TO_CLIENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE review_status AS ENUM ('PUBLISHED','PENDING_MODERATION','HIDDEN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('UNVERIFIED','PENDING','VERIFIED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE credit_reason AS ENUM
    ('PURCHASE','BID_UNLOCK','REFUND','ADMIN_ADJUSTMENT','SIGNUP_BONUS','MEMBERSHIP_ALLOWANCE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE homegirls_status AS ENUM ('PENDING','APPROVED','DECLINED','SUSPENDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Shared trigger: keep updated_at honest ──────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email               TEXT NOT NULL UNIQUE,
  password            TEXT NOT NULL,
  name                TEXT NOT NULL,
  role                user_role NOT NULL DEFAULT 'CLIENT',
  phone               TEXT,
  avatar_url          TEXT,
  suburb              TEXT,
  city                TEXT,
  state               TEXT,
  postcode            TEXT,
  is_suspended        BOOLEAN NOT NULL DEFAULT FALSE,
  suspended_at        TIMESTAMPTZ,
  suspended_reason    TEXT,
  last_login_at       TIMESTAMPTZ,
  -- tradies rate their clients too, rideshare style
  client_rating       NUMERIC(3,2) NOT NULL DEFAULT 0,
  client_review_count INTEGER NOT NULL DEFAULT 0,
  stripe_customer_id  TEXT UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_role_idx     ON users (role);
CREATE INDEX IF NOT EXISTS users_postcode_idx ON users (postcode);
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── tradespeople ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tradespeople (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id             TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  slug                TEXT NOT NULL UNIQUE,
  business_name       TEXT NOT NULL,
  tagline             TEXT,
  bio                 TEXT,
  logo_url            TEXT,
  cover_url           TEXT,
  gallery             TEXT[] NOT NULL DEFAULT '{}',

  -- trades are category slugs; handyman_services are the small-job specialties
  trades              TEXT[] NOT NULL DEFAULT '{}',
  handyman_services   TEXT[] NOT NULL DEFAULT '{}',
  accepts_small_jobs  BOOLEAN NOT NULL DEFAULT TRUE,

  abn                 TEXT,
  licence_number      TEXT,
  licence_expiry      DATE,
  insurer_name        TEXT,
  insurance_expiry    DATE,
  years_experience    INTEGER,
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  verified_at         TIMESTAMPTZ,
  verification_notes  TEXT,

  hourly_rate         NUMERIC(10,2),
  callout_fee         NUMERIC(10,2),
  minimum_charge      NUMERIC(10,2),
  free_quotes         BOOLEAN NOT NULL DEFAULT TRUE,

  service_areas       TEXT[] NOT NULL DEFAULT '{}',
  base_suburb         TEXT,
  city                TEXT,
  state               TEXT,
  postcode            TEXT,
  travel_radius_km    INTEGER NOT NULL DEFAULT 25,

  available_now       BOOLEAN NOT NULL DEFAULT TRUE,
  available_weekends  BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_callouts  BOOLEAN NOT NULL DEFAULT FALSE,

  is_homegirl         BOOLEAN NOT NULL DEFAULT FALSE,

  membership_tier       membership_tier NOT NULL DEFAULT 'FREE',
  membership_started_at TIMESTAMPTZ,
  membership_ends_at    TIMESTAMPTZ,
  stripe_account_id     TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_onboarded      BOOLEAN NOT NULL DEFAULT FALSE,
  -- Stripe Connect payout readiness, mirrored from account.updated webhooks
  stripe_charges_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_payouts_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_details_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_requirements      TEXT[] NOT NULL DEFAULT '{}',
  stripe_onboarded_at      TIMESTAMPTZ,
  stripe_account_synced_at TIMESTAMPTZ,
  lead_credits          INTEGER NOT NULL DEFAULT 0,

  average_rating        NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_reviews         INTEGER NOT NULL DEFAULT 0,
  rating_quality        NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_punctuality    NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_value          NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_communication  NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_tidiness       NUMERIC(3,2) NOT NULL DEFAULT 0,

  completed_jobs        INTEGER NOT NULL DEFAULT 0,
  total_bids            INTEGER NOT NULL DEFAULT 0,
  won_bids              INTEGER NOT NULL DEFAULT 0,
  response_rate         NUMERIC(5,2) NOT NULL DEFAULT 0,
  response_time_mins    INTEGER,
  profile_views         INTEGER NOT NULL DEFAULT 0,

  is_featured           BOOLEAN NOT NULL DEFAULT FALSE,
  featured_until        TIMESTAMPTZ,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tradespeople_homegirl_idx     ON tradespeople (is_homegirl);
CREATE INDEX IF NOT EXISTS tradespeople_verification_idx ON tradespeople (verification_status);
CREATE INDEX IF NOT EXISTS tradespeople_rating_idx       ON tradespeople (average_rating DESC);
CREATE INDEX IF NOT EXISTS tradespeople_trades_idx       ON tradespeople USING GIN (trades);
CREATE INDEX IF NOT EXISTS tradespeople_areas_idx        ON tradespeople USING GIN (service_areas);
CREATE INDEX IF NOT EXISTS tradespeople_handyman_idx     ON tradespeople USING GIN (handyman_services);
DROP TRIGGER IF EXISTS tradespeople_updated_at ON tradespeople;
CREATE TRIGGER tradespeople_updated_at BEFORE UPDATE ON tradespeople
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── jobs ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reference       TEXT NOT NULL UNIQUE,
  client_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL,
  photos          TEXT[] NOT NULL DEFAULT '{}',

  budget_min      NUMERIC(10,2),
  budget_max      NUMERIC(10,2),
  job_size        job_size NOT NULL DEFAULT 'ODD_JOB',
  urgency         job_urgency NOT NULL DEFAULT 'FLEXIBLE',

  address         TEXT,
  suburb          TEXT NOT NULL,
  city            TEXT NOT NULL,
  state           TEXT NOT NULL,
  postcode        TEXT NOT NULL,

  status          job_status NOT NULL DEFAULT 'OPEN',
  preferred_date  DATE,
  prefer_homegirl BOOLEAN NOT NULL DEFAULT FALSE,

  max_bids        INTEGER NOT NULL DEFAULT 6,
  bid_count       INTEGER NOT NULL DEFAULT 0,
  view_count      INTEGER NOT NULL DEFAULT 0,
  bids_close_at   TIMESTAMPTZ,
  accepted_bid_id TEXT,

  awarded_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jobs_client_idx   ON jobs (client_id);
CREATE INDEX IF NOT EXISTS jobs_category_idx ON jobs (category);
CREATE INDEX IF NOT EXISTS jobs_status_idx   ON jobs (status);
CREATE INDEX IF NOT EXISTS jobs_postcode_idx ON jobs (postcode);
CREATE INDEX IF NOT EXISTS jobs_created_idx  ON jobs (created_at DESC);
DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── bids ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bids (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_id             TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tradesperson_id    TEXT NOT NULL REFERENCES tradespeople(id) ON DELETE CASCADE,
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  amount             NUMERIC(10,2) NOT NULL,
  message            TEXT NOT NULL,
  estimated_days     INTEGER,
  estimated_hours    NUMERIC(5,1),
  includes_materials BOOLEAN NOT NULL DEFAULT FALSE,
  includes_gst       BOOLEAN NOT NULL DEFAULT TRUE,
  available_from     DATE,
  warranty_months    INTEGER,

  status             bid_status NOT NULL DEFAULT 'PENDING',
  is_shortlisted     BOOLEAN NOT NULL DEFAULT FALSE,
  seen_by_client     BOOLEAN NOT NULL DEFAULT FALSE,
  credits_spent      INTEGER NOT NULL DEFAULT 1,

  shortlisted_at     TIMESTAMPTZ,
  accepted_at        TIMESTAMPTZ,
  declined_at        TIMESTAMPTZ,
  withdrawn_at       TIMESTAMPTZ,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (job_id, tradesperson_id)
);
CREATE INDEX IF NOT EXISTS bids_job_idx    ON bids (job_id);
CREATE INDEX IF NOT EXISTS bids_tradie_idx ON bids (tradesperson_id);
CREATE INDEX IF NOT EXISTS bids_status_idx ON bids (status);
DROP TRIGGER IF EXISTS bids_updated_at ON bids;
CREATE TRIGGER bids_updated_at BEFORE UPDATE ON bids
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DO $$ BEGIN
  ALTER TABLE jobs ADD CONSTRAINT jobs_accepted_bid_fk
    FOREIGN KEY (accepted_bid_id) REFERENCES bids(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── reviews (two-way) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id                   TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_id               TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  direction            review_direction NOT NULL,

  reviewer_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- populated only when the tradie is the one being rated
  tradesperson_id      TEXT REFERENCES tradespeople(id) ON DELETE CASCADE,

  rating               INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment              TEXT,

  rating_quality       INTEGER CHECK (rating_quality BETWEEN 1 AND 5),
  rating_punctuality   INTEGER CHECK (rating_punctuality BETWEEN 1 AND 5),
  rating_value         INTEGER CHECK (rating_value BETWEEN 1 AND 5),
  rating_communication INTEGER CHECK (rating_communication BETWEEN 1 AND 5),
  rating_tidiness      INTEGER CHECK (rating_tidiness BETWEEN 1 AND 5),

  -- quick-tap compliments, the way a rideshare app collects them
  tags                 TEXT[] NOT NULL DEFAULT '{}',

  response             TEXT,
  responded_at         TIMESTAMPTZ,

  status               review_status NOT NULL DEFAULT 'PUBLISHED',
  is_flagged           BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reason          TEXT,
  moderated_at         TIMESTAMPTZ,
  moderator_note       TEXT,

  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (job_id, reviewer_id, direction)
);
CREATE INDEX IF NOT EXISTS reviews_tradie_idx   ON reviews (tradesperson_id);
CREATE INDEX IF NOT EXISTS reviews_reviewee_idx ON reviews (reviewee_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx   ON reviews (status);
DROP TRIGGER IF EXISTS reviews_updated_at ON reviews;
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── payments ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_id                     TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  user_id                    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  type                       payment_type NOT NULL,
  description                TEXT,

  amount                     NUMERIC(10,2) NOT NULL,
  platform_fee               NUMERIC(10,2) NOT NULL DEFAULT 0,
  tradesperson_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency                   TEXT NOT NULL DEFAULT 'aud',

  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id   TEXT UNIQUE,
  stripe_transfer_id         TEXT UNIQUE,
  stripe_invoice_id          TEXT UNIQUE,
  receipt_url                TEXT,

  -- Separate charges and transfers: the client's money is charged to the
  -- platform and held, then transferred to the tradie's connected account when
  -- the job is signed off. transfer_group ties the two halves together.
  transfer_group         TEXT,
  destination_account_id TEXT,
  transfer_status        TEXT,  -- pending_account | paid | failed | reversed
  transferred_at         TIMESTAMPTZ,
  transfer_error         TEXT,

  status                     payment_status NOT NULL DEFAULT 'PENDING',
  held_at                    TIMESTAMPTZ,
  released_at                TIMESTAMPTZ,
  refunded_at                TIMESTAMPTZ,
  failure_message            TEXT,

  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_job_idx    ON payments (job_id);
CREATE INDEX IF NOT EXISTS payments_user_idx   ON payments (user_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments (status);
CREATE INDEX IF NOT EXISTS payments_type_idx   ON payments (type);
DROP TRIGGER IF EXISTS payments_updated_at ON payments;
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── lead credit ledger ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_ledger (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tradesperson_id TEXT NOT NULL REFERENCES tradespeople(id) ON DELETE CASCADE,
  delta           INTEGER NOT NULL,
  balance_after   INTEGER NOT NULL,
  reason          credit_reason NOT NULL,
  note            TEXT,
  job_id          TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  payment_id      TEXT REFERENCES payments(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credit_ledger_tradie_idx ON credit_ledger (tradesperson_id, created_at DESC);

-- ── messages ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_id       TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_job_idx       ON messages (job_id, created_at);
CREATE INDEX IF NOT EXISTS messages_recipient_idx ON messages (recipient_id, is_read);

-- ── notifications ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  kind       TEXT NOT NULL DEFAULT 'general',
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, is_read, created_at DESC);

-- ── Homegirls network ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS homegirls_members (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tradesperson_id  TEXT NOT NULL UNIQUE REFERENCES tradespeople(id) ON DELETE CASCADE,
  status           homegirls_status NOT NULL DEFAULT 'PENDING',
  joined_at        TIMESTAMPTZ,
  approved_by      TEXT,
  intro            TEXT,
  mentor_available BOOLEAN NOT NULL DEFAULT FALSE,
  seeking_mentor   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS homegirls_members_status_idx ON homegirls_members (status);
DROP TRIGGER IF EXISTS homegirls_members_updated_at ON homegirls_members;
CREATE TRIGGER homegirls_members_updated_at BEFORE UPDATE ON homegirls_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS homegirls_posts (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  author_id  TEXT REFERENCES tradespeople(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'noticeboard',
  is_pinned  BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS homegirls_posts_category_idx ON homegirls_posts (category, created_at DESC);
DROP TRIGGER IF EXISTS homegirls_posts_updated_at ON homegirls_posts;
CREATE TRIGGER homegirls_posts_updated_at BEFORE UPDATE ON homegirls_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── admin plumbing ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  label      TEXT,
  "group"    TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  actor_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  detail      TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx   ON audit_log (actor_id);

CREATE TABLE IF NOT EXISTS contact_enquiries (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  subject    TEXT,
  message    TEXT NOT NULL,
  suburb     TEXT,
  is_handled BOOLEAN NOT NULL DEFAULT FALSE,
  handled_at TIMESTAMPTZ,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_enquiries_handled_idx ON contact_enquiries (is_handled, created_at DESC);

-- ── Upgrades ────────────────────────────────────────────────────────────────
--  Applied to databases created before a column was introduced. Harmless on a
--  fresh install, where the CREATE TABLE above already declares them.

ALTER TABLE tradespeople ADD COLUMN IF NOT EXISTS stripe_charges_enabled   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tradespeople ADD COLUMN IF NOT EXISTS stripe_payouts_enabled   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tradespeople ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tradespeople ADD COLUMN IF NOT EXISTS stripe_requirements      TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE tradespeople ADD COLUMN IF NOT EXISTS stripe_onboarded_at      TIMESTAMPTZ;
ALTER TABLE tradespeople ADD COLUMN IF NOT EXISTS stripe_account_synced_at TIMESTAMPTZ;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS transfer_group         TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS destination_account_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transfer_status        TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transferred_at         TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transfer_error         TEXT;

CREATE INDEX IF NOT EXISTS payments_transfer_status_idx ON payments (transfer_status)
  WHERE transfer_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS tradespeople_payouts_idx ON tradespeople (stripe_payouts_enabled);
