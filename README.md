# InformedVoter

Nonpartisan civic information platform for US voters. Research your representatives, track legislation, understand what's on your ballot, and exercise your rights — all in one place, without partisan spin.

## Features

- **State Auto-Detection** — Automatically detects your state via IP geolocation with manual override
- **Representative Profiles** — Senators, representatives, and governors with policy positions, voting records, and contact info
- **Bill Tracking** — Federal and state legislation with AI-generated plain-English summaries
- **Hidden Clause & Rider Detection** — AI analysis that flags unrelated provisions buried in legislation
- **Campaign Finance Transparency** — Who's funding candidates, top donors, spending breakdowns (OpenFEC data)
- **Voter Action Center** — Registration, absentee ballots, election reminders, and state-specific voting rules
- **Polling Place Finder** — Find your nearest polling place with directions and hours
- **Candidate Comparison** — Side-by-side comparison tool for candidates running for the same office
- **Know Your Rights** — Voter rights information, provisional ballot rules, and accessibility resources

## Tech Stack

- **Framework:** Next.js 16 (App Router) with TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL via Supabase with Prisma ORM
- **AI Analysis:** Anthropic Claude API for bill summaries and rider detection
- **Caching:** Upstash Redis
- **Authentication:** NextAuth.js (Google, email magic link)
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Data Sources

| Source | Data Provided |
|--------|--------------|
| [Congress.gov API](https://api.congress.gov/) | Bills, members, voting records |
| [LegiScan API](https://legiscan.com/legiscan) | State + federal bills, full text, roll calls |
| [Open States People](https://github.com/openstates/people) | State legislator data (public domain) |
| [OpenFEC API](https://api.open.fec.gov/) | Campaign finance, donors, expenditures |
| [Google Civic Information API](https://developers.google.com/civic-information) | Elections, polling places, ballot info |
| [VoteView (UCLA)](https://voteview.com/) | Congressional voting records since 1789 |
| [Vote.org](https://www.vote.org/) | Voter registration and absentee ballot tools |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)

### Installation

```bash
git clone https://github.com/your-username/informed-voter.git
cd informed-voter
npm install
```

### Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI analysis |

Optional variables for full functionality:

| Variable | Description |
|----------|-------------|
| `CONGRESS_GOV_API_KEY` | Congress.gov API access |
| `FEC_API_KEY` | OpenFEC campaign finance data |
| `LEGISCAN_API_KEY` | State + federal bill text and roll calls |
| `GOOGLE_CIVIC_API_KEY` | Elections and polling places |
| `UPSTASH_REDIS_URL` | Redis caching |
| `UPSTASH_REDIS_TOKEN` | Redis authentication |
| `NEXTAUTH_SECRET` | NextAuth session encryption |

### Database Setup

```bash
npx prisma db push
npm run db:seed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/                # REST API endpoints and cron jobs
│   ├── state/[stateAbbr]/  # State-specific pages
│   ├── candidate/          # Candidate detail pages
│   ├── polling-places/     # Polling place finder
│   └── compare/            # Candidate comparison tool
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── layout/             # Header, footer, navigation
│   └── features/           # Feature-specific components
├── lib/
│   ├── api/                # External API clients
│   ├── ai/                 # Claude AI integration
│   ├── db.ts               # Prisma client
│   ├── cache.ts            # Redis caching
│   └── geolocation.ts      # IP-based state detection
├── hooks/                  # React hooks
└── types/                  # TypeScript type definitions
```

## Disclaimers

- InformedVoter is a nonpartisan informational resource. We do not endorse any candidate or party.
- AI-generated analyses are provided for educational purposes. Always consult primary sources and official government websites for authoritative information.
- Voting information is updated regularly but may not reflect last-minute changes. Contact your local election office to confirm details.
- Campaign finance data is provided by the Federal Election Commission and may have a reporting lag.

## License

MIT
