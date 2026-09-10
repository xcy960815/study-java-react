# Testing

## Current State

Vitest 5 + jsdom unit testing is configured (added alongside the order-workflow port).

- Runner: `pnpm test` (`vitest run`); watch mode via `pnpm vitest` if needed.
- Config: `vitest.config.ts` (standalone, does NOT merge `vite.config.ts` to avoid build plugins); it re-declares the `@` → `./src` alias and runs in the `jsdom` environment.
- Test files live beside the source as `*.test.ts` / `*.test.tsx` and must import `describe`/`it`/`expect`/`vi` explicitly from `vitest`.
- Existing coverage: `src/utils/order-workflow.test.ts` (place-order validation, payment idempotency keys, legal actions per status, checkout draft) `src/utils/dashboard-stats.test.ts` (greeting buckets, order-status pie data, stock TOP N), and `src/utils/notification.test.ts` (relative time formatting, order-paid notification content, notification route mapping).
- CI (`.github/workflows/quality.yml`) runs lint, `pnpm test`, and the production build.

## Existing Validation Commands

Use these checks before handing off changes:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build:prod
```

For CI-equivalent validation:

```bash
pnpm lint:ci && pnpm test && pnpm build:prod
```

`pnpm check` runs strict lint and a production build (tests excluded; run `pnpm test` separately when utilities are touched).

## Manual Regression Areas

When no formal tests exist, manually verify the affected flow in a local dev server:

- Login/register redirects and authenticated route guards.
- Sidebar menu generation after route changes.
- Token refresh behavior after API/auth changes.
- CRUD table flows after API wrapper or page edits.
- Environment-specific API proxy behavior after `env/` or `vite.config.ts` changes.
- Build output generation after touching `src/plugins/file-structure.ts`.

## Adding Regression Tests

Tests use the configured Vitest runner; add tests in the same change as the behavior they cover.

Conventions:

- Utility tests beside the source file as `*.test.ts`; component tests as `*.test.tsx` (React Testing Library is not installed yet — add it with pnpm before writing component tests).
- Import test APIs explicitly: `import { beforeEach, describe, expect, it, vi } from 'vitest'` (there is no ambient test types setup; `tsc -b` typechecks test files against these imports).
- jsdom provides `sessionStorage`/`localStorage` — clear them in `beforeEach`; stub `crypto.randomUUID` with `vi.stubGlobal` for deterministic ids.
- Keep tests off the network: exercise pure helpers (e.g. `@/utils/order-workflow`) rather than Axios wrappers.

Good first regression targets:

- `src/router/route-helpers.tsx`: redirects for logged-in/logged-out users.
- `src/layout/index.tsx`: menu generation from `layoutRoutes`.
- `src/utils/token.ts`: token storage helpers with mocked `localStorage`.
- `src/utils/request.ts`: authorization header, refresh queue, invalid-session behavior with mocked Axios/backend.

## AI Testing Workflow

1. Read the affected source and nearby patterns first.
2. For low-risk UI copy/style edits, run at least `pnpm typecheck` or `pnpm lint` if practical.
3. For route, API, auth, or build-plugin changes, run `pnpm lint:ci`, `pnpm test`, and `pnpm build:prod`.
4. When changing tested utilities (currently `src/utils/order-workflow.ts`), extend or update the adjacent `*.test.ts` in the same change.
5. Keep regression tests focused on the behavior that broke or could break.
