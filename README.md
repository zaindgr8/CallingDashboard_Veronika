# DevMate Voice — Retell AI dashboard (Next.js)

DevMate Solutions branded dashboard for Retell AI voice agents, built with **Next.js 16** (App Router, TypeScript).

- **Leads**: every number your agents call, or that calls in, becomes a lead automatically. Leads move through a pipeline (New → Attempted → Engaged → Qualified → Proposal → Won/Lost) on their own as calls happen, or you can move them by hand. Each lead gets a 0–100 score (hot / warm / cold) with the reasons behind it and a suggested next step. A work queue sorts leads by urgency, and a drag-and-drop pipeline board shows every stage. You can set follow-up dates, add notes, tags and deal values, import or export CSV, archive leads, and start a bulk campaign from any filtered list.
- **AI lead briefs** (optional): Claude reads a lead's call transcripts and notes, then writes a summary, buying intent, objections, talking points, the best time to follow up and a suggested stage.
- **Overview**: pipeline counts and today's priority leads, then calls, answer rate, talk time, successful calls, contacts reached, sentiment, spend and cost per answered call, each compared with the previous period. Also call volume, call outcomes, the best hour to call, and agent performance.
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
| `ANTHROPIC_API_KEY` | Optional. Turns on AI lead briefs. |
| `ANTHROPIC_MODEL` | Optional. Model for AI briefs (default `claude-opus-5-5`). |
| `DATA_DIR` | Optional. Where campaign and lead data is stored (default `./data`). Point it at a persistent volume in production. |

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

Run it on any Node host (a VPS, Render, Railway, Fly) with HTTPS, and set the env vars there. Call data always comes live from Retell. What the dashboard adds on top (the campaign log, plus lead stages, notes, follow-ups and AI briefs) is stored as JSON in `DATA_DIR` (`data/batches.json`, `data/leads.json`). Writes are atomic and serialized, so a single Node instance is safe. Back the folder up. Serverless hosts like Vercel have no persistent disk, so there you would swap `src/lib/server/store.ts` for a database.

`legacy/` holds the previous zero-dependency version and can be deleted.
