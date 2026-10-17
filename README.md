# Sponsor OS

A sponsorship marketplace for grassroots sport in India. Athletes, teams, tournaments and leagues list sponsorship packages. Brands post briefs, find matches by fit score, negotiate, pay into **Razorpay escrow**, and release the money once deliverables are signed off.

## Features
- **Accounts:** sign up as a team/athlete or as a brand. Passwords are hashed with scrypt; sessions are signed HttpOnly cookies.
- **Listings:** story, verified-style reach numbers, formats, up to 4 priced packages, funding goal. Each listing gets a printable sponsorship deck (`/kit/?id=…`).
- **Briefs and discovery:** a transparent 0–100 fit score (sport 35, region 25, budget 25, formats 10, level 5) with the reasons and gaps shown.
- **Deal room:** message thread, counter-offers, accept/decline/withdraw, deliverables checklist with proof.
- **Escrow payments (Razorpay Standard Checkout):**
  1. The brand pays an accepted deal. The server creates the order, and the amount always comes from the database.
  2. The server checks the HMAC-SHA256 signature before marking the money as *held*.
  3. When the brand approves completion, the payout is released to the team minus a **5% platform fee**.
- **Dashboards:** committed amount, held in escrow, paid out, pipeline, cost per 1,000 reach.
- **Demo logins** for reviewers: `team@demo.sponsoros.in` / `brand@demo.sponsoros.in`, password `demo1234`. There are also one-click buttons on /login.

## Architecture
- Next.js 16 (App Router), React 19, Tailwind v4, TypeScript.
- Postgres via `postgres` (porsager). Works with Neon (Vercel Storage), Supabase or any Postgres.
- **Tables are created and fictional sample data is loaded automatically on first request**, so no SQL step is needed.
- All writes go through `POST /api/action`. The server checks the session, role and deal membership, validates the input, and runs updates in transactions with row locks.
- Payments: `POST /api/pay/order` and `POST /api/pay/verify`. `RAZORPAY_KEY_SECRET` never reaches the browser, and the key id is returned by the order endpoint.

## Environment variables
| Name | Where it comes from |
|---|---|
| `DATABASE_URL` | Added automatically when you connect a Neon database in Vercel → Storage |
| `RAZORPAY_KEY_ID` | Razorpay dashboard → API keys (test mode) |
| `RAZORPAY_KEY_SECRET` | Same place. Server only. |
| `AUTH_SECRET` (optional) | Any long random string. If unset, it's derived from `DATABASE_URL`. |

## Deploy on Vercel
1. Run `npx vercel --prod` in this folder (on Windows: `npx.cmd vercel --prod`).
2. In the Vercel project, go to **Storage → Create Database → Neon** and connect it to the project.
3. Under **Settings → Environment Variables**, add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
4. Run `npx vercel --prod` again.

## Develop
```
npm install
# .env.local with DATABASE_URL, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
npm run dev
npm test
```
