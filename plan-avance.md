# Plan de Avance — workflow-frontend

**Proyecto:** Angular 18 SPA para gestión de trámites organizacionales  
**Fecha de última actualización:** 2026-04-18  
**Estado general:** ✅ Implementación completa (Bloques 1–6)

---

## Resumen de bloques

| Bloque | Descripción | Estado |
|--------|-------------|--------|
| 1 | Fundación (modelos, guards, interceptores, servicios base, auth) | ✅ Completo |
| 2 | Editor de políticas (mxGraph, canvas, node-panel, ai-assistant, policy-list) | ✅ Completo |
| 3 | Shared (pipes, status-badge, confirm-dialog, navbar, sidebar) | ✅ Completo |
| 4 | Dashboard del funcionario (task-monitor, task-detail, task.service) | ✅ Completo |
| 5 | Trámites y analytics (tramite-search, tramite-timeline, analytics-dashboard) | ✅ Completo |
| 6 | Integración global (app.component layout con navbar/sidebar, rutas lazy) | ✅ Completo |

---

## Lo implementado

### Bloque 1 — Fundación (pre-existente)

| Archivo | Descripción |
|---------|-------------|
| `core/models/user.model.ts` | Interfaz `User` con roles ADMIN / FUNCIONARIO / CLIENTE |
| `core/models/policy.model.ts` | Interfaz `Policy` con estado DRAFT / ACTIVE / INACTIVE |
| `core/models/task.model.ts` | Interfaz `Task` con status PENDING / IN_PROGRESS / COMPLETED |
| `core/models/tramite.model.ts` | Interfaz `Tramite` + `TramiteEvent` para línea de tiempo |
| `core/models/graph.model.ts` | Interfaz `Graph`, `GraphNode`, `GraphEdge` para mxGraph |
| `core/guards/auth.guard.ts` | Redirige a `/login` si no hay JWT válido |
| `core/guards/role.guard.ts` | Redirige según rol: ADMIN→`/editor`, FUNCIONARIO→`/dashboard`, CLIENTE→`/tramites` |
| `core/interceptors/jwt.interceptor.ts` | Agrega header `Authorization: Bearer` (omite rutas `/auth/*`) |
| `core/interceptors/error.interceptor.ts` | 401→logout, 4xx/5xx→snackbar de error |
| `core/services/auth.service.ts` | Login, logout, `restoreSession()`, `currentUser$` BehaviorSubject |
| `core/services/policy.service.ts` | CRUD de políticas, activar/desactivar, exportar XML |
| `core/services/websocket.service.ts` | STOMP sobre SockJS, connect/disconnect/subscribe |
| `core/services/notification.service.ts` | Snackbar wrappers: `success()`, `error()` |
| `core/services/ai-assistant.service.ts` | `getBottleneckReport(policyId)`, `getSuggestions()` |
| `features/auth/login/login.component.ts` | Formulario reactivo email+password, redirección por rol |
| `app.routes.ts` | Rutas lazy: `/editor`, `/dashboard`, `/tramites`, `/analytics` |
| `app.config.ts` | `provideRouter`, `provideHttpClient`, `provideAnimations`, JWT config |

### Bloque 2 — Editor de políticas (pre-existente)

| Archivo | Descripción |
|---------|-------------|
| `features/policy-editor/policy-list/policy-list.component.ts` | Lista de políticas con acciones crear/editar/activar/eliminar |
| `features/policy-editor/policy-list/create-policy-dialog.component.ts` | Dialog para crear nueva política |
| `features/policy-editor/policy-list/confirm-dialog.component.ts` | Dialog de confirmación local del editor |
| `features/policy-editor/editor-shell/editor-shell.component.ts` | Shell con canvas + node-panel + ai-assistant |
| `features/policy-editor/canvas/canvas.component.ts` | Editor mxGraph swimlane con Yjs CRDT |
| `features/policy-editor/node-panel/node-panel.component.ts` | Panel lateral para editar nodos seleccionados |
| `features/policy-editor/ai-assistant/ai-assistant.component.ts` | Chat con IA para análisis del flujo |
| `features/policy-editor/policy-editor.routes.ts` | Rutas: `/` → policy-list, `/:id` → editor-shell |

### Bloque 3 — Shared (implementado en esta sesión)

| Archivo | Descripción |
|---------|-------------|
| `shared/pipes/status-label.pipe.ts` | Traduce status codes a español (era stub vacío) |
| `shared/pipes/time-ago.pipe.ts` | Tiempo relativo en español: "hace X minutos/horas/días" |
| `shared/components/status-badge/status-badge.component.ts` | Chip de color por status (rojo/amarillo/verde/azul/gris/naranja) |
| `shared/components/confirm-dialog/confirm-dialog.component.ts` | Dialog shared reutilizable con flag `danger` |
| `shared/components/navbar/navbar.component.ts` | Barra fija con usuario, badge de rol, botón logout |
| `shared/components/sidebar/sidebar.component.ts` | Nav contextual por rol con `routerLinkActive` |

### Bloque 4 — Dashboard (implementado en esta sesión)

| Archivo | Descripción |
|---------|-------------|
| `core/services/task.service.ts` | `getMyTasks()`, `startTask()`, `completeTask()` con FormData |
| `features/dashboard/task-monitor/task-monitor.component.ts` | Kanban 3 columnas, WebSocket real-time, título de tab dinámico |
| `features/dashboard/task-monitor/task-monitor.component.html` | Template con columnas PENDING/IN_PROGRESS/COMPLETED |
| `features/dashboard/task-detail/task-detail.component.ts` | Formulario reactivo notas+adjuntos, llama `completeTask()` |
| `features/dashboard/task-detail/task-detail.component.html` | Formulario con textarea y file input múltiple |
| `features/dashboard/dashboard.routes.ts` | `''`→TaskMonitor, `task/:id`→TaskDetail (era array vacío) |

