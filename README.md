# DevMate Voice — Retell AI dashboard (Next.js)

DevMate Solutions branded dashboard for Retell AI voice agents, built with **Next.js 16** (App Router, TypeScript).

- **Overview**: calls, answer rate, talk time, successful calls, contacts reached, sentiment, spend and cost per answered call, each compared with the previous period. Also call volume, call outcomes, the best hour to call, and agent performance.
- **New call**: an agent calls one number with personalisation variables, with live status while the call runs.
- **Bulk campaign**: upload or paste a CSV. The phone column is detected automatically and other columns become call variables. Invalid and duplicate numbers are removed. You can schedule a start time, set calling hours, and see a cost estimate.
- **Campaigns**: live progress for each campaign.
- **Call history**: search, filter and export to CSV. Open a call for its recording, transcript, summary and extracted data.

## Run

```bash
npm install
npm run dev        # development, http://localhost:4310
# or
npm run build && npm start   # production, http://localhost:4310
```

Sign in with `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` from `.env`.

## Configuration (`.env`)

| Variable | Purpose |
| --- | --- |
| `RETELL_API_KEY` | Retell API key. Server-side only; never sent to the browser. |
| `RETELL_SECRET_KEY` | Optional second key (reserved for webhook verification; not used yet). |
| `DASHBOARD_USERNAME` | Username for the sign-in screen (e.g. `Veronika`) |
| `DASHBOARD_PASSWORD` | Password for the sign-in screen |
| `SESSION_SECRET` | Random string used to sign sessions (`openssl rand -hex 32`). Changing it signs everyone out. |
| `ALLOWED_AGENT_IDS` | Optional comma-separated agent IDs to limit this dashboard to specific agents (one dashboard per client). |

## Project layout

```
src/
  proxy.ts                 sign-in gate (redirects to /login)
  app/
    login/                 sign-in page
    (dashboard)/           overview, call, bulk, campaigns, history pages + shared layout
    api/                   route handlers: login, logout, config, calls, calls/[id], batches
  components/              shell, charts, call tables, shared dashboard state
  lib/
    server/                Retell client, sessions, campaign log (server only)
    calls.ts, types.ts     shared helpers and types
```

## Deploying

Run it on any Node host (a VPS, Render, Railway, Fly) with HTTPS, and set the env vars there. Campaigns launched from the dashboard are logged to `data/batches.json` because Retell has no API to list batch calls. That needs a writable disk, so for serverless hosts like Vercel, move the log to a database.

`legacy/` holds the previous zero-dependency version and can be deleted.
