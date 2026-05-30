# 05 — Frontend

> **Last Updated:** 2026-05-30

---

## Page Map

### Global / Static Pages

| Page | Route | Key Features | Component Type |
|------|-------|--------------|----------------|
| Homepage | `/` | Interactive US map (`USStateMap`), state selector, `FederalAgenciesSection`, `HomepageLinks` | Static |
| About | `/about` | Mission statement, methodology, data sources | ISR |
| Contact | `/contact` | Contact form | ISR |
| Privacy | `/privacy` | Privacy policy | ISR |

### Federal Legislative

| Page | Route | Key Features | Component Type |
|------|-------|--------------|----------------|
| Bills | `/bills` | Paginated bill listing (25/page), status badges, sponsor info | Server |
| Bill Detail | `/state/[stateAbbr]/bills/[billId]` | Full text link, AI summary (`executiveSummary`), rider analysis (`hiddenClauses`), vote record, timeline | Server |

### Candidates & Elections

| Page | Route | Key Features | Component Type |
|------|-------|--------------|----------------|
| Candidate | `/candidate/[candidateId]` | Profile, policy positions (`PolicyAccordion`), finance summary (cycle selector, top donors, expenditures), sponsored bills, contact info | Server |
| Compare | `/compare` | Side-by-side candidate comparison table. Fetches `/api/candidates`, lets user select 2–4 candidates, compares policy positions across 10 categories | Client |
| Elections | `/elections` | Nationwide upcoming elections grouped by month | Server |
| PAC Recipients | `/pac-recipients` | Static `PAC_CATALOG` grouped by category | Static |
| PAC Detail | `/pac-recipients/[slug]` | Static PAC metadata + `PacRecipientsTable` (client-fetched from `/api/pac-recipients`) | Server + Client |

### Judicial

| Page | Route | Key Features | Component Type |
|------|-------|--------------|----------------|
| SCOTUS Dashboard | `/judicial` | Active justices, pending cases, recent decisions, gift count | Server |
| Case Detail | `/judicial/cases/[...slug]` | Facts, question, conclusion, AI summary (`aiSummary`, `aiImpactAnalysis`), majority/minority vote breakdown | Server |
| Justice Profile | `/judicial/justices/[slug]` | Biography, ideology score, voting stats, financial disclosures (PDF links), gifts (50), reimbursements (50), investments (20) | Server |

### State Hubs

All state pages use `force-dynamic` to emit real 404s for invalid state abbreviations.

| Page | Route | Key Features |
|------|-------|--------------|
| State Overview | `/state/[stateAbbr]` | Senators, reps, governor cards, quick stats, links to sub-pages |
| Senators | `/state/[stateAbbr]/senators` | Deduplicated by bioguideId, recent votes, policy positions |
| Representatives | `/state/[stateAbbr]/representatives` | District badges, party breakdown stats |
| Governor | `/state/[stateAbbr]/governor` | Term dates, biography, policy positions |
| State Bills | `/state/[stateAbbr]/bills` | URL-driven filter bar (search, chamber, status, subject), pagination |
| State Elections | `/state/[stateAbbr]/elections` | Days-until counter, election type labels |
| Voter Info | `/state/[stateAbbr]/voter-info` | Registration deadlines, polling hours, ID requirements, early voting, absentee ballots |
| State Legislature | `/state/[stateAbbr]/state-legislature` | State legislative hub |

### Local Government

| Page | Route | Key Features | Component Type |
|------|-------|--------------|----------------|
| Local Hub | `/local` | City/zip search form, `SubmitMeetingForm`, nearby meetings | Client |
| Speaking Rules | `/local/rules` | First Amendment case law, recording rights, professional vs assertive approaches | Server |
| Templates | `/local/templates` | Pre-built scripts (surveillance, data centers, zoning, police budgets) with professional/assertive tone toggle | Client |
| City Detail | `/local/city/[id]` | City hall address (Google Maps link), council location, upcoming meetings with agenda items | Server |
| Meeting Detail | `/local/meeting/[id]` | Agenda items, AI-generated speaking templates via `/api/local/template`, restrictions | Client |

