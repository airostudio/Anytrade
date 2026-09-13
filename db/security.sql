-- ============================================================================
--  Row Level Security
--
--  IMPORTANT: PostgREST publishes every table in `public` over HTTPS. Supabase
--  tables have RLS *disabled* by default, which means anyone holding the anon
--  key — it ships in the browser bundle, it is not a secret — could read
--  users.password, emails and phone numbers straight out of the REST API.
--
--  This applies no matter which client the app uses. Supabase publishes
--  PostgREST for every project, so the exposure exists whether you connect with
--  node-postgres, Prisma or supabase-js. AnyTrade reaches the database only
--  from the server over a normal Postgres connection, so the correct posture
--  is: RLS on everywhere and no policies at all. That denies anon and
--  authenticated outright while the server, which connects as the database
--  owner, is unaffected.
--
--  Apply this with the rest of the schema. Re-runnable.
-- ============================================================================

ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tradespeople       ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids               ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE homegirls_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE homegirls_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_enquiries  ENABLE ROW LEVEL SECURITY;

-- Belt and braces: take Supabase's default grants away from the public roles.
-- Guarded so this file also runs against a plain Postgres, which has no such
-- roles (local development, CI).
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
    END IF;
  END LOOP;
END $$;