### Bloque 5 — Trámites y Analytics (implementado en esta sesión)

| Archivo | Descripción |
|---------|-------------|
| `core/services/tramite.service.ts` | `createTramite()`, `searchTramites()`, `getTramiteById()`, `getTimeline()`, `registerFcmToken()` |
| `features/tramite/tramite-search/tramite-search.component.ts` | Búsqueda con debounce 400ms, lista de resultados, botón nuevo trámite |
| `features/tramite/tramite-search/new-tramite-dialog.component.ts` | Dialog selector política + nombre + contacto del cliente |
| `features/tramite/tramite-timeline/tramite-timeline.component.ts` | Línea de tiempo con WebSocket real-time |
| `features/tramite/tramite-timeline/tramite-timeline.component.html` | Timeline vertical: completado/activo(pulsante)/futuro |
| `features/tramite/tramite.routes.ts` | `''`→TramiteSearch, `:id`→TramiteTimeline (era array vacío) |
| `features/analytics/analytics-dashboard/analytics-dashboard.component.ts` | Selector de política, tarjetas resumen, tabla empleados, reporte IA |
| `features/analytics/analytics-dashboard/analytics-dashboard.component.html` | Layout completo con `MatSort`, heatmap de nodos |
| `features/analytics/analytics.routes.ts` | `''`→AnalyticsDashboard (era array vacío) |

### Bloque 6 — Integración global (implementado en esta sesión)

| Archivo | Descripción |
|---------|-------------|
| `app.component.ts` | Importa NavbarComponent, SidebarComponent; expone `isAuthenticated$` |
| `app.component.html` | Layout con navbar+sidebar condicional (oculto en `/login`) |
| `app.component.scss` | `.app-layout` flex, `.app-content` scroll vertical |

---

## Lo faltante / pendiente

### Funcional

| Item | Prioridad | Notas |
|------|-----------|-------|
| Tests unitarios (Karma/Jasmine) para los nuevos componentes | Media | Solo existen specs vacíos generados por CLI |
| Integración Yjs ↔ canvas (multi-cursor real-time) | Baja | Dependencia instalada pero no conectada al canvas mxGraph |
| Firebase Cloud Messaging (FCM) token registration | Baja | `registerFcmToken()` existe en tramite.service pero no hay trigger en el frontend |
| Heatmap de nodos en analytics (colores por tiempo real) | Baja | Actualmente muestra tarjetas; el heatmap visual sobre el grafo requiere integración mxGraph |

### Técnico / calidad

| Item | Prioridad | Notas |
|------|-----------|-------|
| Budget de bundle excedido | Media | `initial` excede límites configurados; ajustar `budgets` en `angular.json` o hacer code-splitting adicional |
| Advertencias CommonJS (mxGraph, sockjs, stompjs) | Baja | Pre-existentes; requieren wrappers ESM o `allowedCommonJsDependencies` en config |
| `analytics-dashboard` usa datos mockeados para tabla de empleados | Media | El backend debe exponer `/analytics/{policyId}/employees`; actualmente los datos son placeholder |
| Endpoint de analytics en backend | Alta | `GET /analytics/{policyId}` con `totalActive`, `totalCompleted`, `avgTime`, `bottlenecks[]` debe existir en Spring Boot |

---

## Flujos de verificación end-to-end

```
1. npm start → sin errores de compilación ✅

2. Login ADMIN
   → redirige a /editor
   → navbar muestra badge rojo "ADMIN"
   → sidebar muestra "Políticas" y "Analytics"
   → /editor carga policy-list con políticas del backend

3. Login FUNCIONARIO
   → redirige a /dashboard
   → navbar muestra badge azul "FUNCIONARIO"
   → sidebar muestra "Mi Monitor"
   → task-monitor carga 3 columnas (vacías si no hay tareas)
   → WebSocket conecta a /topic/tasks/{userId}

4. Login CLIENTE
   → redirige a /tramites
   → navbar muestra badge verde "CLIENTE"
   → tramite-search con input de búsqueda
   → "Nuevo Trámite" abre dialog con políticas ACTIVE
   → crear trámite → navega a /tramites/{id} con timeline

5. FUNCIONARIO: atender tarea
   → task-monitor → botón "Atender" en tarjeta PENDING
   → llama PUT /tasks/{id}/start
   → tarjeta pasa a IN_PROGRESS
   → navega a /dashboard/task/{id}
   → completar con notas (y adjuntos opcionales)
   → llama PUT /tasks/{id}/complete con FormData
   → vuelve al monitor

6. ADMIN: analytics
   → /analytics → dropdown de políticas ACTIVE
   → seleccionar política → carga tarjetas resumen
   → botón "Actualizar análisis" → llama AiAssistantService
   → reporte IA se muestra en card
```

---

## Build status (última ejecución)

```
✅ Application bundle generation complete. [~7s]
⚠️  Budget exceeded: initial bundle size (pre-existing)
⚠️  CommonJS warnings: mxGraph, sockjs-client, @stomp/stompjs (pre-existing)
```

Todos los chunks lazy se generaron correctamente:
- `analytics-routes` · `tramite-routes` · `dashboard-routes`
- `login-component` · `policy-list-component` · `editor-shell-component`
