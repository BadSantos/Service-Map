# Workspace

Shared project guidelines are documented in [CONTRIBUTING.md](CONTRIBUTING.md), and AI-agent instructions are in [AGENTS.md](AGENTS.md). This file contains Replit Agent-specific context only.

## Overview

Static Vue 3 + Vite Services Map application. The application uses an in-browser fictional data snapshot and has no API server or database. The normal Replit workflow uses `pnpm run dev`; local IDE development should use `pnpm run dev:local`.

## Stack

- **Project layout**: root frontend application
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: Vue 3 + Vite
- **Styling**: Tailwind CSS
- **Data source**: Static JSON snapshot loaded with `fetch`
- **Build**: Vite

## Key Commands

- `pnpm run typecheck` — typecheck the root frontend
- `pnpm run test:services-map` — validate snapshot cross-references
- `pnpm run check` — run typecheck, data tests, and production build
- `pnpm run build` — typecheck + build the root frontend
- `pnpm run dev` — run Services Map locally
- `pnpm run dev:local` — run the standalone local IDE mode

## Replit-specific rules

- Preserve the artifact workflow and its platform-provided `PORT` and `BASE_PATH`.
- Do not add an API server, database, or secret values to the static application without an explicit requirement.
- Keep the local `public/services-data.json` snapshot as the default data source.