### Utilities

| Page | Route | Key Features | Component Type |
|------|-------|--------------|----------------|
| Agencies | `/agencies` | Grid of `FEDERAL_AGENCIES` with category filter chips | Static |
| Agency Detail | `/agencies/[slug]` | Static catalog + live budget from USAspending.gov (cached 24h) + related bills | Server |
| Polling Places | `/polling-places` | Address-based lookup using Google Civic API | Client |
| Voter Info (global) | `/voter-info` | Nationwide basics; CTA to pick state | Static |

---

## Component Hierarchy

```
RootLayout
├── Providers (TanStack Query)
│   └── QueryClientProvider
├── Header
│   └── Navigation (mobile slide-out drawer)
├── StateRequiredBanner
├── <main id="main-content">
│   └── (route-specific page)
│       └── (feature sections)
│           └── (UI components)
├── Footer
└── SubscribeBottomBar
```

---

## Layout Components (`src/components/layout/`)

| Component | File | Purpose |
|-----------|------|---------|
| `Header` | `Header.tsx` | Sticky header with logo, desktop nav (7 links), mobile hamburger, `StateSelector`. Uses Framer Motion `layoutId` for active-page pill animation. Adds shadow on scroll. |
| `Navigation` | `Navigation.tsx` | Mobile slide-out drawer (right side) with backdrop blur. Animated with Framer Motion. Same state-prefix logic as Header. Closes on Escape, route change, or backdrop click. Traps focus and disables body scroll. |
| `Footer` | `Footer.tsx` | Three-column footer: brand/tagline, navigate links, data source attributions. Nonpartisan disclaimer and AI-assisted content notice. |

---

## Feature Components (`src/components/features/`)

