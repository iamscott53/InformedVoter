# 03 — Data Model

> **Last Updated:** 2026-06-05

---

## Prisma Schema Summary

**File:** `prisma/schema.prisma`  
**Database:** PostgreSQL 16  
**ORM:** Prisma 5.22

---

## Enums

| Enum | Values |
|------|--------|
| `OfficeType` | `PRESIDENT`, `US_SENATOR`, `US_REPRESENTATIVE`, `GOVERNOR`, `STATE_SENATOR`, `STATE_REP`, `OTHER` |
| `PolicyCategory` | `ECONOMY`, `HEALTHCARE`, `EDUCATION`, `IMMIGRATION`, `ENVIRONMENT`, `GUN_POLICY`, `FOREIGN_POLICY`, `CRIMINAL_JUSTICE`, `HOUSING`, `OTHER` |
| `Chamber` | `HOUSE`, `SENATE` |
| `BillStatus` | `INTRODUCED`, `IN_COMMITTEE`, `PASSED_HOUSE`, `PASSED_SENATE`, `SIGNED`, `VETOED`, `FAILED` |
| `VoteChoice` | `YES`, `NO`, `ABSTAIN`, `NOT_VOTING` |
| `ElectionType` | `PRIMARY`, `GENERAL`, `SPECIAL`, `RUNOFF` |
| `BookmarkEntityType` | `BILL`, `CANDIDATE` |
| `DonorType` | `INDIVIDUAL`, `PAC`, `PARTY`, `COMMITTEE` |
| `ContributionSizeRange` | `UNDER_200`, `R200_TO_499`, `R500_TO_999`, `R1000_TO_2999`, `R3000_PLUS` |
| `ExpenditureCategory` | `MEDIA`, `PAYROLL`, `TRAVEL`, `CONSULTING`, `FUNDRAISING`, `OTHER` |
| `SupportOrOppose` | `SUPPORT`, `OPPOSE` |
| `DeadlineType` | `REGISTRATION`, `EARLY_VOTING_START`, `EARLY_VOTING_END`, `ABSENTEE_REQUEST`, `ABSENTEE_RETURN`, `ELECTION_DAY` |
| `SubscriberTopic` | `BILLS`, `ELECTIONS`, `SCOTUS` |
| `CaseStatus` | `GRANTED`, `ARGUED`, `DECIDED` |

---

## Entity Relationship Diagram (Text)

```
State
├── Candidate[]
├── Bill[]
├── Election[]
├── VoterInfo? (1:1)
├── User[]
└── StatePollingLocator? (1:1)

Candidate
├── State? (belongs to)
├── CandidatePolicy[]
├── Bill[] (sponsored)
├── BillVote[]
├── BillCosponsor[]
├── CandidateFinance[]
├── IndependentExpenditure[]
├── PacContribution[]
└── UserBookmark[]

Bill
├── State?
├── Candidate? (sponsor)
├── BillVote[]
└── BillCosponsor[]

Election
├── State?
└── VoterInfoDeadline[]

VoterInfo
├── State (1:1)
└── VoterInfoDeadline[]

User
├── State?
└── UserBookmark[]

CandidateFinance
├── Candidate
├── CandidateTopDonor[]
├── CandidateTopIndustry[]
├── CandidateContributionBySize[]
├── CandidateContributionByState[]
└── CandidateExpenditure[]

Justice
├── CaseVote[]
├── JusticeGift[]
├── JusticeReimbursement[]
├── JusticeInvestment[]
└── JusticeFinancialDisclosure[]

CourtCase
└── CaseVote[]

CaseVote
├── CourtCase
└── Justice

Committee
└── PacContribution[]

PacContribution
├── Candidate
└── Committee

Municipality
└── LocalMeeting[]

LocalMeeting
├── Municipality
└── MeetingAgendaItem[]

MeetingAgendaItem
└── LocalMeeting

Subscriber (standalone)
DataSyncLog (standalone)
SubmittedMeeting (standalone)
```

---

## Key Models

### `Candidate`
Stores elected officials and candidates. Key fields:
- `name`, `party`, `photoUrl`, `officeType`, `district`
- `contactInfo` (Json), `socialMedia` (Json)
- `fecCandidateId` — for direct FEC lookups
- `lastVerifiedAt` — cross-check timestamp

Relations: `state`, `policies`, `sponsoredBills`, `billVotes`, `billCosponsorships`, `finance`, `independentExpenditures`, `pacContributions`, `bookmarks`

