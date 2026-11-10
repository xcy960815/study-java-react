# Testing

## Current State

Vitest 5 + jsdom unit testing is configured (added alongside the order-workflow port).

- Runner: `pnpm test` (`vitest run`); watch mode via `pnpm vitest` if needed.
- Config: `vitest.config.ts` (standalone, does NOT merge `vite.config.ts` to avoid build plugins); it re-declares the `@` → `./src` alias and runs in the `jsdom` environment.
- Test files live beside the source as `*.test.ts` / `*.test.tsx` and must import `describe`/`it`/`expect`/`vi` explicitly from `vitest`.
- Existing coverage includes `src/utils/order-workflow.test.ts`, `src/utils/dashboard-stats.test.ts`, `src/utils/notification.test.ts`, `src/utils/build-route.test.ts` (menu tree + route building), `src/router/ensure-dynamic-routes.test.ts` (per-instance registration, cancellation, reset), `src/router/ensure-dynamic-routes.strict-mode.test.ts` (actual browser-router discovery/deep links/retry), `src/App.test.tsx` (StrictMode and Provider replacement), and `src/store/modules/login.test.ts` (late user responses across sessions).
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

- Utility tests beside the source file as `*.test.ts`; component tests as `*.test.tsx`, using `@testing-library/react`. Use `act` for externally emitted session events or imperative router navigation and clean up mounted trees and router instances after each test.
- Import test APIs explicitly: `import { beforeEach, describe, expect, it, vi } from 'vitest'` (there is no ambient test types setup; `tsc -b` typechecks test files against these imports).
- jsdom provides `sessionStorage`/`localStorage` — clear them in `beforeEach`; stub `crypto.randomUUID` with `vi.stubGlobal` for deterministic ids.
- Keep tests off the network: exercise pure helpers (e.g. `@/utils/order-workflow`) rather than Axios wrappers.

Good first regression targets:

- `src/router/route-helpers.tsx`: redirects for logged-in/logged-out users.
- `src/layout/index.tsx`: menu generation from the backend route tree plus static shell routes.
- `src/utils/token.ts`: token storage helpers with mocked `localStorage`.
- `src/utils/request.ts`: authorization header, refresh queue, invalid-session behavior with mocked Axios/backend.

## AI Testing Workflow

1. Read the affected source and nearby patterns first.
2. For low-risk UI copy/style edits, run at least `pnpm typecheck` or `pnpm lint` if practical.
3. For route, API, auth, or build-plugin changes, run `pnpm lint:ci`, `pnpm test`, and `pnpm build:prod`.
4. When changing tested utilities (currently `src/utils/order-workflow.ts`), extend or update the adjacent `*.test.ts` in the same change.
5. Keep regression tests focused on the behavior that broke or could break.

Dynamic-route regression must include a cold business deep link without App's supplemental ensure, cancellation while menus are loading, separate router instances sharing one menu request, retry after getRoutes failure, and logout/token-invalid followed by login. Verify the rendered page as well as the URL: RouterProvider can retain old state if its instance changes without a key change.

Resident system/monitor regression lives in `src/layout/menu-items.test.ts`, `src/router/route-patches.test.ts`, and the browser-router discovery tests. Cover all six resident pages without getRoutes, duplicate backend directories/leaves, extra dynamic children, and hidden-page menu suppression.
