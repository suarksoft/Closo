# Closo - AI-Native Sales Operating System on Monad

Closo is a hackathon project that helps startups scale distribution and helps sellers earn crypto commissions.

It combines:
- a startup product marketplace,
- an AI-assisted seller workspace,
- referral-based sales verification,
- and Monad-powered payout rails.

## One-Line Pitch

**Closo turns marketplace listings into a programmable sales force with verifiable referrals and onchain-ready payouts.**

## Problem

Most early-stage startups struggle with go-to-market because:
- they do not have enough outbound capacity,
- independent sellers do not know what to sell or how to sell it,
- and trust breaks down in commission verification and payment.

## Solution

Closo provides a full Sales OS:
- **Startups** list products, define commission rates, and manage verification/payout operations.
- **Sellers** onboard with wallet auth, select products, generate AI sales assets, and run outreach.
- **Platform** tracks referral attribution, verifies sales, calculates commissions, and triggers payout flow.

## Business Model

Closo monetizes through multiple aligned streams:
- **Platform fee on verified sales** (in addition to seller commissions).
- **AI credit economy** (sellers buy credits in MON and spend per AI feature/tool).
- **Optional premium startup tooling** (advanced analytics, automation, workflow integrations).

This model scales with transaction volume and tool usage, not with fixed seat limits.

## Core User Roles

- **Seller**
  - Wallet-based onboarding (MetaMask challenge/signature)
  - Product selection into personal dashboard
  - Sales Workspace: scripts, sequences, AI assets, prospecting, referral links
- **Business (Startup Owner)**
  - Product listing and commission configuration
  - Business operations dashboard
  - Verification queue (verify/reject)
  - Referral-based and webhook-based sale verification
- **Admin**
  - Platform-level oversight and fallback controls

## Product Flow (End-to-End)

1. Startup lists a product with price, commission rate, and wallet details.
2. Seller connects wallet, registers, and adds product to dashboard.
3. Seller uses AI tools (credit-gated) to generate outreach plans/messages and prospect lists.
4. Seller shares referral link and closes a sale.
5. Startup verifies sale (manual queue, referral verification, or webhook).
6. Commission is calculated and payout is triggered (simulated/offchain by default, onchain-ready via Monad integration).

## Hackathon Architecture

Monorepo with 3 apps:

- `closofront` - Next.js frontend
  - Marketplace, onboarding, seller dashboard, startup dashboard
  - Role-based routing and session handling
- `closobackend` - NestJS + PostgreSQL backend
  - Auth, products, sales, referrals, credits, AI tools, dashboards, payouts
  - DB-first migrations and seed scripts
- `clososmartcontract` - Hardhat + Solidity
  - `MonadBlitzEscrow` contract
  - Deposit, approve, release, refund, pause, reentrancy protections

## Tech Stack

- **Frontend:** Next.js App Router, React, Tailwind, Radix/shadcn UI
- **Backend:** NestJS, PostgreSQL (`pg`), JWT auth, class-validator
- **Blockchain:** Solidity, Hardhat, OpenZeppelin, Ethers v6
- **AI & Data APIs:** OpenAI, Google Places API, Google Search Console API

## Repo Structure

```text
monadblitz/
  closofront/         # Next.js web app
  closobackend/       # NestJS API + DB scripts
  clososmartcontract/ # Hardhat Solidity project
```

## Quick Start (Local)

### 1) Backend

```bash
cd closobackend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### 2) Frontend

```bash
cd closofront
cp .env.local.example .env.local
npm install
npm run dev
```

### 3) Smart Contract

```bash
cd clososmartcontract
cp .env.example .env
npm install
npm run clean
npm run build
npm run test
```

## Environment Variables (Important)

### Backend (`closobackend/.env`)

- `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `GOOGLE_PLACES_API_KEY`
- `GOOGLE_SEARCH_CONSOLE_SITE_URL`, `GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL`, `GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY`
- `CREDITS_PER_MON`, `REFERRAL_BASE_URL`
- `MONAD_RPC_URL`, `MONAD_CHAIN_ID`, `MONAD_ESCROW_ADDRESS`, `MONAD_PAYOUT_OPERATOR_PRIVATE_KEY`
- `SALES_WEBHOOK_SECRET`

### Frontend (`closofront/.env.local`)

- `NEXT_PUBLIC_API_URL`

### Smart Contract (`clososmartcontract/.env`)

- `PRIVATE_KEY`
- `PAYOUT_OPERATOR_ADDRESS`
- `MONAD_TESTNET_RPC_URL`
- `MONAD_CHAIN_ID`
- `ETHERSCAN_API_KEY`

## Key Hackathon Features

- Wallet-based auth with nonce challenge + signature verification
- Product-to-seller linking before sales actions
- Referral link generation and conversion tracking
- Duplicate sale protection using external reference rules
- Verification event audit trail
- Business dashboard with operational metrics and queue actions
- Reject flow for disputed/invalid sales
- Secure webhook endpoint for automated startup-side verification
- Credit-based AI tooling (scalable monetization primitive)
- Monad-compatible payout pipeline + escrow contract

## Smart Contract (Monad Escrow) Highlights

`MonadBlitzEscrow` supports:
- `depositForSale`
- `approveSale`
- `release`
- `approveAndRelease`
- `refund`
- `pause` / `unpause`

Security primitives:
- role-based access control,
- pausable emergency switch,
- non-reentrancy on value transfers,
- explicit state-machine checks.

## Demo Script for Judges (3-5 min)

1. Open marketplace and show live listed startup products.
2. Onboard as seller with MetaMask and add a product to dashboard.
3. Generate AI sales asset / prospect package (credit consumption visible).
4. Create referral-driven sale and show startup verification queue.
5. Verify (or reject) sale from startup dashboard.
6. Show commission + payout trigger and audit visibility.
7. Mention onchain-ready escrow path for MON payouts.

## Why This Can Win a Hackathon

- Solves a real GTM pain point with clear user value on both sides.
- Integrates AI + crypto rails in a product-native way (not a demo gimmick).
- Includes operational hardening (verification events, duplicate checks, webhook security).
- Has a credible business model and expansion path.

## Current Status

- End-to-end core flow is implemented and buildable.
- Frontend and backend production builds pass.
- Smart contract compile/test flow passes.
- Remaining work is mostly integrations, polish, and scaling concerns.

## Roadmap (Post-Hackathon)

- Onchain payout finalization from backend trigger layer
- Richer dispute workflow and SLA states
- Better observability (structured logs, metrics, traces)
- Automated integration/E2E test suite expansion
- CRM and messaging channel integrations

---

If you are a judge, think of Closo as:
**"Shopify meets affiliate GTM ops, with AI execution and Monad-native incentive rails."**
