-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS) Policies — InformedVoter / KnowYourGov
-- ═══════════════════════════════════════════════════════════════════════════
--
-- This file is the single source of truth for RLS on every public table.
-- It is idempotent — re-running it is safe.
--
-- Architecture
--   All application queries go through Next.js API routes using Prisma,
--   which connects as the `postgres` role. `postgres` has `bypassrls=true`,
--   so enabling RLS here does not break the application.
--
-- Threat model
--   `anon` and `authenticated` roles are automatically granted DML on every
--   public table when the table is created (Supabase default). Without RLS,
--   anyone holding the Supabase publishable key could read/write every row
--   directly via PostgREST. RLS converts the default-allow into default-deny.
--
-- Policy design
--   ┌─────────────────────────────────────┬──────────────────────────────┐
--   │ Table group                         │ Policy                       │
--   ├─────────────────────────────────────┼──────────────────────────────┤
--   │ Public civic / finance / SCOTUS     │ SELECT-only for anon, auth'd │
--   │ PII (User, UserBookmark, Subscriber)│ No policies → default-deny   │
--   │ Ops (DataSyncLog)                   │ No policies → default-deny   │
--   └─────────────────────────────────────┴──────────────────────────────┘
--
-- How to apply
--   Option A (dashboard): Supabase Dashboard → SQL Editor → paste & run.
--   Option B (CLI):       supabase db execute --file supabase/rls-policies.sql
--   Option C (psql):      psql "$DIRECT_URL" -f supabase/rls-policies.sql
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- 1. Enable RLS on every table in the public schema
-- ───────────────────────────────────────────────────────────────────────────

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 2. Public civic data — SELECT-only for anon + authenticated
-- ───────────────────────────────────────────────────────────────────────────

-- Drop-then-create pattern keeps this idempotent.

DROP POLICY IF EXISTS "public_read_state"                       ON "State";
DROP POLICY IF EXISTS "public_read_candidate"                   ON "Candidate";
DROP POLICY IF EXISTS "public_read_candidate_policy"            ON "CandidatePolicy";
DROP POLICY IF EXISTS "public_read_bill"                        ON "Bill";
DROP POLICY IF EXISTS "public_read_bill_vote"                   ON "BillVote";
DROP POLICY IF EXISTS "public_read_bill_cosponsor"              ON "BillCosponsor";
DROP POLICY IF EXISTS "public_read_election"                    ON "Election";
DROP POLICY IF EXISTS "public_read_voter_info"                  ON "VoterInfo";
DROP POLICY IF EXISTS "public_read_voter_info_deadline"         ON "VoterInfoDeadline";
DROP POLICY IF EXISTS "public_read_candidate_finance"           ON "CandidateFinance";
DROP POLICY IF EXISTS "public_read_candidate_top_donor"         ON "CandidateTopDonor";
DROP POLICY IF EXISTS "public_read_candidate_top_industry"      ON "CandidateTopIndustry";
DROP POLICY IF EXISTS "public_read_contribution_by_size"        ON "CandidateContributionBySize";
DROP POLICY IF EXISTS "public_read_contribution_by_state"       ON "CandidateContributionByState";
DROP POLICY IF EXISTS "public_read_candidate_expenditure"       ON "CandidateExpenditure";
DROP POLICY IF EXISTS "public_read_independent_expenditure"     ON "IndependentExpenditure";
DROP POLICY IF EXISTS "public_read_state_polling_locator"       ON "StatePollingLocator";
DROP POLICY IF EXISTS "public_read_committee"                   ON "Committee";
DROP POLICY IF EXISTS "public_read_pac_contribution"            ON "PacContribution";
DROP POLICY IF EXISTS "public_read_justice"                     ON "Justice";
DROP POLICY IF EXISTS "public_read_court_case"                  ON "CourtCase";
DROP POLICY IF EXISTS "public_read_case_vote"                   ON "CaseVote";
DROP POLICY IF EXISTS "public_read_justice_financial_disclosure" ON "JusticeFinancialDisclosure";
DROP POLICY IF EXISTS "public_read_justice_gift"                ON "JusticeGift";
DROP POLICY IF EXISTS "public_read_justice_investment"          ON "JusticeInvestment";
DROP POLICY IF EXISTS "public_read_justice_reimbursement"       ON "JusticeReimbursement";

CREATE POLICY "public_read_state"                   ON "State"                       FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_candidate"               ON "Candidate"                   FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_candidate_policy"        ON "CandidatePolicy"             FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_bill"                    ON "Bill"                        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_bill_vote"               ON "BillVote"                    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_bill_cosponsor"          ON "BillCosponsor"               FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_election"                ON "Election"                    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_voter_info"              ON "VoterInfo"                   FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_voter_info_deadline"     ON "VoterInfoDeadline"           FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_candidate_finance"       ON "CandidateFinance"            FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_candidate_top_donor"     ON "CandidateTopDonor"           FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_candidate_top_industry"  ON "CandidateTopIndustry"        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_contribution_by_size"    ON "CandidateContributionBySize" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_contribution_by_state"   ON "CandidateContributionByState" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_candidate_expenditure"   ON "CandidateExpenditure"        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_independent_expenditure" ON "IndependentExpenditure"      FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_state_polling_locator"   ON "StatePollingLocator"         FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_committee"               ON "Committee"                   FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_pac_contribution"        ON "PacContribution"             FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_justice"                 ON "Justice"                     FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_court_case"              ON "CourtCase"                   FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_case_vote"               ON "CaseVote"                    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_justice_financial_disclosure" ON "JusticeFinancialDisclosure" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_justice_gift"            ON "JusticeGift"                 FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_justice_investment"      ON "JusticeInvestment"           FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_justice_reimbursement"   ON "JusticeReimbursement"        FOR SELECT TO anon, authenticated USING (true);


-- ───────────────────────────────────────────────────────────────────────────
-- 3. PII tables — no policies (default deny for anon / authenticated)
--    User, UserBookmark, Subscriber
--    Prisma connects as `postgres` (bypassrls=true) → app still works.
-- ───────────────────────────────────────────────────────────────────────────

-- Explicitly drop any legacy permissive policies that might have been added.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname='public' AND tablename IN ('User','UserBookmark','Subscriber','DataSyncLog')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;


-- ───────────────────────────────────────────────────────────────────────────
-- 4. Revoke dangerous grants from anon/authenticated
--    Removes TRUNCATE, REFERENCES, TRIGGER on every public table.
--    (SELECT/INSERT/UPDATE/DELETE remain granted but are gated by RLS.)
-- ───────────────────────────────────────────────────────────────────────────

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public'
  LOOP
    EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE %I FROM anon, authenticated', r.tablename);
  END LOOP;
END $$;

-- Defence-in-depth: no function execution for anon/authenticated.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Default-deny for any future tables/functions created in public schema.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL                            ON FUNCTIONS FROM anon, authenticated;


-- ───────────────────────────────────────────────────────────────────────────
-- 5. Verification
-- ───────────────────────────────────────────────────────────────────────────
-- Every public table should show rls_enabled=true.
-- Private tables (User, UserBookmark, Subscriber, DataSyncLog) should have policy_count=0.
-- Every other table should have policy_count=1.

SELECT
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_policies p
   WHERE p.schemaname='public' AND p.tablename = c.tablename) AS policy_count
FROM pg_tables c
WHERE schemaname='public'
ORDER BY tablename;
