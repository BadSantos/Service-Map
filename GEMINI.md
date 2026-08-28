# Gemini Code Assist context

Start with the shared project guide: [CONTRIBUTING.md](CONTRIBUTING.md). The general agent rules are in [AGENTS.md](AGENTS.md).

## Important project context

- Services Map is a static Vue 3 + Vite frontend with fictional data.
- Use `pnpm run dev:local` for local development.
- Use `pnpm run check` before considering a change complete.
- Keep `public/services-data.json` and `src/lib/service-data-model.ts` consistent.
- Keep the local JSON source as the default; external data is opt-in through `VITE_SERVICE_DATA_URL`.
- Do not add a backend, database, authentication, secrets, or runtime polling unless the user explicitly requests a scope change.

When a request is ambiguous, inspect the existing code and explain the smallest compatible approach before making a broad refactor.