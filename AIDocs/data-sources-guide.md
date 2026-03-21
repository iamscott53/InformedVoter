# InformedVoter — Data Sources: Where Everything Comes From

## CRITICAL UPDATES (as of March 2026)

Two APIs I originally recommended are **no longer available**:
- ❌ **ProPublica Congress API** — Shut down permanently
- ❌ **Google Civic Representatives API** — Turned down April 2025

The prompt has been updated below with working alternatives.

---

## DATA SOURCE MAP — What Powers Each Feature

### 1. MEMBERS OF CONGRESS (Senators + Representatives)

**Primary: Congress.gov API (v3)** — Free, Official, Active ✅
- URL: `https://api.congress.gov/v3/`
- Sign up: https://api.congress.gov/sign-up/
- Rate limit: 5,000 requests/hour
- **Provides:** All current and historical members of Congress, their bio info, 
  committee assignments, sponsored bills, and terms served
- Endpoints:
  - `/member` — list all members, filter by state, congress number, chamber
  - `/member/{bioguideId}` — individual member details
  - `/member/{bioguideId}/sponsored-legislation` — bills they sponsored
  - `/member/{bioguideId}/cosponsored-legislation` — bills they cosponsored
- **Does NOT provide:** Photos, social media, policy positions, contact info

**Supplemental: @unitedstates/congress GitHub project** — Free, Public Domain ✅
- URL: https://github.com/unitedstates/congress-legislators
- **Provides:** YAML files with every current and historical legislator including:
  - Bioguide IDs (links to Congress.gov API)
  - Official photos (via `https://bioguide.congress.gov/bioguide/photo/{bioguideId}.jpg`)
  - Social media accounts (Twitter, Facebook, YouTube)
  - Contact info (office address, phone, website, contact form URL)
  - Party affiliation history, birthday, gender
- **How to use:** Download the YAML files, parse them, and seed your database.
  These are updated regularly by the community. Sync weekly via cron job.

**For "Find Your Rep by Address":** 
- Since Google Representatives API is dead, use **Google Civic Info divisionByAddress** 
  endpoint to get OCD-IDs for an address, then cross-reference with OpenStates 
  or the unitedstates project data
- Alternative: **Cicero API** by Azavea (paid, but has a free tier for civic apps)
- Alternative: **BallotReady API** or **Ballotpedia API** (contact for access)

---

### 2. FEDERAL BILLS, VOTES & LEGISLATIVE DATA

**Primary: Congress.gov API (v3)** — Free, Official, Active ✅
- **Provides:**
  - All bills: `/bill` — filter by congress, type, status
  - Bill details: `/bill/{congress}/{type}/{number}` — title, summary, actions, status
  - Bill text: `/bill/{congress}/{type}/{number}/text` — links to full text (XML/PDF)
  - Bill subjects: `/bill/{congress}/{type}/{number}/subjects`
  - Bill amendments: `/bill/{congress}/{type}/{number}/amendments`
  - Bill cosponsors: `/bill/{congress}/{type}/{number}/cosponsors`
  - Roll call votes: NOT directly on bills — need to cross-reference actions
  - Congressional Record: `/congressional-record`
- **Provides official bill summaries** written by the Congressional Research Service (CRS)
  — these are nonpartisan and excellent. Use these as your base, supplement with AI.
- Coverage: Bills from the 81st Congress (1949) to present
- Updated: Multiple times daily

**Supplemental: Congress.gov Bulk Data (via GPO)** — Free ✅
- URL: https://www.govinfo.gov/bulkdata
- **Provides:** XML bulk downloads of bill status, bill text, congressional record
- **Use case:** Initial database seeding rather than API calls one-by-one

**For Roll Call Votes (replacing ProPublica):**
- Congress.gov API doesn't have a clean votes endpoint yet, but you can:
  1. Get bill actions, which reference roll call vote numbers
  2. Use the Senate.gov XML vote data: https://www.senate.gov/legislative/votes.htm
  3. Use the Clerk of the House roll call data: https://clerk.house.gov/Votes
  4. **VoteView** (UCLA): https://voteview.com — academic dataset with every 
     Congressional vote since 1789, downloadable as CSV. Updated regularly.

