# Agent instructions

Read the shared project guide first: [CONTRIBUTING.md](CONTRIBUTING.md).

## Critical constraints

- This is a static Vue 3 + Vite application.
- The source of truth is `public/services-data.json` and its TypeScript contracts.
- Do not invent an API server, database, authentication, polling, or persistence layer.
- Do not add secrets or credentials to source files, Markdown, or `.env.example`.
- Preserve the Replit workflow while keeping local standalone commands working.
- Do not silently hide data-loading or validation failures with mock data.

## Required workflow

1. Inspect the existing implementation before proposing a rewrite.
2. Prefer small, focused changes that match the existing Vue and TypeScript patterns.
3. Run `pnpm run check` after substantive changes.
4. Report files changed, checks run, and any assumptions.

For Gemini-specific guidance, see [GEMINI.md](GEMINI.md). For Replit-specific behavior, see [replit.md](replit.md).