# Scoracle — FIFA World Cup 2026 Prediction League

A full-stack, real-time prediction league app for FIFA World Cup 2026. Users sign up, predict match outcomes before kickoff, earn points for correct predictions, and compete on a live leaderboard.

**Live:** [scoracle-xi.vercel.app](https://scoracle-xi.vercel.app)

---

## Features

- **Match Predictions** — Pick the winner of every World Cup match before it kicks off. Predictions lock at kickoff.
- **Live Score Sync** — Scores and match statuses update automatically via a scheduled cron job pulling from the ESPN API.
- **Leaderboard** — Real-time rankings with points, correct predictions, and accuracy percentage.
- **Group Standings** — Full group stage table computed from match results, reflecting the WC 2026 format (top 2 + best 8 third-placed teams advance).
- **Push Notifications** — Users receive a reminder 1 hour before kickoff if they haven't predicted, and a result notification when a match ends.
- **Progressive Web App (PWA)** — Installable on iOS and Android. Data refreshes instantly when the user returns to the app via the Page Visibility API.
- **Authentication** — Email/password sign-up with confirmed email via custom Nodemailer + Gmail transactional emails. Magic link and password reset supported.
- **Admin Panel** — Protected fallback dashboard to manually override scores and sync fixtures when the automated cron job misses or produces incorrect data.
- **Dark Mode** — System-aware dark theme throughout.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui + Radix UI |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Email | Nodemailer + Gmail SMTP |
| Score Data | ESPN Scoreboard API |
| Fixture Data | football-data.org API |
| Push Notifications | Web Push (VAPID) |
| PWA | @ducanh2912/next-pwa |
| Deployment | Vercel |
| Analytics | Vercel Analytics + Speed Insights |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/               # Sign in, sign up, forgot password, reset password
│   ├── (main)/               # Matches, leaderboard, standings, profile
│   ├── admin/                # Admin dashboard (protected)
│   ├── api/
│   │   ├── admin/            # Match update + score sync endpoints
│   │   ├── auth/send-email/  # Supabase Auth Hook — transactional email handler
│   │   └── cron/sync-scores/ # Scheduled score sync (runs every minute on Vercel)
│   ├── layout.tsx            # Root layout with metadata, OG image, PWA config
│   └── opengraph-image.tsx   # Dynamic OG image (trophy on black background)
├── components/
│   ├── match-card.tsx        # Core match UI — prediction buttons, live scores
│   ├── matches-view.tsx      # Polling + visibility-change refresh logic
│   ├── navbar.tsx            # Bottom navigation bar
│   ├── install-prompt.tsx    # PWA install banner
│   ├── notification-prompt.tsx
│   └── ui/                   # shadcn/ui component library
├── lib/
│   ├── espn.ts               # ESPN API client — live scores and results
│   ├── football-data.ts      # football-data.org client — fixture seeding
│   ├── notifications.ts      # Web Push helper
│   ├── supabase/             # Supabase server + browser clients
│   ├── config.ts             # Site-wide constants
│   └── emails/templates.ts   # HTML email templates
├── middleware.ts             # Auth guard + public route allowlist
└── types/                    # Shared TypeScript types
```

---

## How Scoring Works

- **+5 points** for a correct prediction (right winner or draw)
- **0 points** for an incorrect prediction
- Scores are calculated automatically when the cron job marks a match as `completed` and sets a `winner`
- The leaderboard is a Supabase view that aggregates points, correct predictions, and accuracy per user

---

## Environment Variables

Create a `.env` file in the root with the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email (Gmail SMTP)
GMAIL_USER=
GMAIL_APP_PASSWORD=

# Cron job protection
CRON_SECRET=

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Score & fixture data
FOOTBALL_DATA_KEY=
```

> **Never commit `.env` to version control.** It is gitignored by default.

---

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Cron Job

The score sync runs automatically on Vercel via a cron job defined in `vercel.json`. It hits `/api/cron/sync-scores` every minute during active match windows, protected by a `CRON_SECRET` bearer token.

To trigger it manually:

```
GET /api/cron/sync-scores
Authorization: Bearer <CRON_SECRET>
```

---

## Deployment

The app is deployed on Vercel. Push to `main` triggers an automatic production deployment.

Required Vercel configuration:
- All environment variables added in the Vercel dashboard
- Cron job defined in `vercel.json`
- Supabase Auth Hook pointing to `/api/auth/send-email` for transactional emails

---

## License

MIT