---

### 3. STATE BILLS & STATE LEGISLATORS

**Primary: Open States API (v3) / Plural Open** — Free, Active ✅
- URL: `https://v3.openstates.org/`
- Sign up: https://open.pluralpolicy.com/ (API key required, free)
- **Provides:**
  - All 50 states + DC + Puerto Rico
  - State legislators (name, party, district, chamber, contact info, photo)
  - State bills (title, text, sponsors, actions, votes, subjects)
  - Committee info
  - Legislative sessions
- Endpoints:
  - `/people` — search legislators by state, name, district
  - `/bills` — search bills by state, session, subject, keyword
  - `/jurisdictions` — list available states/jurisdictions
- **Limitations:** Data completeness varies by state. Some states have delays.
  Check their data quality dashboard.
- Bulk data also available as PostgreSQL dumps (monthly)

**Supplemental: LegiScan API** — Free tier, Active ✅
- URL: https://legiscan.com/legiscan
- Free tier: 30,000 queries/month (Pull API)
- Sign up: https://legiscan.com/legiscan-register
- **Provides:**
  - Bills from all 50 states + Congress
  - Full bill text (as encoded documents)
  - Roll call votes with individual legislator votes
  - Bill sponsors and co-sponsors
  - Amendment tracking
  - Bill status and history
  - **Full-text search** across all national legislation
- **Key advantage over Open States:** More reliable vote data, full bill text 
  access, and weekly bulk dataset downloads
- Endpoints:
  - `getSearch` — full-text search across all bills nationally
  - `getBill` — complete bill detail with text, votes, sponsors
  - `getRollCall` — individual vote results
  - `getMasterList` — all bills for a state/session (for syncing)
  - `getPerson` — legislator details
- **Use case:** This is your go-to for the "hidden clauses" feature — 
  you need the full bill text, which LegiScan provides

**Strategy: Use Both Together**
- Open States for **legislators** (better contact info, photos, districts)
- LegiScan for **bills** (better text access, vote data, search)
- Cross-reference using legislator names/IDs

---

### 4. GOVERNOR DATA

**No single API covers all governors well.** Combine:
- **Open States** — Has governor data for most states
- **Ballotpedia** (web scraping) — Best source for current governors, their 
  policies, election history. https://ballotpedia.org/Governor
- **National Governors Association** — https://www.nga.org/governors/ 
  Has current governor list with party, term dates
- **Manual curation** — For policy positions and stances, you'll need 
  AI analysis of official governor websites and press releases

---

### 5. ELECTION & VOTING INFORMATION

**Primary: Google Civic Information API** — Free, Partially Active ✅
- URL: `https://www.googleapis.com/civicinfo/v2/`
- Requires: Google API key (free)
- **Still provides (as of 2026):**
  - `elections` — list of upcoming elections
  - `voterinfo` — polling places, early vote locations, drop-off locations, 
    ballot info, election official contacts (requires address + election ID)
  - `divisions/divisionByAddress` — NEW endpoint that returns OCD-IDs for 
    an address (replacement for Representatives API)
- **No longer provides:** Representative/officeholder lookup (turned down April 2025)
- **Best for:** Polling place lookup, "what's on my ballot" features

**Supplemental: Vote.org** — Free widgets
- Voter registration status check (embeddable widget)
- Absentee ballot request tool
- Polling place locator
- URL: https://www.vote.org/technology/

**Supplemental: US Vote Foundation / Overseas Vote**
- State-by-state voter registration rules, deadlines
- https://www.usvotefoundation.org/

**Supplemental: Manual Curation per State**
- Each state's Secretary of State website has authoritative voter info
- Scrape or manually maintain: registration deadlines, ID requirements, 
  early voting dates, absentee rules
- Store in your VoterInfo database table, update weekly

---

### 6. CAMPAIGN FINANCE

