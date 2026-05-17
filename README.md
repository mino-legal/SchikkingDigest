# SchikkingDigest

Een wekelijkse digest van Nederlandse rechtspraak over schikkingen en minnelijke regelingen, samengesteld voor procesjuristen.

De app haalt wekelijks automatisch uitspraken op uit het civiele recht en het advocatentuchtrecht, filtert ze op relevantie voor de schikkingspraktijk met behulp van Claude AI, en toont de resultaten als overzichtelijke kaarten met een groeiende lessenlijst.

Bekijk de live versie op [schikken.mino.law](https://schikken.mino.law).

---

## Wat doet het

- **Ophalen** — elke donderdag om 09:00 NL-tijd worden uitspraken opgehaald uit:
  - [rechtspraak.nl](https://data.rechtspraak.nl/) (civiel recht, via ATOM/XML API)
  - [tuchtrecht.overheid.nl](https://tuchtrecht.overheid.nl/) (advocatentuchtrecht, via SRU API)
- **Filteren** — uitspraken worden eerst met een regex gefilterd op sleutelwoorden die betrekking hebben op schikken en daarna beoordeeld door Claude op inhoudelijke relevantie
- **Samenvatten** — relevante uitspraken krijgen een headline, samenvatting en een praktische les
- **Opslaan** — resultaten worden opgeslagen en cumulatief bijgehouden
- **Tonen** — een Next.js frontend toont de digest per week en een groeiende lijst van lessen, te sorteren op categorie of datum

---

## Tech stack

| Laag | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Opslag | Vercel Blob |
| Deployment | Vercel (Hobby) |
| Scheduling | Vercel Cron Jobs |

---

## Lokale ontwikkeling

### Vereisten

- Node.js 20+
- Een Anthropic API-sleutel
- Een Vercel Blob token (voor opslag)

### Installatie

```bash
npm install
```

Maak een `.env.local` aan met:

```env
ANTHROPIC_API_KEY=sk-ant-...
BLOB_READ_WRITE_TOKEN=vercel_blob_...
DIGEST_SECRET=een-zelf-te-kiezen-geheim
CRON_SECRET=een-zelf-te-kiezen-geheim

# Voor de e-mailinschrijvingen (shared Mino Supabase + Resend)
PUBLIC_SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Schikken <schikken@mino.law>
NEXT_PUBLIC_SITE_URL=https://schikken.mino.law
```

Draai de SQL-migratie eenmalig (in Supabase SQL editor of via de CLI):

```bash
supabase db push  # of plak supabase/migrations/001_create_schikking_subscriptions.sql
```

Start de dev-server:

```bash
npm run dev
```

### Digest handmatig aanroepen

```bash
curl -X POST http://localhost:3000/api/digest \
  -H "Content-Type: application/json" \
  -d '{"secret":"<DIGEST_SECRET>"}'
```

---

## API-routes

| Route | Methode | Beschrijving |
|---|---|---|
| `/api/digest` | GET | Geeft de opgeslagen digest terug als JSON |
| `/api/digest` | POST | Start een nieuwe digest-run (vereist `secret` in body) |
| `/api/cron/refresh` | GET | Wordt aangeroepen door de Vercel cron job (vereist `CRON_SECRET` via `Authorization: Bearer`); draait de digest en stuurt de e-mail naar alle bevestigde abonnees |
| `/api/reset` | POST | Reset de opgeslagen digest (alleen voor ontwikkeling) |
| `/api/subscribe` | POST | `{email}` → maakt een pending inschrijving aan en stuurt een bevestigingsmail |
| `/api/unsubscribe` | POST | RFC 8058 one-click uitschrijven (gebruikt door mailclients via `List-Unsubscribe-Post`) |
| `/bevestigen?token=…` | page | Bevestigt een inschrijving via de link uit de e-mail |
| `/uitschrijven?token=…` | page | Schrijft een abonnee uit via de link onderaan elke digest |

---

## Deployment

```bash
vercel --prod
```

Stel de volgende omgevingsvariabelen in via het Vercel-dashboard (Project → Settings → Environment Variables):

- `ANTHROPIC_API_KEY`
- `BLOB_READ_WRITE_TOKEN`
- `DIGEST_SECRET`
- `CRON_SECRET`

De cron job draait automatisch elke donderdag om 07:00 UTC (09:00 NL zomertijd) via de configuratie in `vercel.json`.

---

## Projectstructuur

```
app/
  page.tsx                  # Frontend
  api/
    digest/route.ts         # GET + POST digest endpoint
    cron/refresh/route.ts   # Cron job handler
    reset/route.ts          # Reset endpoint
lib/
  digest.ts                 # Gedeelde runDigest() logica
  rechtspraak.ts            # Rechtspraak.nl ophalen + filteren
  tuchtrecht.ts             # Tuchtrecht SRU ophalen
  claude.ts                 # Claude relevantiefilter + samenvattingen
components/
  DigestCard.tsx            # Uitklapbare uitspraakkaart
types/
  index.ts                  # Gedeelde TypeScript-types
vercel.json                 # Cron job configuratie
```

---

## Licentie

MIT — voel je vrij om het project te forken en aan te passen voor je eigen rechtsgebied of doelgroep.
