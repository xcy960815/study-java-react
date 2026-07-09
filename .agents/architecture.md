# Architecture

## Entry Flow

```text
src/main.tsx
  -> RouterProvider(router)
  -> src/router/index.tsx
  -> RouteEventBridge
  -> GuestOnlyRoute or RequireAuth
  -> MainLayout
  -> page in src/views/
```

`src/main.tsx` mounts React in `StrictMode` and imports `src/index.css`, which loads Tailwind CSS and sets the root viewport sizing.

## Routing And Menu Model

`src/router/index.tsx` is the source of truth for application routes.

- Public guest-only routes: `/login`, `/register`.
- Authenticated app shell: `/` with `MainLayout`.
- Main business routes are declared in `layoutRoutes`.
- Route `handle` metadata supports:
  - `title`: menu label and page title suffix.
  - `icon`: menu icon key and tab favicon key.
  - `hidden`: exclude from sidebar menu.

`src/layout/index.tsx` derives Ant Design `Menu` items from `layoutRoutes`. If a new route uses a new `handle.icon`, add a matching entry to `iconMap`.

`router.subscribe(...)` updates browser tab title and icon via `src/utils/system-style.tsx`.

## Auth And Session Flow

Token helpers live in `src/utils/token.ts`.

- Access token key: `study_java_react_token`.
- Refresh token key: `study_java_react_refresh_token`.
- `clearAuthTokens()` removes both.

Route guards live in `src/router/route-helpers.tsx`.

- `RequireAuth` redirects unauthenticated users to `/login`.
- `GuestOnlyRoute` redirects already-authenticated users to `/system`.
- `HomeRedirect` sends `/` to `/system` or `/login` based on token presence.
- `RouteEventBridge` listens for `logout` and `token-invalid`, then navigates to `/login`.

Login actions live in `src/store/modules/login.ts`.

- `login()` calls `loginModule.login`, stores token and refresh token, then emits `login`.
- `logout()` calls backend logout, clears local tokens even if the request fails, then emits `logout`.

Cross-module auth events use `src/utils/event-emits.ts`.

## HTTP And API Modules

All business API wrappers should use the shared Axios instance from `src/utils/request.ts`.

Request behavior:

- `baseURL` is `import.meta.env.VITE_API_DOMAIN_PREFIX`.
- Requests outside `/login`, `/register`, `/captcha`, and `/refreshToken` get `Authorization: Bearer <token>` when a token exists.
- Responses return `response.data` directly.
- `401` matching `loginEnum.InvalidToken` triggers refresh-token handling.
- Concurrent requests during refresh are queued and replayed after a new token is stored.
- Refresh failure clears local auth state and emits `token-invalid`.

API wrappers are grouped by domain:

- `src/apis/login.ts`
- `src/apis/goods.ts`
- `src/apis/order.ts`
- `src/apis/system/*`
- `src/apis/monitor/*`

Keep request/response DTO and VO interfaces next to the endpoint wrappers they describe.

## Page And Domain Layout

Pages live under `src/views/` by route/domain. Existing pages are mostly Ant Design CRUD/table-style modules:

- `src/views/system/user`
- `src/views/system/role`
- `src/views/system/menu`
- `src/views/system/data-dictionary`
- `src/views/monitor/operlog`
- `src/views/monitor/server`
- `src/views/monitor/report`
- `src/views/order`
- `src/views/goods`
- `src/views/login`
- `src/views/register`

Shared presentational pieces live in `src/components/ui/`; shared behavior should go in `src/hooks/` or `src/utils/` only when reused.

## Build And Plugin Behavior

`vite.config.ts` defines:

- Alias `@` to `src`.
- React and Tailwind CSS plugins.
- `fileStructurePlugin()`.
- Manual chunks for common vendor libraries.
- Dev server proxy based on env variables.
- Asset output folders under `assets/js`, `assets/css`, `assets/img`, and `assets/other`.

`src/plugins/file-structure.ts` scans `src/`.

- During build/start it writes `public/file-structure.json`.
- During dev it serves `/api/project/file-structure`.
- Treat `public/file-structure.json` as generated output.

## Extension Points

- New business page: add `src/views/<domain>/index.tsx`, export/add APIs under `src/apis/`, and add a route to `layoutRoutes`.
- New sidebar icon: add a key to route `handle.icon` and map it in `src/layout/index.tsx`.
- New API domain: add a file under `src/apis/`, define local DTO/VO types, use the shared `request`.
- New auth behavior: update request interceptors, token helpers, event emitter, and route helpers together.
- New environment: add an env file under `env/` and matching package scripts if needed.
