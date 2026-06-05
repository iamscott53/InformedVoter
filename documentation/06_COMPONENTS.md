# 06 — Components

> **Last Updated:** 2026-06-05

---

## Component Library

This project does **not** use shadcn/ui or a third-party UI library. All components are custom-built with Tailwind CSS v4 and React 19.

---

## Layout Components

### `Header` (`src/components/layout/Header.tsx`)
- Sticky header with InformedVoter logo
- Desktop nav with 7 primary links (Bills, Judicial, Agencies, Local, Elections, etc.)
- Mobile hamburger menu toggle
- `StateSelector` dropdown in header
- **State-prefix logic:** Nav items like `/bills`, `/elections`, `/voter-info` are dynamically prefixed with `/state/{abbr}` when a state is selected; otherwise they link to `/#select-state`
- Uses Framer Motion `layoutId` for an active-page pill animation
- Adds shadow on scroll via scroll listener

### `Navigation` (`src/components/layout/Navigation.tsx`)
- Mobile slide-out drawer (right side) with backdrop blur
- Animated with Framer Motion
- Same state-prefix logic as Header
- Closes on Escape key, route change, or backdrop click
- Traps focus and disables body scroll when open

### `Footer` (`src/components/layout/Footer.tsx`)
- Three-column footer: brand/tagline, navigate links (About, Privacy, Contact), data source attributions (Congress.gov, OpenFEC, etc.)
- Nonpartisan disclaimer and AI-assisted content notice

---

## UI Components (`src/components/ui/`)

### `PartyBadge` (`src/components/ui/PartyBadge.tsx`)
- Colored pill badge for political party codes
- Color mapping: `D` → blue, `R` → red, `I` → purple, `G` → green, `L` → amber
- Props: `showFullName`, `showDot`, `size` (`xs`/`sm`/`md`)

### `BillStatusBadge` (`src/components/ui/BillStatusBadge.tsx`)
- Rich badge with icon for `BillStatus` enum values
- `SIGNED` → green checkmark, `VETOED` → red X, `INTRODUCED` → gray, etc.
- Props: `size` (`xs`/`sm`/`md`), `showIcon`

### `CandidateCard` (`src/components/ui/CandidateCard.tsx`)
- Card layout: photo (or initials avatar fallback), name, `PartyBadge`, office label, state, bio snippet
- Links to candidate profile and official website
- Props: `compact` mode for denser display

### `StateSelector` (`src/components/ui/StateSelector.tsx`)
- Dropdown of all 50 states + DC with FIPS codes
- Uses `useUserState` hook
- On change: writes cookie and navigates to `/state/{abbr}`
- Props: `compact` variant for header use

### `AiDisclaimer` (`src/components/ui/AiDisclaimer.tsx`)
- Disclosure badge for AI-generated content
- Three variants: `banner` (full width), `inline` (text inline), `compact` (small badge)
- Links to `/about#ai-methodology`
- Used on bill summaries, candidate analyses, case summaries, speaking templates

### `RiderAlertBadge` (`src/components/ui/RiderAlertBadge.tsx`)
- Warning badge for bills with flagged hidden clauses (`hiddenClauses`)
- Three variants: `badge`, `inline`, `banner` (dismissible)
- Shows count and description of detected riders

### `DataSourceBadge` (`src/components/ui/DataSourceBadge.tsx`)
- Freshness indicator for data sources
- Color coding: ≤7 days = green, ≤30 days = amber, older = red
- Shows verification timestamp

### `PolicyAccordion` (`src/components/ui/PolicyAccordion.tsx`)
- Rich accordion for candidate policy positions
- Each item: category pill, title, summary, supporters/critics arguments side-by-side, AI analysis block with `AiDisclaimer`, source links
- Props: `defaultOpenFirst`, `allowMultiple`

---

## Feature Components (`src/components/features/`)

### `USStateMap` (`src/components/features/USStateMap.tsx`)
- Interactive SVG map of the US
- Path data from `src/data/us-states.ts`
- Hover tooltips with state name, click-to-navigate to `/state/[abbr]`
- Keyboard accessible (arrow keys, Enter to select)
- Selected state highlighted in green
- Includes searchable dropdown alternative below the map

### `AnimatedCards` / `AnimatedSection`
- `AnimatedCards`: Framer Motion grid with staggered entrance animation
- `AnimatedSection`: Simple fade-up wrapper with configurable delay
- Used for homepage sections and marketing content

### `BillDetailTabs` (`src/components/features/BillDetailTabs.tsx`)
- Four-tab interface for bill detail pages:
  1. **Overview** — AI summary, status timeline, sponsor info
  2. **Hidden Clauses & Riders** — Expandable severity-coded rider cards from `hiddenClauses`
  3. **Vote Results** — House floor vote totals + party breakdown bars
  4. **Full Text** — CTA link to Congress.gov

### `BillsFilterBar` (`src/components/features/BillsFilterBar.tsx`)
- URL-driven filter controls for bill listings
- Filters: search text, chamber dropdown, status dropdown, subject dropdown
- Pushes to Next.js router with query params, resets page to 1 on filter change

### `CandidateTabs` (`src/components/features/CandidateTabs.tsx`)
- Four-tab interface for candidate profiles:
  1. **Policy Positions** — Renders `PolicyAccordion`
  2. **Voting Record** — YES/NO/ABSTAIN badges with bill links
  3. **Campaign Finance** — Cycle selector, summary cards, donor-type breakdown, expandable top-donor lists, spending breakdown bars
  4. **Contact** — Phone, email, website links from `contactInfo` JSON