**Primary: OpenFEC API (Federal Election Commission)** — Free, Official, Active ✅
- URL: `https://api.open.fec.gov/v1/`
- Sign up: https://api.open.fec.gov/developers/ (free key, or use DEMO_KEY)
- Rate limit: 1,000/hour with DEMO_KEY, higher with registered key
- **Provides:**
  - Candidate financial summaries (money raised, spent, cash on hand)
  - Committee details (PACs, Super PACs, party committees)
  - Individual contributions (donor name, employer, amount, date)
  - Disbursements (what campaigns spend money on)
  - Independent expenditures
  - Filing documents (PDF links)
- Endpoints:
  - `/candidates/` — search candidates
  - `/candidates/{candidate_id}/totals/` — financial summary
  - `/schedules/schedule_a/` — individual contributions (itemized receipts)
  - `/schedules/schedule_b/` — disbursements
  - `/committee/{committee_id}/` — committee details
- **Covers:** Federal candidates only (President, Senate, House)
- Updated: Nightly for processed data, every 15 min for electronic filings

**For State-Level Campaign Finance:**
- **FollowTheMoney.org** (National Institute on Money in Politics)
  - Has state-level campaign finance data
  - API available: https://www.followthemoney.org/our-data/apis
- **State-specific sources** vary (California's Cal-Access, New York's BOE, etc.)

---

### 7. AI-GENERATED ANALYSIS (Summaries, Pros/Cons, Hidden Clauses)

**Claude API (Anthropic)** — Paid, your AI backbone
- **Input data comes from:** All the APIs above
- **Claude generates:**
  1. **Executive bill summaries** — Takes CRS summary (from Congress.gov) + 
     full bill text (from LegiScan) → produces plain-English summary
  2. **Hidden clause/rider detection** — Takes full bill text (from LegiScan) → 
     identifies provisions unrelated to the bill's stated purpose
  3. **Candidate policy analysis** — Takes voting record (from Congress.gov + 
     VoteView) + official platform (scraped from candidate website) → generates 
     balanced "supporters say / critics say" analysis
  4. **Nonpartisan source integration** — Cross-references AI analysis with 
     Ballotpedia descriptions, CRS summaries, and official sources

**Cost management:**
- Use claude-haiku-4-5 for bulk summaries (~$0.25/million input tokens)
- Use claude-sonnet-4 for deep analysis (~$3/million input tokens)
- Cache ALL AI outputs in your database — never regenerate the same analysis
- Estimated: $20-50/mo for active bill + candidate analysis

---

### 8. VOTER REGISTRATION, ABSENTEE BALLOTS & ELECTION REMINDERS

**Primary: TurboVote (by Democracy Works)** — Free for civic orgs via partnership ✅
- Partner sign-up: https://partners.turbovote.org/
- After partnership, you get:
  - Custom subdomain: `informedvoter.turbovote.org`
  - Embeddable iframe widgets for your site
  - Admin dashboard to track registrations
  - API access for deeper integration
- **TurboVote provides:**
  1. **Voter Registration** — walks users through their state's specific 
     registration process (online registration for 35+ states, or generates 
     pre-filled paper forms for states that require them)
  2. **Check Registration Status** — verifies if user is registered, if their
     address is current, and if their status is active vs inactive
  3. **Absentee / Mail-In Ballot Request** — handles all 50 states' different
     rules (no-excuse states, excuse-required states, universal mail states)
     with correct deadlines and forms
  4. **Election Reminders** — text/email alerts 30 days and 1 day before 
     every election the user is eligible for (federal, state, AND local)
  5. **Personalized Voting Hub** — state-specific voting guides with voter ID
     rules, early voting info, polling locations, and sample ballots
  6. **"What's On My Ballot"** — shows races, candidates, and ballot measures
     specific to the user's address
- **How it embeds on your site:**
  - Uses an iframe with a companion JS script for dynamic resizing
  - Renders within your page, styled to your site's look
  - Mobile-responsive and supports 13 languages
  - Embed URL pattern: 
    `https://informedvoter.turbovote.org/{path}?embed=window&partner={id}&placement={placement}`
- **Data quality:** Democracy Works employs expert researchers who verify 
  all election data from official government sources
- **Key advantage over building this yourself:** Registration rules, absentee 
  eligibility, and deadlines vary wildly across 50 states (and change 
  frequently). TurboVote maintains all of this so you don't have to.