| Component | File | Purpose |
|-----------|------|---------|
| `USStateMap` | `USStateMap.tsx` | Interactive SVG map using path data from `@/data/us-states`. Hover tooltips, click-to-navigate, keyboard accessible. Selected state highlighted green. Includes searchable dropdown alternative. |
| `AnimatedCards` | `AnimatedCards.tsx` | Framer Motion grid of link cards. Staggered entrance animation. Accepts `CardItem[]` with icon names, colors, and hrefs. |
| `AnimatedSection` | `AnimatedSection.tsx` | Simple fade-up wrapper with configurable delay. Used for page sections. |
| `BallotAddressInput` | `BallotAddressInput.tsx` | Address lookup form hitting `/api/polling-places`. Shows election info, polling locations, or fallback messages. Links to vote.org. |
| `BillDetailTabs` | `BillDetailTabs.tsx` | Four-tab interface: Overview (AI summary + status timeline + sponsor), Hidden Clauses & Riders (severity-coded cards), Vote Results (House floor totals + party breakdown bars), Full Text (CTA to Congress.gov). |
| `BillsFilterBar` | `BillsFilterBar.tsx` | URL-driven filter bar. Search, chamber, status, subject dropdowns. Pushes to router with query params and resets page to 1. |
| `CandidateTabs` | `CandidateTabs.tsx` | Four-tab interface: Policy Positions (`PolicyAccordion`), Voting Record (YES/NO/ABSTAIN badges), Campaign Finance (cycle selector, summary cards, donor breakdown, top donors, spending bars), Contact (phone/email/website). |
| `CompareTable` | `CompareTable.tsx` | Side-by-side candidate comparison. Fetches `/api/candidates`, lets user select 2–4 candidates, renders grid comparing policy positions across 10 categories. Expandable rows show AI summary. |
| `DemographicSurveyModal` | `DemographicSurveyModal.tsx` | Three-step modal (About You → Background → Civic Engagement) posting to `/api/subscribe/demographics`. Custom `RadioGroup` and `MultiSelect` sub-components. Triggered after email subscription. |
| `DistrictFinder` | `DistrictFinder.tsx` | Address form hitting `/api/district-lookup`. Displays congressional district and representative. |
| `FederalAgenciesSection` | `FederalAgenciesSection.tsx` | Grid of agency cards from `FEDERAL_AGENCIES` with category filter chips and "Show All" toggle. |
| `HomepageLinks` | `HomepageLinks.tsx` | Three exported sections: `ExploreStateButton`, `QuickActions` (uses `AnimatedCards`), `VoterEssentials` (4-card grid). Respects `useUserState`. |
| `PacRecipientsTable` | `PacRecipientsTable.tsx` | Data table for PAC contributions. Fetches `/api/pac-recipients` with server-side sorting, chamber/party/cycle filters, client-side name search. Expandable rows with individual contributions. |
| `PolicyAccordion` (features) | `features/PolicyAccordion.tsx` | Simpler accordion used inside `CandidateTabs`. Category, stance badge, summary, details. |
| `PollingPlaceFinder` | `PollingPlaceFinder.tsx` | Full polling place search. Hits `/api/polling-places`, displays polling places, early vote sites, drop-off locations with hours, badges, and "Get Directions" links. |
| `StateDetector` | `StateDetector.tsx` | Prominent state-selection prompt. If state chosen, shows it with "Change state" dropdown. If not, shows large "Choose Your State" dropdown. |
| `StateRequiredBanner` | `StateRequiredBanner.tsx` | Thin amber banner when `userState` is null, prompting state selection. |
| `SubscribeBottomBar` | `SubscribeBottomBar.tsx` | Fixed bottom email capture bar. Appears after 30s or 50% scroll. Uses 30-day dismiss cookie. Posts to `/api/subscribe`. Triggers `DemographicSurveyModal` on success. |
| `SubscribeForm` | `SubscribeForm.tsx` | Standalone email subscription form. Three variants (`default`, `compact`, `dark`). Used on state pages. Triggers survey modal on success. |

---

## UI Components (`src/components/ui/`)

| Component | File | Purpose |
|-----------|------|---------|
| `PartyBadge` | `PartyBadge.tsx` | Colored pill for party codes (`D` → blue, `R` → red, `I` → purple, `G` → green, `L` → amber). Supports `showFullName`, `showDot`, `xs/sm/md` sizes. |
| `BillStatusBadge` | `BillStatusBadge.tsx` | Rich badges with icons for `BillStatus` (`SIGNED` → green checkmark, `VETOED` → red X, etc.). `xs/sm/md` sizes, `showIcon` prop. |
| `CandidateCard` | `CandidateCard.tsx` | Card with photo (or initials avatar), name, `PartyBadge`, office label, state, bio snippet, links to profile/website. Supports `compact` mode. |
| `StateSelector` | `StateSelector.tsx` | Dropdown of all 50 states (with FIPS codes) using `useUserState`. On change writes cookie and navigates to `/state/{abbr}`. `compact` variant for header. |
| `AiDisclaimer` | `AiDisclaimer.tsx` | Three variants (`banner`, `inline`, `compact`) disclosing AI-generated content. Links to `/about#ai-methodology`. |
| `RiderAlertBadge` | `RiderAlertBadge.tsx` | Three variants (`badge`, `inline`, `banner`) for legislative riders. Shows count and description. Banner is dismissible. |
| `DataSourceBadge` | `DataSourceBadge.tsx` | Verification freshness indicator: ≤7 days = green, ≤30 days = amber, older = red. |
| `PolicyAccordion` (ui) | `ui/PolicyAccordion.tsx` | Rich accordion for policy positions. Category pill, title, summary, supporters/critics side-by-side, AI analysis block with `AiDisclaimer`, source links. Supports `defaultOpenFirst` and `allowMultiple`. |

---

