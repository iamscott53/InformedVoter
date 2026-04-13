-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS) Policies — InformedVoter
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Architecture:
--   All data access goes through the Next.js API layer via Prisma, which
--   connects as the `postgres` superuser role. That role bypasses RLS
--   automatically, so enabling RLS here does NOT break the application.
--
-- Threat mitigated:
--   Without RLS, anyone holding the Supabase project URL + anon key can
--   read/write every table directly via the PostgREST API. This migration
--   locks that down.
--
-- Policy design:
--   ┌─────────────────────────────┬──────────────────────────────────────┐
--   │ Table group                 │ Policy                               │
--   ├─────────────────────────────┼──────────────────────────────────────┤
--   │ Public civic data (17 tbl)  │ SELECT only for anon + authenticated │
--   │ User PII (User, UserBookmark│ No access — fully locked down        │
--   └─────────────────────────────┴──────────────────────────────────────┘
--
-- How to apply:
--   1. Open the Supabase Dashboard → SQL Editor
--   2. Paste and run this entire file
--   OR
--   3. Run via CLI: supabase db execute --file supabase/rls-policies.sql
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- 1. Enable RLS on ALL tables
-- ───────────────────────────────────────────────────────────────────────────

-- Public civic data
ALTER TABLE "State"                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Candidate"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidatePolicy"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bill"                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillVote"                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BillCosponsor"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Election"                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoterInfo"                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VoterInfoDeadline"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateFinance"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateTopDonor"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateTopIndustry"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateContributionBySize"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateContributionByState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CandidateExpenditure"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IndependentExpenditure"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StatePollingLocator"          ENABLE ROW LEVEL SECURITY;

-- Sensitive user data
ALTER TABLE "User"                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserBookmark"                 ENABLE ROW LEVEL SECURITY;


-- ───────────────────────────────────────────────────────────────────────────
-- 2. Public civic data — read-only for anon / authenticated roles
--    No INSERT / UPDATE / DELETE policies → writes are blocked for all
--    non-superuser roles.
-- ───────────────────────────────────────────────────────────────────────────

CREATE POLICY "public_read_state"
  ON "State" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_candidate"
  ON "Candidate" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_candidate_policy"
  ON "CandidatePolicy" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_bill"
  ON "Bill" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_bill_vote"
  ON "BillVote" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_bill_cosponsor"
  ON "BillCosponsor" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_election"
  ON "Election" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_voter_info"
  ON "VoterInfo" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_voter_info_deadline"
  ON "VoterInfoDeadline" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_candidate_finance"
  ON "CandidateFinance" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_candidate_top_donor"
  ON "CandidateTopDonor" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_candidate_top_industry"
  ON "CandidateTopIndustry" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_contribution_by_size"
  ON "CandidateContributionBySize" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_contribution_by_state"
  ON "CandidateContributionByState" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_candidate_expenditure"
  ON "CandidateExpenditure" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_independent_expenditure"
  ON "IndependentExpenditure" FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "public_read_state_polling_locator"
  ON "StatePollingLocator" FOR SELECT
  TO anon, authenticated
  USING (true);


-- ───────────────────────────────────────────────────────────────────────────
-- 3. User PII tables — no policies added
--
--    "User" and "UserBookmark" contain email addresses and personal
--    preferences. With RLS enabled and NO policies defined, ALL access via
--    the anon / authenticated role is denied by default (PostgreSQL's
--    default-deny behaviour).
--
--    The Prisma backend connects as the `postgres` superuser which bypasses
--    RLS, so the application continues to work normally.
--
--    If Supabase Auth is integrated in the future, add scoped policies here:
--
--      CREATE POLICY "user_own_row" ON "User"
--        FOR ALL TO authenticated
--        USING (auth.uid()::text = id::text);
--
--      CREATE POLICY "user_own_bookmarks" ON "UserBookmark"
--        FOR ALL TO authenticated
--        USING (auth.uid()::text = "userId"::text);
-- ───────────────────────────────────────────────────────────────────────────

-- (no policies intentionally — default deny)


-- ───────────────────────────────────────────────────────────────────────────
-- 3b. Subscriber table — PII (emails), fully locked down
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE "Subscriber" ENABLE ROW LEVEL SECURITY;
-- No policies: default deny. All access goes through Prisma (postgres superuser).


-- ───────────────────────────────────────────────────────────────────────────
-- 4. Verification query
--    Run this after applying the migration to confirm all tables have RLS on.
-- ───────────────────────────────────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  rowsecurity  AS rls_enabled,
  (SELECT count(*) FROM pg_policies p
   WHERE p.schemaname = c.schemaname AND p.tablename = c.tablename) AS policy_count
FROM pg_tables c
WHERE schemaname = 'public'
ORDER BY tablename;
