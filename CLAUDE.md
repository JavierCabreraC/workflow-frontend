# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Production build → dist/workflow-frontend
npm run watch      # Watch mode build (development)
npm test           # Karma/Jasmine tests
ng lint            # Lint (Angular CLI default)
```

To run a single test file:

```bash
npx ng test --include='**/auth.service.spec.ts'
```

## Architecture

Angular 18 SPA for **workflow management** with three user roles: ADMIN (policy editor), FUNCIONARIO (task dashboard), CLIENTE (trámite tracking).

### Stack
- **Angular 18** — standalone components only (no NgModule)
- **Angular Material 18** — Azure palette theme, custom `.snack-success`/`.snack-error` classes in `styles.scss`
- **mxGraph 4.2.2** — visual swimlane diagram editor in `features/policy-editor/canvas/`
- **Yjs + y-websocket + STOMP/SockJS** — real-time collaboration infrastructure (dependencies wired, services partially stubbed)
- **RxJS** — all state via BehaviorSubjects; no external state library
- **JWT** — `@auth0/angular-jwt`, token in localStorage under key `'token'`

### Directory layout

```
src/app/
├── core/
│   ├── models/        # Shared interfaces: User, Policy, Task, Tramite, Graph
│   ├── services/      # Singletons: auth, policy, task, tramite, ai-assistant, websocket, notification
│   ├── guards/        # authGuard (isAuthenticated) + roleGuard(role)
│   └── interceptors/  # jwt.interceptor (adds Bearer) + error.interceptor (401→logout, 4xx/5xx→snackbar)
├── shared/
│   ├── components/    # navbar, sidebar, status-badge, confirm-dialog
│   └── pipes/         # status-label, time-ago
└── features/          # Lazy-loaded by role
    ├── auth/           # login (email + password, role-based redirect)
    ├── policy-editor/  # ADMIN: canvas, node-panel, ai-assistant, policy-list, editor-shell
    ├── dashboard/      # FUNCIONARIO: task-monitor, task-detail
    ├── tramite/        # CLIENTE: tramite-search, tramite-timeline
    └── analytics/      # ADMIN: analytics-dashboard
```

### Key patterns

- **Standalone components everywhere** — `standalone: true`, `inject()` for DI, no class-based guards/interceptors
- **Lazy loading** — all features via `loadChildren` in `app.routes.ts`
- **Role-based redirects** — `roleGuard` routes ADMIN→`/editor`, FUNCIONARIO→`/dashboard`, CLIENTE→`/tramites`
- **Backend URLs** — Spring Boot at `http://localhost:8080` (proxied through Angular dev server); AI service at `http://localhost:8000` is accessed only via Spring Boot, never directly from this frontend
- **JWT interceptor skip** — only `/auth/login` and `/auth/register` bypass the Bearer token header (hardcoded list in `jwt.interceptor.ts`, not a wildcard)
- **Session restore** — `AuthService.restoreSession()` decodes token on app init, hydrates `currentUser$` BehaviorSubject
- **Notifications** — always use `NotificationService.success/error/info()` (wraps `MatSnackBar`); never call `MatSnackBar` directly

### mxGraph integration

`CanvasComponent` loads mxGraph via CommonJS `require()` (not ES import) because the library lacks proper ES module support:

```ts
this.mx = (require as any)('mxgraph')({ mxBasePath: '', mxLoadResources: false, mxLoadStylesheets: false });
```

**Public API** (called by `EditorShellComponent`):

- `loadGraph(graph: Graph)` — replaces the current diagram
- `getGraph(): Graph` — serializes current mxGraph state to the domain model
- `applyMutations(mutations: Mutation[])` — applies AI-generated or WS-received changes; emits `graphChanged`
- `addLane(label?)` — inserts a new swimlane row

Node types are `start | end | task | decision | fork | join`, each with fixed pixel dimensions in the `NODE_SIZES` constant. Nodes are drag-dropped from `NodePanelComponent` using the browser's native DragEvent API (`dataTransfer.getData('nodeType')`).

### AI assistant (policy-editor)

`AiAssistantComponent` has two modes toggled per-session:

- **editor mode** — `POST /ai/diagram` with `{prompt, graph}` → `{mutations: Mutation[], explanation: string}`; mutations are emitted via `(mutationsReady)` and applied to the canvas, then broadcast over WS
- **tutor mode** — `POST /ai/tutor` with `{prompt, sessionId}` → plain text; conversational only, no diagram changes

Voice input uses the browser's `SpeechRecognition` API (Spanish, `es-ES`).

### Real-time

`WebSocketService` uses STOMP over SockJS. Topic conventions:

- `/topic/policy/{policyId}` — mutation broadcast for collaborative editing (subscribed in `EditorShellComponent`)
- `/topic/tasks/{userId}` — real-time task assignment notifications (subscribed in `TaskMonitorComponent`)

Yjs CRDT is a dependency for multi-user diagram sync but is not yet fully wired. When extending this, connect Yjs awareness to `policy-editor/canvas/` and bind `WebSocketService` to the Yjs provider.

### Error handling

`errorInterceptor` handles: 401 (clears token + redirect to `/login`), 400/422 (shows `error.error.message`), 500 (generic message). 403 and 404 pass through silently — components handle these themselves if needed.

### Environments

`src/environments/environment.ts` and `environment.development.ts` hold `apiUrl` and `wsUrl`. Reference these via the environment object — never hardcode URLs in services.
