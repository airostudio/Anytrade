-- ============================================================================
--  STEP 2 of 2 — DESTRUCTIVE. Run db/legacy-inspect.sql first.
--
--  Removes the tables and enum types left behind by the original Prisma version
--  of this repository:
--
--      tables  "User" "Tradesperson" "Job" "JobApplication" "Review" "Payment"
--              "_prisma_migrations"
--      enums   "UserRole" "JobStatus" "ApplicationStatus" "PaymentStatus"
--
--  What it will NOT do
--    • touch any AnyTrade table (lowercase: users, jobs, bids, ...). Postgres
--      treats "User" and users as different names, so they cannot be confused
--    • touch anything it does not recognise by exact name
--    • delete rows you might want: if any legacy table holds data it STOPS and
--      tells you, unless you set v_allow_data_loss to true below
--
--  Dropped data cannot be recovered. If the inspect step showed rows you care
--  about, take a backup first (Supabase → Database → Backups, or the scheduled
--  backup workflow in .github/workflows/db-backup.yml).
-- ============================================================================

DO $$
DECLARE
  -- Flip to true ONLY if the inspect step showed legacy rows you are happy to lose.
  v_allow_data_loss constant boolean := false;

  legacy_tables constant text[] := ARRAY[
    'JobApplication', 'Review', 'Payment', 'Job', 'Tradesperson', 'User', '_prisma_migrations'
  ];
  legacy_types constant text[] := ARRAY[
    'ApplicationStatus', 'PaymentStatus', 'JobStatus', 'UserRole'
  ];

  t text;
  n bigint;
  total_rows bigint := 0;
  populated text := '';
BEGIN
  -- Pass 1: look, don't touch. Count rows in every legacy table that exists.
  FOREACH t IN ARRAY legacy_tables LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM public.%I', t) INTO n;
      total_rows := total_rows + n;
      IF n > 0 THEN
        populated := populated || format('%s (%s rows), ', t, n);
      END IF;
    END IF;
  END LOOP;

  IF total_rows > 0 AND NOT v_allow_data_loss THEN
    RAISE EXCEPTION
      'Stopped: legacy tables still hold data: %. Nothing was dropped. If you are sure you do not need it, set v_allow_data_loss to true at the top of this file and run it again.',
      rtrim(populated, ', ');
  END IF;

  -- Pass 2: drop. Child tables are listed first; CASCADE covers the foreign keys
  -- between the legacy tables themselves.
  FOREACH t IN ARRAY legacy_tables LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('DROP TABLE public.%I CASCADE', t);
    END IF;
  END LOOP;

  -- Enums last. No CASCADE: if some other table still uses one, leave it alone.
  FOREACH t IN ARRAY legacy_types LOOP
    BEGIN
      EXECUTE format('DROP TYPE IF EXISTS public.%I', t);
    EXCEPTION WHEN dependent_objects_still_exist THEN
      RAISE NOTICE 'Kept type "%": something still depends on it.', t;
    END;
  END LOOP;
END $$;

-- Shown after the block runs: what is left. You should see only the 14 AnyTrade
-- tables, plus any UNKNOWN ones the inspect step flagged, which this file never touches.
SELECT table_name
  FROM information_schema.tables
 WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
 ORDER BY table_name;
