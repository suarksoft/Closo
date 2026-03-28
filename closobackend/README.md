# Closo Backend (NestJS)

## Setup

1. Copy `.env.example` to `.env`
2. Configure `DATABASE_URL`, `JWT_SECRET`, and optional AI/Search keys:
   - `OPENAI_API_KEY`
   - `GOOGLE_PLACES_API_KEY`
   - `GOOGLE_SEARCH_CONSOLE_SITE_URL`
   - `GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL`
   - `GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY` (replace new lines with `\n`)
3. For real Monad payout (instead of simulation), set:
   - `MONAD_RPC_URL`
   - `MONAD_CHAIN_ID` (testnet: `10143`)
   - `MONAD_ESCROW_ADDRESS`
   - `MONAD_PAYOUT_OPERATOR_PRIVATE_KEY`
4. Install dependencies:

```bash
npm install
```

## Database (DB-first)

```bash
npm run db:migrate
npm run db:seed
```

## Run

```bash
npm run dev
```

API base URL defaults to `http://localhost:4000`.

## Google Search Console API

Business/Admin token required:

- `GET /search-console/sites`
- `POST /search-console/performance`

Example body:

```json
{
  "startDate": "2026-03-01",
  "endDate": "2026-03-28",
  "dimensions": ["query", "page"],
  "searchType": "web",
  "rowLimit": 100
}
```

## Demo Accounts

- `seller@monadblitz.dev` / `seller123`
- `business@monadblitz.dev` / `business123`
- `admin@monadblitz.dev` / `admin123`

## Critical Flow Test (Hackathon Demo)

With backend running and DB seeded:

```bash
npm run test:flow
```

Flow covered:

1. Seller login
2. Business login
3. Seller reads assigned lead
4. Seller creates sale
5. Business verifies sale
6. Commission calculated
7. Payout recorded with tx hash (simulated by default; onchain when Monad env vars are set)