### `CompareTable` (`src/components/features/CompareTable.tsx`)
- Side-by-side candidate comparison for `/compare`
- Fetches candidates from `/api/candidates`
- User selects 2–4 candidates from dropdown
- Grid compares policy positions across 10 categories
- Expandable rows reveal AI summary text

### `DemographicSurveyModal` (`src/components/features/DemographicSurveyModal.tsx`)
- Three-step modal survey:
  1. About You (party, age, ethnicity, gender, zip, education)
  2. Background (community service, voting frequency)
  3. Civic Engagement (issues of interest, referral source)
- Posts to `/api/subscribe/demographics`
- Custom `RadioGroup` and `MultiSelect` sub-components
- Triggered after email subscription when `profileToken` is returned

### `DistrictFinder` (`src/components/features/DistrictFinder.tsx`)
- Address input form hitting `/api/district-lookup`
- Displays congressional district number and representative card

### `FederalAgenciesSection` (`src/components/features/FederalAgenciesSection.tsx`)
- Grid of agency cards from `FEDERAL_AGENCIES` catalog
- Category filter chips (Defense, Health, Economy, Environment, etc.)
- "Show All" toggle for expanding the grid

### `HomepageLinks` (`src/components/features/HomepageLinks.tsx`)
- Three exported sections:
  - `ExploreStateButton` — CTA linking to user's selected state or map
  - `QuickActions` — `AnimatedCards` grid with links to major features
  - `VoterEssentials` — 4-card grid with voter info CTAs
- All respect `useUserState` for state-scoped links

### `PacRecipientsTable` (`src/components/features/PacRecipientsTable.tsx`)
- Data table for PAC contribution recipients
- Fetches from `/api/pac-recipients`
- Server-side sorting, chamber/party/cycle filters
- Client-side name search
- Expandable rows showing individual contributions
- Links to candidate profiles and FEC filings

### `PollingPlaceFinder` (`src/components/features/PollingPlaceFinder.tsx`)
- Full polling place search interface
- Hits `/api/polling-places`
- Displays: polling places, early vote sites, drop-off locations
- Rich cards with hours, accessibility badges, "Get Directions" links

### `StateDetector` (`src/components/features/StateDetector.tsx`)
- Prominent state-selection prompt
- If state already chosen: shows it with "Change state" dropdown
- If no state: shows large "Choose Your State" dropdown
- Used on pages that need state context

### `StateRequiredBanner` (`src/components/features/StateRequiredBanner.tsx`)
- Thin amber banner at top of page
- Appears when `userState` is null
- Prompts user to select a state from the map

### `SubscribeBottomBar` (`src/components/features/SubscribeBottomBar.tsx`)
- Fixed bottom email capture bar
- Appears after 30 seconds or 50% scroll
- Uses 30-day dismiss cookie (`subscribe-dismissed`)
- Posts to `/api/subscribe`
- Triggers `DemographicSurveyModal` on success

### `SubscribeForm` (`src/components/features/SubscribeForm.tsx`)
- Standalone email subscription form
- Three visual variants: `default`, `compact`, `dark`
- Email input + state selector + topic checkboxes
- Validates email format before submission
- Used on state pages and in bottom bar

---

## SEO Components (`src/components/seo/`)

### `JsonLd` (`src/components/seo/JsonLd.tsx`)
- Generic `<script type="application/ld+json">` injector component
- Accepts `data` prop and renders as safe script tag

### `SiteJsonLd` (`src/components/seo/JsonLd.tsx`)
- Organization + WebSite structured data
- Injected in `RootLayout` `<head>`

### `BreadcrumbJsonLd` (`src/components/seo/JsonLd.tsx`)
- BreadcrumbList schema builder
- Used on nested pages for SEO breadcrumbs

### `AgencyJsonLd` (`src/components/seo/JsonLd.tsx`)
- GovernmentOrganization schema
- Used on agency detail pages

### `PersonJsonLd` (`src/components/seo/JsonLd.tsx`)
- Person schema
- Used on SCOTUS justice profiles

---

## Custom Hooks (`src/hooks/`)

### `useUserState` (`src/hooks/useUserState.ts`)
- **The central state-selection hook for the entire app.**
- Reads/writes `selected-state` cookie (1-year expiry, `SameSite=Lax`, `Secure` on HTTPS)
- Returns: `{ userState, setUserState, isHydrating }`
- **Hydration-safe:** Starts `null` on both server and client, then reads cookie in `useEffect`
- **Dependent components:** `Header`, `Navigation`, `StateSelector`, `StateDetector`, `StateRequiredBanner`, `HomepageLinks`, `SubscribeBottomBar`

---

## Component Conventions

- **Props:** Explicit TypeScript interfaces for all component props
- **Path aliases:** Always import from `@/components/...` — never relative `../../` paths
- **Client components:** Use `"use client"` when they need React state, effects, or browser APIs (`document.cookie`, `window.scrollY`)
- **Server components:** Omit the directive (e.g., `Footer`, `JsonLd`)
- **Framer Motion:** Used for entrance animations, tab transitions, drawer slides, accordions
- **Tailwind:** Utility-first; brand color `#1B2A4A`
- **Accessibility:** `aria-expanded`, `aria-label`, `role`, focus-visible rings, skip-to-content link
