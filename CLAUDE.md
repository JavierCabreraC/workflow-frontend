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

## Architecture

Angular 18 SPA for **workflow management** with three user roles: ADMIN (policy editor), FUNCIONARIO (task dashboard), CLIENTE (trámite tracking).

### Stack
- **Angular 18** — standalone components only (no NgModule)
- **Angular Material 18** — Azure palette theme, custom `.snack-success`/`.snack-error` classes in `styles.scss`
- **mxGraph 4.2.2** — visual swimlane diagram editor in `features/policy-editor/canvas/`
- **Yjs + y-websocket + STOMP/SockJS** — real-time collaboration infrastructure (dependencies wired, services partially stubbed)
- **RxJS** — all state via BehaviorSubjects; no external state library
- **JWT** — `@auth0/angular-jwt`, token in localStorage

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
    ├── policy-editor/  # ADMIN: canvas, node-panel, ai-assistant, policy-list
    ├── dashboard/      # FUNCIONARIO: task-monitor, task-detail
    ├── tramite/        # CLIENTE: tramite-search, tramite-timeline
    └── analytics/      # ADMIN: analytics-dashboard
```

### Key patterns

- **Standalone components everywhere** — `standalone: true`, `inject()` for DI, no class-based guards/interceptors
- **Lazy loading** — all features via `loadChildren` in `app.routes.ts`
- **Role-based redirects** — `roleGuard` routes ADMIN→`/editor`, FUNCIONARIO→`/dashboard`, CLIENTE→`/tramites`
- **Backend URLs** — Spring Boot at `http://localhost:8080` (proxied through Angular dev server); AI service at `http://localhost:8000` is accessed only via Spring Boot, never directly from this frontend
- **JWT interceptor skip** — URLs matching `/auth/*` bypass the Bearer token header
- **Session restore** — `AuthService.restoreSession()` decodes token on app init, hydrates `currentUser$` BehaviorSubject

### Real-time (partially implemented)

`WebSocketService` uses STOMP over SockJS. Yjs CRDT is a dependency for multi-user diagram sync but is not yet fully wired. When extending this, connect Yjs awareness to `policy-editor/canvas/` and bind `WebSocketService` to the Yjs provider.

### Environments

`src/environments/environment.ts` and `environment.development.ts` hold `apiUrl` and `wsUrl`. Reference these via the environment object — never hardcode URLs in services.