### `Bill`
Legislation at federal and state levels:
- `externalId` (unique), `title`, `shortTitle`, `chamber`, `status`
- `executiveSummary`, `detailedSummary`, `aiRiderAnalysis` — AI-generated fields
- `hiddenClauses` (Json) — flagged unrelated provisions
- `sponsorId` → `Candidate`

Relations: `state`, `sponsor`, `votes`, `cosponsors`

### `CourtCase`
SCOTUS cases from Oyez:
- `oyezId` (unique), `docketNumber`, `term`
- `question`, `factsOfTheCase`, `conclusion` — HTML from Oyez
- `aiSummary`, `aiImpactAnalysis` — AI-generated fields
- `decisionDirection` — ideological leaning

Relations: `votes`

### `Justice`
SCOTUS justices:
- `oyezIdentifier` (unique), `courtListenerId` (unique)
- `name`, `firstName`, `lastName`, `dateOfBirth`, `gender`, `photoUrl`
- `biography`, `lawSchool`, `appointingPresident`, `partyOfPresident`
- `roleTitle`, `dateStart`, `dateEnd`, `isActive`
- `ideologyScore` — Oyez average (negative = liberal, positive = conservative)

Relations: `votes`, `gifts`, `reimbursements`, `investments`, `financialDisclosures`

### `Municipality` / `LocalMeeting` / `MeetingAgendaItem`
Local government coverage:
- `Municipality` — city metadata, Legistar/CivicPlus client IDs, zipCodes[]
- `LocalMeeting` — upcoming council meetings with agenda text, restrictions, location
- `MeetingAgendaItem` — individual agenda items with optional `templatePrompt` for AI speaking templates

### `Subscriber`
Email subscription system with optional demographic profiling:
- `email` (unique), `stateAbbr`, `topics[]`, `verificationToken`, `unsubscribeToken`
- Demographics: `partyAffiliation`, `ageRange`, `ethnicity`, `gender`, `zipCode`, `educationLevel`, `issuesOfInterest[]`, `communityService`, `votingFrequency`, `referralSource`

### `DataSyncLog`
Audit log for all sync jobs:
- `syncType`, `status` (success/partial/failed)
- `recordsTotal`, `recordsSynced`, `recordsFailed`, `durationMs`
- `errorMessage`, `metadata` (Json)

---

## Data Lifecycle Patterns

### Create
- Sync jobs (cron) create records from external APIs using upsert patterns.
- User submissions (`/api/local/meetings/submit`) create `SubmittedMeeting` records pending approval.
- Subscriptions create `Subscriber` with unverified status.
- Seeds (`prisma/seed.ts`, `seed-governors.mjs`, `seed-elections.mjs`) initialize base data.

### Read
- Public pages query via Prisma in Server Components or API routes.
- TanStack Query caches API responses on the client.
- Rate-limited API endpoints protect against abuse.

### Update
- Cron syncs update existing records with `lastVerifiedAt` or `updatedAt`.
- AI analysis jobs populate `aiSummary`, `executiveSummary`, etc.
- Subscriber verification updates `verified`, `verifiedAt`.

### Delete
- Soft deletion is **not** implemented — records are removed directly.
- `MeetingAgendaItem` uses `onDelete: Cascade` when a `LocalMeeting` is deleted.
- `Subscriber` deletion via unsubscribe token.

---

## Indexing Strategy

Prisma `@@index` annotations are used on:
- All foreign keys (`stateId`, `candidateId`, `billId`, `justiceId`, etc.)
- Frequently filtered columns (`status`, `chamber`, `officeType`, `party`, `isActive`, `term`, `date`, `electionType`)
- Unique constraints for deduplication (`externalId`, `oyezId`, `fecCommitteeId`, `fecCandidateId+cycle`, etc.)

---

## Currency Storage

All monetary fields use `Decimal @db.Decimal(18, 2)` to avoid floating-point errors:
- `CandidateFinance.totalRaised`, `totalSpent`, `cashOnHand`, etc.
- `CandidateTopDonor.totalAmount`
- `PacContribution.amount`
- `IndependentExpenditure.amount`

---

## Seed Files

| File | What It Seeds |
|------|--------------|
| `prisma/seed.ts` | 50 US States, 6 sample senators (CA/TX/NY), 3 sample bills with mock AI analysis, VoterInfo for CA & TX |
| `prisma/seed-governors.mjs` | All 50 US governors (as of April 2026) with party, term dates. Uses `DIRECT_URL` env var |
| `prisma/seed-elections.mjs` | 2026 General Election (Nov 3) for all states + Primary elections for states with known dates. Creates `VoterInfoDeadline` rows |
