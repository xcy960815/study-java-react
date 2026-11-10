# AI Agent Guide

## Project Snapshot

- `study-java-react` is a private React 19 + TypeScript + Vite 7 admin frontend.
- UI stack: Ant Design 6, Tailwind CSS 4, `@ant-design/icons`, `@icon-park/react`.
- State/API stack: Zustand for login actions, Axios for HTTP, `localStorage` for auth tokens.
- Runtime shape: SPA built by Vite, served locally by Vite dev/preview or in production by Nginx from `dist/`.
- Environment modes live in `env/.env.daily`, `env/.env.pre`, and `env/.env.prod`.
- Vitest 5 + jsdom unit tests are configured (`pnpm test`); CI runs ESLint, tests, and production build.

## Sibling Repositories

This repo is the React version of a three-part system; the sibling repos live next to it under `/Users/opera/Documents/my-repositories/`:

- `/Users/opera/Documents/my-repositories/study-java` — the Java backend (Maven, `pom.xml`). Its `docker-compose.yml` creates `study-java-network` plus MySQL, Redis, and the API. This repo's own `docker-compose.yml` only runs the React container and joins that network.
- `/Users/opera/Documents/my-repositories/study-java-vue` — the Vue 3 sibling frontend (Element Plus, Pinia, vue-router 4) for the same backend.

Notes for agents:

- The React version was written to mirror the Vue version's behavior (see the `request.ts` response interceptor comment); when backend contract questions arise, the Vue repo and the backend repo are the reference sources.
- Ollama、DeepSeek、文件上传和 404 已在本仓库实现。Vue 的对话页额外做了 Markdown 渲染，接口和页面入口以本仓库路由为准。
- Do not carry conclusions across repos blindly: dependency usage differs (e.g. lodash/dayjs/uuid/MD5 are actually imported in the Vue repo, while they were unused and removed here), and shared patterns (axios timeout, URL building, error toasts) may have drifted apart.

## Start Here

- Read [.agents/project-overview.md](.agents/project-overview.md) for project purpose, directory map, and generated files.
- Read [.agents/development.md](.agents/development.md) before running commands.
- Read [.agents/architecture.md](.agents/architecture.md) before changing routes, auth, API modules, layout, or build plugins.
- Read [.agents/testing.md](.agents/testing.md) before claiming test coverage or adding regression tests.

## High-Value Paths

- `src/router/index.tsx` defines the static shell (login/register/layout/404), layout route id, and `patchRoutesOnNavigation` deep-link hook.
- `src/router/ensure-dynamic-routes.ts` is the idempotent registrar: `getRoutes` + `buildRoute` + `router.patchRoutes`.
- `src/utils/build-route.tsx` maps backend menu trees to React Router children.
- `src/router/route-helpers.tsx` contains token/guest guards only; session-end router reset lives in `src/App.tsx`.
- `src/layout/index.tsx` generates the sidebar menu from the backend route tree (plus static shell entries such as dashboard).
- `src/store/modules/system.ts` owns `hasAddedRoutes` and the backend route tree.
- `src/utils/request.ts` is the shared Axios instance with auth headers, token refresh, and error handling.
- `src/utils/token.ts` owns token storage keys and helpers.
- `src/utils/websocket.ts` is the shared STOMP/SockJS client (server-monitor push + order-paid notifications).
- `src/utils/order-workflow.ts` owns payment idempotency keys, checkout draft relay, place-order validation, and order-state-conflict detection.
- `src/store/modules/login.ts` owns login/logout actions.
- `src/apis/` contains backend API wrappers and DTO/VO types.
- `src/views/` contains page-level business modules.
- `src/plugins/file-structure.ts` generates `public/file-structure.json` and serves `/api/project/file-structure` in dev.

## Default Workflow For AI Agents

1. Read the relevant route, page, API, store, and utility files before editing.
2. Keep changes small and aligned with existing Ant Design, Tailwind utility classes, route handles, and API wrapper style.
3. For new pages, add the page under `src/views/` with a path that `src/utils/build-route.tsx` can resolve from the backend `component` field, and add a matching menu in the backend; update the shared icon mapping if needed. `staticLayoutRoutes` retains dashboard, profile, password, and the user-approved Vue-compatible system/monitor modules. Other business pages stay backend-driven. Merge duplicate directories and patch new backend children into their resident parents; do not discard the entire backend branch.
4. For backend calls, add or update a typed wrapper in `src/apis/` and call the shared `request` instance.
5. For auth/session behavior, trace `src/utils/request.ts`, `src/utils/token.ts`, `src/utils/event-emits.ts`, and `src/router/route-helpers.tsx` together.
6. Add regression tests with the configured Vitest runner (see .agents/testing.md); keep utility tests beside the source as `*.test.ts`.
7. Run the smallest useful validation first, then broader checks before handoff.

## Common Commands

- Install: `pnpm install`
- Daily dev server: `pnpm dev`
- Pre/prod-mode dev servers: `pnpm dev:pre`, `pnpm dev:prod`
- Tests: `pnpm test`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Strict CI lint: `pnpm lint:ci`
- Production build: `pnpm build:prod`
- Full project check: `pnpm check`
- Preview builds: `pnpm preview`, `pnpm preview:pre`, `pnpm preview:prod`
- Docker image: `docker build -t study-java-react .`

## Important Constraints

- Do not manually edit generated or dependency output: `node_modules/`, `dist/`, `dist-ssr/`, `*.tsbuildinfo`, or `public/file-structure.json`.
- Do not hand-edit `pnpm-lock.yaml`; use `pnpm` commands when dependencies change.
- `public/file-structure.json` is generated by `src/plugins/file-structure.ts` during Vite build/start and is ignored by git.
- Environment variables are loaded from `env/`, not root `.env`, because `vite.config.ts` sets `envDir: 'env'`.
- The app assumes backend API compatibility with the endpoint paths under `src/apis/`; this repo does not include the backend — the Java backend lives at `/Users/opera/Documents/my-repositories/study-java`.
- Keep route `handle.title`, `handle.icon`, and `handle.hidden` accurate because they drive menus and browser tab behavior.
- Dynamic route `component` values from the backend should resolve to files under `src/views/**` (`.vue` suffixes are mapped to `.tsx`). Values containing `layout` use the resident `MainLayout` and must not wrap a second shell.
