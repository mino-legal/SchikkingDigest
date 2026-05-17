# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Next.js dev server on :3000
- `npm run build` / `npm start` — production build / start
- `npm run lint` — `next lint`
- No test suite is configured.

Manually trigger a digest run locally (requires `DIGEST_SECRET` from `.env.local`):

```bash
curl -X POST http://localhost:3000/api/digest \
  -H "Content-Type: application/json" \
  -d '{"secret":"<DIGEST_SECRET>"}'
```

Required env vars (`.env.local`): `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `DIGEST_SECRET`, `CRON_SECRET`.

## Architecture

Next.js 15 App Router app that produces a weekly digest of Dutch case law (civiel + advocaten­tuchtrecht) relevant to settlement practice. State lives in Vercel Blob; there is no database.

**Pipeline (`lib/`)** — `runDigest()` in `lib/digest.ts` orchestrates a full run:

1. Fetch raw items in parallel: `fetchRechtspraak` (ATOM/XML from data.rechtspraak.nl, civiel only) and `fetchTuchtrecht` (SRU API, advocatentuchtrecht). The window is the last ~14 days.
2. Dedupe by `ecli` / `identifier`, then `processItems` runs a **two-stage Claude pipeline** in `lib/claude.ts`:
   - **Pre-filter**: short texts without a `SCHIKKING_KEYWORDS` regex hit are skipped without any API call.
   - **Gate** (`GATE_MODEL = claude-haiku-4-5`): cheap relevance check returning `{relevant, reden}`. Only relevant items proceed.
   - **Summary** (`SUMMARY_MODEL = claude-sonnet-4-6`): produces `{headline, feiten, oordeel, relevantie, categorie}`. `les` is derived as the first sentence of `relevantie`.
   - Concurrency is capped at `GATE_CONCURRENCY = 5` via `mapLimit` to stay under Tier-1 Anthropic 50 RPM. When tuning models or concurrency, keep both gate+summary in mind — they share the budget.
3. Merge new lessen into the cumulative `LessenStore`, deduped by source `id`. `mergeLessen` (semantic Claude-based merge) exists but is **not currently called by `runDigest`** — merging is a simple id-based append. Read this before "fixing" duplicates.
4. Write two blobs with **fixed keys** (`addRandomSuffix: false`, `allowOverwrite: true`): `schikking-digest/latest.json` (current week's `DigestResponse`) and `schikking-digest/lessen.json` (cumulative `LessenStore`).

**API routes (`app/api/`)**:
- `digest/` — GET reads blobs via `readDigest()`; POST runs the pipeline (gated by `DIGEST_SECRET` in body).
- `cron/refresh/` — invoked by Vercel Cron Thursdays 07:00 UTC (see `vercel.json`); auth via `Authorization: Bearer $CRON_SECRET`.
- `reset/` — wipes blobs (dev only).

**Email subscriptions** — Open / no-auth: email itself is the identity, signed tokens prove consent. Subscribers live in `schikking_subscriptions` in the **shared Mino Supabase** project (`SUPABASE_URL`/`SUPABASE_SERVICE_KEY`, RLS on, service-role only). `lib/subscriptions.ts` owns CRUD; `lib/email.ts` wraps Resend with two templates (`sendConfirmationEmail`, `sendDigestEmail`); `lib/digest-email.ts` is the cron fan-out called after `runDigest()`. Flow: `POST /api/subscribe` → pending row + confirm mail → `/bevestigen?token=` page sets `confirmed_at` → cron sends digest with both `List-Unsubscribe` (one-click `POST /api/unsubscribe`) and a visible `/uitschrijven?token=` link. **Schikking is not registered in the `apps` table and does not appear in the Mino dashboard** — it just borrows the Supabase project as storage.

**Frontend** — `app/page.tsx` is a server component that calls `readDigest()` directly and renders `components/DigestCard.tsx`. The lessons list is cumulative; the items list is the latest week only.

**Types** — single source of truth in `types/index.ts`. `RawItem` is a discriminated union on `bron: 'rechtspraak' | 'tuchtrecht'` — use the discriminator (not optional fields) when narrowing.

## Conventions

- All user-facing strings and JSON field names are **Dutch** (e.g. `feiten`, `oordeel`, `relevantie`, `categorie`, `bronnen`). Match this when adding fields.
- The Claude `SUMMARY_SYSTEM` prompt forbids em/en/hyphen-dashes joining clauses — preserve this rule if editing prompts.
- Categorie is a closed union (`LesCategorie`); add new values in `types/index.ts` AND in the prompt's allowed list in `lib/claude.ts`.
