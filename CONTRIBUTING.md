# Contributing to Services Map

## Project purpose

Services Map is a static Vue 3 + Vite frontend for exploring fictional datacenter, service, infrastructure, dependency, and Kafka topology data.

The project intentionally has:

- no API server;
- no database;
- no runtime data mutation;
- one JSON snapshot at `public/services-data.json`.

## Project map

- `src/App.vue` — application shell and data context setup;
- `src/pages/` — route-level screens;
- `src/components/` — reusable UI and visualization components;
- `src/contexts/` — shared reactive application state;
- `src/lib/service-data.ts` — data loading and runtime shape validation;
- `src/lib/service-data-model.ts` — TypeScript data contracts and derived helpers;
- `public/services-data.json` — fictional data snapshot;
- `public/countries-110m.json` — local geography used by the globe;
- `vite.config.ts` — local standalone and Replit-compatible Vite modes.

## Local development

Use Node.js 24 or newer and pnpm 10.26.1 or newer:

```bash
pnpm install
pnpm run dev:local
```

Open `http://127.0.0.1:5173`. The production-like local preview is:

```bash
pnpm run build:local
pnpm run serve:local
```

It is available at `http://127.0.0.1:4173`.

## Required checks

Before handing work to another developer or committing:

```bash
pnpm run check
```

This runs TypeScript checking, the service-data integrity test, and a production build. For a faster focused check, use `pnpm run typecheck` or `pnpm run test:services-map`.

## Data and architecture rules

1. Keep the local JSON snapshot as the default source.
2. Update the TypeScript contracts and data-integrity tests when the snapshot shape changes.
3. Preserve cross-references between datacenters, deployed services, catalog entities, topology links, builds, and dependencies.
4. An external JSON source is opt-in through `VITE_SERVICE_DATA_URL`; it must support browser CORS and the existing snapshot shape.
5. Do not introduce an API server, database, authentication, background polling, or hidden fallback behavior unless the requirement explicitly changes.
6. Do not put credentials, tokens, or private data in the repository. Use local ignored `.env` files only for non-public development configuration.

## Change workflow

1. Read the relevant existing components and data contracts before editing.
2. Make the smallest change that satisfies the requirement and preserve the current Vue/Vite structure.
3. Keep user-visible errors explicit rather than silently substituting data.
4. Run the relevant checks, then `pnpm run check` before finishing.
5. Summarize changed behavior, checks run, and any remaining limitation.

## Related agent instructions

- [AGENTS.md](AGENTS.md) — shared AI-agent operating rules;
- [GEMINI.md](GEMINI.md) — Gemini Code Assist context;
- [replit.md](replit.md) — Replit Agent and artifact-specific context.