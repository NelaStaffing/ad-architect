# Ad Architect

AI-assisted ad layout generator with Supabase backend and Gemini AI.

## Deploy to Render

This repo is a Vite static site. Deploy it on Render as a **Static Site**.

- **Build command**
  - `npm ci && npm run build`
- **Publish directory**
  - `dist`
- **SPA routing**
  - Configure a rewrite of `/*` to `/index.html` (included in `render.yaml`).

### Environment variables (Render)

Set these in your Render service settings (they are build-time variables for Vite):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_AI_PROVIDER=gemini
```

### Blueprint option

This repo includes `render.yaml`. On Render you can deploy via **Blueprint** to auto-create the service.

## Tech stack

- Vite + React + TypeScript
- shadcn/ui + Tailwind CSS
- Supabase (auth, database, storage, edge functions)
- React Query, React Router

## Getting started

1) Install Node.js (LTS) and pnpm or npm

2) Install deps

```sh
npm i
```

3) Environment variables (create `.env` in project root)

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
# VITE_AI_PROVIDER is no longer needed (Gemini is the only provider)
```

Edge function (Supabase): set these as project secrets

```sh
SUPABASE_URL=...                 # provided by Supabase
SUPABASE_SERVICE_ROLE_KEY=...    # service role key
LOVABLE_API_KEY=...              # if using Lovable AI gateway (optional)
```

4) Start dev server

```sh
npm run dev
```

## Supabase schema

Supabase is the primary database. If you plan to change the schema (tables/columns/relations), update:

- `src/integrations/supabase/types.ts` (generate fresh types from your project)
- `src/integrations/db/providers/supabaseAdapter.ts` (query mapping)

All pages use the adapter, so schema changes are localized to the adapter layer and types.

## AI Provider

Gemini is the AI provider, integrated via n8n webhooks. The Supabase edge function routes requests to configured webhook URLs.

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run preview` – preview production build
- `npm run lint` – lint

