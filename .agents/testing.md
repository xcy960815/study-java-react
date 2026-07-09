# Testing

## Current State

This repository currently has no formal test setup.

Observed facts:

- No `test`, `test:unit`, or `test:e2e` script exists in `package.json`.
- No Vitest, Jest, React Testing Library, or Playwright config exists.
- No `*.test.*`, `*.spec.*`, or `__tests__` files were found.
- CI currently runs ESLint and a production build, not tests.

## Existing Validation Commands

Use these checks before handing off changes:

```bash
pnpm typecheck
pnpm lint
pnpm build:prod
```

For CI-equivalent validation:

```bash
pnpm check
```

`pnpm check` runs strict lint and a production build.

## Manual Regression Areas

When no formal tests exist, manually verify the affected flow in a local dev server:

- Login/register redirects and authenticated route guards.
- Sidebar menu generation after route changes.
- Token refresh behavior after API/auth changes.
- CRUD table flows after API wrapper or page edits.
- Environment-specific API proxy behavior after `env/` or `vite.config.ts` changes.
- Build output generation after touching `src/plugins/file-structure.ts`.

## Adding Regression Tests

If a change needs durable regression coverage, add the test framework in the same change before writing tests.

Recommended first step for this React/Vite project:

- Unit/component tests: Vitest + React Testing Library + jsdom.
- E2E tests: Playwright, only for browser-critical flows such as auth redirects or CRUD flows.

Recommended locations:

- Component/page tests beside the source file as `*.test.tsx`.
- Utility tests beside the source file as `*.test.ts`.
- Larger integration suites under `src/__tests__/` only when they span multiple modules.

Good first regression targets:

- `src/router/route-helpers.tsx`: redirects for logged-in/logged-out users.
- `src/layout/index.tsx`: menu generation from `layoutRoutes`.
- `src/utils/token.ts`: token storage helpers with mocked `localStorage`.
- `src/utils/request.ts`: authorization header, refresh queue, invalid-session behavior with mocked Axios/backend.

## AI Testing Workflow

1. Read the affected source and nearby patterns first.
2. Identify whether existing validation is enough; do not claim automated test coverage when no test runner exists.
3. For low-risk UI copy/style edits, run at least `pnpm typecheck` or `pnpm lint` if practical.
4. For route, API, auth, or build-plugin changes, run `pnpm check`.
5. If adding a test framework, update `package.json`, lockfile, config, and CI/package scripts together.
6. Keep regression tests focused on the behavior that broke or could break.
