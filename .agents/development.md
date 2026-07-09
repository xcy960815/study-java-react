# Development

## Requirements

- Node.js 22+.
- pnpm 10.33.0.

Recommended setup:

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
```

## Environment Modes

Vite is configured with `envDir: 'env'`; mode files are under `env/`.

- `daily`: `env/.env.daily`, default development mode, frontend port `8081`, API prefix `/api`.
- `pre`: `env/.env.pre`, frontend port `8082`, API prefix `/pre-api`.
- `prod`: `env/.env.prod`, frontend port `8083`, API prefix `/prod-api`.

Key variables:

- `VITE_PORT`: dev server port.
- `VITE_APP_TITLE`: display title.
- `VITE_BASE_URL`: Vite base path.
- `VITE_API_DOMAIN_PREFIX`: frontend request/proxy prefix.
- `VITE_API_SERVER_DOMAIN`: backend target.
- `VITE_API_SERVER_DOMAIN_PREFIX`: backend path prefix after rewrite.

## Install And Develop

```bash
pnpm install
pnpm dev
pnpm dev:pre
pnpm dev:prod
```

`pnpm dev` uses `vite --mode daily`.

## Typecheck, Lint, Format

```bash
pnpm typecheck
pnpm lint
pnpm lint:ci
```

Formatting is configured through Prettier, lint-staged, and `pretty-quick --staged`:

```bash
pnpm format
```

There is no full-repo format script. `pnpm format` only formats staged files.

## Build And Preview

```bash
pnpm build
pnpm build:pre
pnpm build:prod
pnpm preview
pnpm preview:pre
pnpm preview:prod
```

Build scripts run `tsc -b` before `vite build`. Preview scripts load the matching env file with `dotenv-cli` and pass `--base $VITE_BASE_URL`.

## CI And Git Hooks

- `pnpm check` runs `pnpm lint:ci && pnpm build:prod`.
- `.github/workflows/quality.yml` runs on pull requests and pushes to `main`/`master`.
- Husky is installed through `prepare`.
- `lint-staged` runs `eslint --fix` and `prettier --write` for staged `js/ts/tsx/vue` files.
- `pnpm commit` starts Commitizen using `cz-customizable`.

## Docker And Deployment

```bash
docker build -t study-java-react .
docker run -p 8080:80 study-java-react
```

The Dockerfile builds with Node 22 and serves `dist/` from Nginx. The tag-triggered Docker workflow builds and pushes `xcy960815/study-java-react` for tags matching `v*`.

## Documentation

No docs generation command exists. Keep project-facing AI guidance in:

- `AGENTS.md`
- `.agents/project-overview.md`
- `.agents/development.md`
- `.agents/architecture.md`
- `.agents/testing.md`

## Local Preview Notes

- Local dev requires a compatible backend at the configured `VITE_API_SERVER_DOMAIN` if exercising real API flows.
- Authenticated pages require tokens saved by the login flow, or the route guard redirects to `/login`.
- The app shell is a full-screen SPA; browser refreshes for nested routes are handled by Nginx in production.
