-- 016_lockdown_public_rls.sql
-- Lock down every table in the public schema.
-- The backend is the only database consumer and uses SUPABASE_SERVICE_ROLE_KEY.
-- Public browser/mobile clients must go through the backend API.

BEGIN;

-- 1. Enable RLS and drop every existing policy on all public tables.
DO $$
DECLARE
    tbl record;
    pol record;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    END LOOP;

    FOR pol IN
        SELECT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END
$$;

-- 2. Remove direct table/sequence/function access from public API roles.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 3. Prevent future objects from being exposed automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

COMMIT;
