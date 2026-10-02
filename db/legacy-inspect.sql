-- ============================================================================
--  STEP 1 of 2 — READ ONLY. Changes nothing.
--
--  Lists every table in the `public` schema, how many rows it holds, and which
--  of three groups it belongs to:
--
--    AnyTrade          this application's own tables. Never touched.
--    LEGACY (prisma)   left over from the original Prisma version of this repo.
--                      These are what db/legacy-cleanup.sql removes.
--    UNKNOWN           anything else. Never touched by the cleanup. If you see
--                      rows here, find out where they came from before deciding.
--
--  Paste the whole file into the Supabase SQL editor and run it.
--  Then read the result BEFORE running db/legacy-cleanup.sql.
-- ============================================================================

WITH tables AS (
  SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind IN ('r', 'p')        -- ordinary and partitioned tables
)
SELECT
  table_name,
  CASE
    WHEN table_name IN (
      'audit_log','bids','contact_enquiries','credit_ledger','homegirls_members',
      'homegirls_posts','jobs','messages','notifications','payments','reviews',
      'site_settings','tradespeople','users'
    ) THEN 'AnyTrade'
    WHEN table_name IN (
      'User','Tradesperson','Job','JobApplication','Review','Payment','_prisma_migrations'
    ) THEN 'LEGACY (prisma)'
    ELSE 'UNKNOWN - will not be touched'
  END AS belongs_to,
  -- Exact row count without needing a table-specific query.
  (xpath('/row/c/text()',
         query_to_xml(format('SELECT count(*) AS c FROM public.%I', table_name),
                      false, true, '')))[1]::text::bigint AS row_count
FROM tables
ORDER BY
  CASE
    WHEN table_name IN ('audit_log','bids','contact_enquiries','credit_ledger','homegirls_members',
      'homegirls_posts','jobs','messages','notifications','payments','reviews',
      'site_settings','tradespeople','users') THEN 3
    WHEN table_name IN ('User','Tradesperson','Job','JobApplication','Review','Payment','_prisma_migrations') THEN 1
    ELSE 2
  END,
  table_name;