## SEO Components (`src/components/seo/`)

| Component | File | Purpose |
|-----------|------|---------|
| `JsonLd` | `JsonLd.tsx` | Generic `<script type="application/ld+json">` injector. |
| `SiteJsonLd` | `JsonLd.tsx` | Organization + WebSite schema for root layout. |
| `BreadcrumbJsonLd` | `JsonLd.tsx` | BreadcrumbList schema builder. |
| `AgencyJsonLd` | `JsonLd.tsx` | GovernmentOrganization schema for agency pages. |
| `PersonJsonLd` | `JsonLd.tsx` | Person schema for SCOTUS justice profiles. |

---

## State Management Details

### TanStack Query
- **File:** `src/app/providers.tsx`
- Default config: `staleTime: 5 minutes`, `gcTime: 10 minutes`, `retry: 1`
- Used in client components that fetch from API routes (`CompareTable`, `PacRecipientsTable`, `MeetingPage`, etc.)

### Cookie-Based State Persistence
- **Hook:** `src/hooks/useUserState.ts`
- Reads/writes `selected-state` cookie (1-year expiry, `SameSite=Lax`, `Secure` on HTTPS)
- Starts `null` on both server and client to avoid hydration mismatches, then reads cookie in `useEffect`
- **Critical:** Many components depend on this: `Header`, `Navigation`, `StateSelector`, `StateDetector`, `StateRequiredBanner`, `HomepageLinks`, `SubscribeBottomBar`

---

## Styling Approach

### Tailwind CSS v4
- **Entry:** `src/app/globals.css` imports `@import "tailwindcss"`
- **PostCSS:** `postcss.config.mjs` uses `@tailwindcss/postcss`
- No `tailwind.config.js` — v4 uses CSS-based configuration in `globals.css`
- Utilities preferred for layout; custom properties for palette and typography

### CSS Custom Properties
Defined in `:root` inside `globals.css`:
- Color palette (primary blues, semantic colors)
- Typography scale
- Spacing tokens

### Design Tokens
- **Primary brand color:** `#1B2A4A` (deep navy)
- **Headings:** Serif font for authority/trust
- **Focus states:** `focus-visible` outlines for accessibility
- **Icons:** Lucide React (exclusive icon library)

---

## Key User Flows

### 1. Discover Your Representatives
1. User lands on homepage → sees `USStateMap`
2. Clicks their state → navigates to `/state/[stateAbbr]`
3. Views senators, representatives, governor cards
4. Clicks a candidate → `/candidate/[candidateId]` for full profile with tabs

### 2. Research a Bill
1. User navigates to `/bills` or `/state/[stateAbbr]/bills`
2. Uses `BillsFilterBar` to filter by status, chamber, date
3. Clicks a bill → bill detail page
4. Reads AI-generated `executiveSummary` and `detailedSummary`
5. Checks `RiderAlertBadge` for hidden clauses
6. Reviews vote totals and party breakdown in Vote Results tab

### 3. Attend a Local Meeting
1. User navigates to `/local`
2. Searches city/zip → `/local/city/[id]`
3. Views upcoming `LocalMeeting` list
4. Clicks a meeting → `/local/meeting/[id]`
5. Reviews agenda items, clicks "Generate Template" for AI speaking script
6. Copies template to clipboard

### 4. Subscribe to Digests
1. User enters email in `SubscribeForm` (bottom bar or homepage)
2. POST `/api/subscribe` → verification email sent via Resend
3. User clicks verify link → `Subscriber.verified = true`
4. Optional: `DemographicSurveyModal` collects profile data
5. Daily digest cron sends personalized emails by state/topic

### 5. Compare Candidates
1. User navigates to `/compare`
2. Client fetches candidates from `/api/candidates`
3. User selects 2–4 candidates from dropdown
4. `CompareTable` renders side-by-side grid across 10 policy categories
5. Expandable rows reveal AI summary text
