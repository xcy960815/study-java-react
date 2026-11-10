# Architecture

## Entry Flow

```text
src/main.tsx
  -> createAppRouter() outside React rendering
  -> src/App.tsx(initialRouter)
  -> keyed RouterProvider
  -> src/router/index.tsx
  -> RouteEventBridge
  -> GuestOnlyRoute or RequireAuth
  -> MainLayout
  -> page in src/views/ (static shell or patched dynamic children)
```

`src/main.tsx` mounts React in `StrictMode` and imports `src/index.css`, which loads Tailwind CSS and sets the root viewport sizing.

## Routing And Menu Model

The static shell lives in `src/router/index.tsx`. Apart from the explicitly retained system/monitor modules, business pages come from the backend route tree.

- Public guest-only routes: `/login`, `/register`.
- Authenticated app shell: `/` (`id: layout`) with resident `MainLayout`.
- Static layout children (`staticLayoutRoutes`) include `dashboard`, hidden `user/info` / `password`, and the `/lab/virtual-threads` compatibility redirect. The user explicitly approved retaining Vue-compatible `system` (menu/user/role/data-dictionary) and `monitor` (server/report) modules as resident exceptions to backend-driven routing. They share the existing MainLayout; API authorization remains enforced by the backend, as in Vue.
- Resident `system` and `monitor` directories have stable IDs. `route-patches.ts` skips duplicate resident pages and patches new backend children into the existing parent ID. Do not filter out a whole backend directory merely because its root path is resident.
- `ensureDynamicRoutes({ router, patch?, signal? })` (in `src/router/ensure-dynamic-routes.ts`) is idempotent per router, using a `WeakSet`. Calls share only the current session's menu-data promise, never a navigation's `patch` callback or another router's registration result. `hasAddedRoutes` is a UI mirror and must not gate registration. A cancelled navigation does not patch or mark registration complete. Session reset invalidates pending menu responses and cached data.
- Active triggers: `src/App.tsx` (token already present, and on `login`) and `patchRoutesOnNavigation`. All calls explicitly name their router; `MainLayout` does not register routes. `src/main.tsx` creates the initial router outside React rendering, so StrictMode and Suspense retries cannot create discarded instances. `createAppRouter` has no singleton-binding side effect; `App` binds the Provider instance for observation only. Guards (`RequireAuth` / `GuestOnlyRoute`) handle token presence and login-page exclusion.
- Deep links / refresh: every authenticated `patchRoutesOnNavigation` invocation awaits registration for its own router before React Router rematches. Its `matches` may contain only partial parent matches, so do not require the last route to be `catchall`. Menu request failures propagate to a retryable route error view rather than rendering a false 404. Failed menu requests are not cached.
- When background registration fails on a static page such as dashboard, `App` shows a menu-load retry alert bound to that router. A stale failure from a previous instance cannot affect the current session.
- Logout / `token-invalid`: `App` disposes the old router, resets route/user state, creates a new router, and replaces to `/login`. Changing the Provider key is mandatory: replacing only its `router` prop leaves its internal initial state behind. Delayed user-info responses from the old session cannot restore that user.
- Backend-driven paths that are still unknown after ensure render the catch-all 404. Resident system/monitor pages require login and retain Vue's entry behavior; permission to read or change their data remains subject to backend API authorization.
- Route `handle` metadata supports:
  - `title`: menu label and page title suffix.
  - `icon`: menu icon key and tab favicon key.
  - `hidden`: exclude from sidebar menu.

`src/layout/index.tsx` uses `src/layout/menu-items.ts` to recursively merge resident modules with the backend tree by full path. A duplicate backend directory must not replace its resident children. Empty backend directories and leaves with missing components are removed; resident modules remain visible even when omitted from getRoutes. Hidden static pages remain hidden if echoed by the backend. New icons belong in `src/utils/route-icons.tsx`.

`RouteTabMetaSync` updates browser tab title and icon via `src/utils/system-style.tsx`.

## Auth And Session Flow

Token helpers live in `src/utils/token.ts`.

- Access token key: `study_java_react_token`.
- Refresh token key: `study_java_react_refresh_token`.
- `clearAuthTokens()` removes both.

Route guards live in `src/router/route-helpers.tsx`.

- `RequireAuth` redirects unauthenticated users to `/login`, preserving pathname, query, and hash in `state.from`. The catch-all also uses this guard, so an unregistered guest deep link can return to its target after login.
- `GuestOnlyRoute` redirects already-authenticated users to `/dashboard`.
- `HomeRedirect` sends `/` to `/dashboard` or `/login` based on token presence.
- Session-end handling (`logout`, `token-invalid`) lives in `src/App.tsx`: reset dynamic route state, recreate the router, then navigate to `/login`.

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

- New business page: add `src/views/<domain>/index.tsx`, export/add APIs under `src/apis/`, and add a backend menu whose `component` resolves under `src/views/**`. Do not add business pages to `staticLayoutRoutes` unless they must work without `getRoutes`.
- New sidebar icon: add a key to route `handle.icon` and map it in `src/layout/index.tsx`.
- New API domain: add a file under `src/apis/`, define local DTO/VO types, use the shared `request`.
- New auth behavior: update request interceptors, token helpers, event emitter, and route helpers together.
- New environment: add an env file under `env/` and matching package scripts if needed.