**TurboVote API (for deeper integration):**
- Docs: https://developers.turbovote.org/api/v1
- **Democracy Works Elections API** — provides:
  - State-by-state election authorities and contact info
  - Canonical URLs for state voting hubs
  - Election dates and coverage info
- Use to dynamically link to the right TurboVote page for each state

**Supplemental: Vote.org** — Free widgets ✅
- URL: https://www.vote.org/technology/
- Provides embeddable widgets for:
  - Voter registration
  - Absentee ballot request
  - Registration status verification
  - Polling place locator
  - Election reminders
- Simpler than TurboVote but less personalized
- Good as a **fallback** if you're not yet a TurboVote partner
- Can be used alongside TurboVote for specific widgets

**Supplemental: US Vote Foundation** — Free resources
- URL: https://www.usvotefoundation.org/
- State-by-state voter registration rules and deadlines
- Overseas/military voter resources (UOCAVA)

**Supplemental: State Election Offices (manual curation)**
- Each state's Secretary of State or election board website
- Maintain a database table (`StatePollingLocator`) with:
  - Official voter registration lookup URL
  - Official polling place locator URL  
  - Official absentee ballot request URL
  - Official ballot tracking URL (where available)
- Update manually or scrape quarterly; these URLs rarely change

---

### 9. GEOLOCATION (State Detection)

**Primary: ip-api.com** — Free (no key needed) ✅
- URL: `http://ip-api.com/json/{ip}`
- Rate limit: 45 requests/minute (plenty for individual users)
- Returns: state, city, lat/lon, timezone
- **Limitation:** Free tier is HTTP only (no HTTPS). For production, use their 
  Pro tier ($13/mo for HTTPS) or switch to ipinfo.io (50K free/mo)

**Alternatives:**
- **ipinfo.io** — 50,000 requests/month free, HTTPS, more accurate
- **MaxMind GeoLite2** — Free downloadable database, self-hosted, no API calls needed
  Best for production at scale. Update monthly.
- **Browser Geolocation API** — As fallback (requires user permission), then 
  reverse geocode to get state

---

## COMPLETE DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FEDERAL MEMBERS          FEDERAL BILLS           STATE DATA        │
│  ┌─────────────────┐      ┌──────────────────┐   ┌──────────────┐  │
│  │ Congress.gov API │      │ Congress.gov API  │   │ Open States  │  │
│  │ (members, terms) │      │ (bills, summaries│   │ (legislators,│  │
│  └────────┬────────┘      │  actions, text)   │   │  state bills)│  │
│           │               └────────┬─────────┘   └──────┬───────┘  │
│  ┌────────┴────────┐              │                      │          │
│  │ unitedstates/   │      ┌───────┴──────────┐   ┌──────┴───────┐  │
│  │ congress-legis  │      │ LegiScan API     │   │ LegiScan API │  │
│  │ (photos, social,│      │ (full text, votes│   │ (state bills,│  │
│  │  contact info)  │      │  search)         │   │  full text)  │  │
│  └─────────────────┘      └──────────────────┘   └──────────────┘  │
│                                                                     │
│  ELECTIONS/VOTING          CAMPAIGN FINANCE        GEOLOCATION      │
│  ┌─────────────────┐      ┌──────────────────┐   ┌──────────────┐  │
│  │ Google Civic API│      │ OpenFEC API      │   │ ip-api.com / │  │
│  │ (polling places,│      │ (donations, $$$, │   │ MaxMind      │  │
│  │  ballot info)   │      │  committees)     │   │ GeoLite2     │  │
│  └─────────────────┘      └──────────────────┘   └──────────────┘  │
│  ┌─────────────────┐                                                │
│  │ Vote.org widgets│                                                │
│  │ (registration,  │                                                │
│  │  absentee)      │                                                │
│  └─────────────────┘                                                │
│                                                                     │
│  VOTE HISTORY             GOVERNOR DATA            BALLOT MEASURES  │
│  ┌─────────────────┐      ┌──────────────────┐   ┌──────────────┐  │
│  │ VoteView (UCLA) │      │ Ballotpedia      │   │ Ballotpedia  │  │
│  │ (every vote     │      │ (scrape - respect│   │ (scrape for  │  │
│  │  since 1789)    │      │  robots.txt)     │   │  measures)   │  │
│  └─────────────────┘      └──────────────────┘   └──────────────┘  │
│                                                                     │
│  VOTER ACTIONS (Embedded, not stored in your DB)                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ TurboVote (via iframe embed — runs on their servers)         │   │
│  │ - Register to vote        - Check registration status       │   │
│  │ - Request absentee ballot - Election reminders (text/email) │   │
│  │ - Personalized ballot info - State voting guides            │   │
│  │ + Vote.org widgets (fallback)                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     YOUR CRON JOBS (Data Pipeline)                   │
│                                                                     │
│   sync-members (daily) ─────────────────┐                           │
│   sync-federal-bills (6hr) ─────────────┤                           │
│   sync-state-bills (6hr) ───────────────┤                           │
│   sync-votes (6hr) ─────────────────────┼──▶ PostgreSQL (Supabase)  │
│   sync-elections (daily) ───────────────┤                           │
│   sync-voter-info (weekly) ─────────────┤                           │
│   sync-campaign-finance (daily) ────────┘                           │
│                                                                     │
│   analyze-bills (after sync) ──▶ Claude API ──▶ Cache in DB        │
│   analyze-candidates (weekly) ──▶ Claude API ──▶ Cache in DB       │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     YOUR APP (Next.js on Vercel)                    │
│                                                                     │
│   Redis Cache (Upstash) ◄──── API Routes ────▶ React Frontend      │
│                                                                     │
│   ISR Pages:                                                        │
│   - State dashboards (30 min)                                       │
│   - Bill pages (1 hr)                                               │
│   - Candidate pages (24 hr)                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API KEYS YOU NEED TO OBTAIN (All Free)

| Service | Sign-Up URL | Free Tier |
|---------|-------------|-----------|
| Congress.gov API | https://api.congress.gov/sign-up/ | 5,000 req/hr |
| Open States / Plural | https://open.pluralpolicy.com/ | Free API key |
| LegiScan | https://legiscan.com/legiscan-register | 30,000 req/mo |
| Google Civic Info | https://console.cloud.google.com/ | Free (quota limits) |
| OpenFEC | https://api.open.fec.gov/developers/ | 1,000 req/hr |
| Anthropic (Claude) | https://console.anthropic.com/ | Pay-as-you-go |
| Supabase | https://supabase.com/ | Free tier (500MB) |
| Upstash Redis | https://upstash.com/ | Free tier (10K req/day) |
| ip-api.com | None needed (free tier) | 45 req/min |
| TurboVote | https://partners.turbovote.org/ | Free for civic orgs (partnership) |
| Vote.org | https://www.vote.org/technology/ | Free widgets (no key) |

**Optional paid upgrades as you scale:**
- ipinfo.io or ip-api Pro for HTTPS geolocation ($13-49/mo)
- LegiScan Pull subscription for 100K+ queries ($500-2000/yr)
- Supabase Pro for more storage/connections ($25/mo)
- Vercel Pro for more serverless invocations ($20/mo)

---

## WHAT IS *NOT* AVAILABLE FROM FREE APIs (Gaps to Know About)

1. **Candidate policy positions** — No API provides this. You must generate 
   from voting records + official websites using AI analysis.

2. **Local election data** (Phase 2) — Extremely fragmented. Best sources:
   - BallotReady (paid API)
   - Ballotpedia (paid API for bulk)
   - Individual county/city election board websites (scraping required)

3. **State campaign finance** — No unified national API. Follow The Money 
   has partial data; otherwise it's state-by-state.

4. **Historical election results** — MIT Election Data + Science Lab 
   (https://electionlab.mit.edu/data) has free datasets.

5. **Ballot measures/propositions** — Ballotpedia is the best source, 
   but requires scraping or paid API access.

6. **Real-time representative lookup by address** — Since Google killed 
   their Representatives API, this is harder. Best current option is 
   combining the divisionByAddress endpoint with your own legislator database.
