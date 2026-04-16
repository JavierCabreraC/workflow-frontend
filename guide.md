# Guía de Arquitectura: workflow-frontend
> Documento de referencia para agente IA (Claude Code / Copilot).  
> Úsalo como contexto al inicio de cada sesión de desarrollo.

---

## Contexto general del proyecto

Sistema web de gestión de trámites organizacionales. Permite a una empresa definir
visualmente los procesos internos (políticas de negocio) como diagramas de actividades
UML con carriles (swimlanes), y hacer seguimiento en tiempo real de cada trámite que
atraviesa esos procesos.

**Tres roles de usuario:**
- **ADMIN:** diseña políticas de negocio en el editor visual, ve analíticas y cuellos de botella
- **FUNCIONARIO:** atiende las tareas que le llegan en su monitor según el flujo activo
- **CLIENTE:** recibe notificaciones push en Flutter sobre el estado de su trámite

**Backend:** Spring Boot en `http://localhost:8080` (desarrollo) — todas las llamadas HTTP pasan por ahí.  
**IA:** FastAPI en `http://localhost:8000` — Angular nunca llama directo a FastAPI, siempre via Spring.  
**Tiempo real:** WebSocket STOMP sobre SockJS desde Spring Boot.

---

## Stack técnico

| Herramienta | Versión | Uso |
|---|---|---|
| Angular | 18 | Framework principal (standalone components) |
| TypeScript | 5.x | Lenguaje |
| Angular Material | 18 | Componentes UI base |
| Angular CDK | 18 | Drag & drop, overlay, virtual scroll |
| mxGraph | latest | Canvas de diagramas swimlane |
| Yjs | 13.x | Sincronización colaborativa en tiempo real (CRDT) |
| @stomp/stompjs | 7.x | WebSocket STOMP con Spring Boot |
| sockjs-client | 1.x | Fallback WebSocket para browsers |
| @auth0/angular-jwt | 5.x | Decodificación y manejo de JWT |
| RxJS | 7.x | Streams reactivos (incluido con Angular) |
| SCSS | — | Estilos con variables CSS |

---

## Árbol completo de archivos

```
workflow-frontend/
├── src/
│   ├── main.ts
│   ├── index.html
│   ├── styles.scss                          # Estilos globales y tema Material
│   │
│   ├── environments/
│   │   ├── environment.ts                   # Dev: apiUrl localhost:8080
│   │   └── environment.prod.ts              # Prod: URL de Cloud Run
│   │
│   └── app/
│       ├── app.config.ts                    # Providers globales (HttpClient, Router, JWT)
│       ├── app.routes.ts                    # Rutas raíz con lazy loading
│       │
│       ├── core/                            # Singletons — un solo instance en toda la app
│       │   ├── models/                      # Interfaces TypeScript (espejo de DTOs del backend)
│       │   │   ├── user.model.ts
│       │   │   ├── policy.model.ts
│       │   │   ├── graph.model.ts
│       │   │   ├── tramite.model.ts
│       │   │   └── task.model.ts
│       │   │
│       │   ├── services/
│       │   │   ├── auth.service.ts          # Login, logout, token, currentUser
│       │   │   ├── policy.service.ts        # CRUD de políticas, grafo
│       │   │   ├── tramite.service.ts       # Trámites y timeline
│       │   │   ├── task.service.ts          # Tareas del funcionario
│       │   │   ├── ai.service.ts            # Prompts al editor IA y tutor
│       │   │   ├── websocket.service.ts     # Conexión STOMP, suscripciones
│       │   │   └── notification.service.ts  # Snackbars, alertas globales
│       │   │
│       │   ├── guards/
│       │   │   ├── auth.guard.ts            # Redirige a /login si no hay token
│       │   │   └── role.guard.ts            # Redirige si el rol no tiene acceso
│       │   │
│       │   └── interceptors/
│       │       ├── jwt.interceptor.ts       # Agrega Bearer token a cada request
│       │       └── error.interceptor.ts     # Manejo global de errores HTTP
│       │
│       ├── shared/                          # Componentes reutilizables entre features
│       │   ├── components/
│       │   │   ├── navbar/
│       │   │   │   ├── navbar.component.ts
│       │   │   │   └── navbar.component.html
│       │   │   ├── sidebar/
│       │   │   │   ├── sidebar.component.ts
│       │   │   │   └── sidebar.component.html
│       │   │   ├── status-badge/
│       │   │   │   ├── status-badge.component.ts
│       │   │   │   └── status-badge.component.html
│       │   │   └── confirm-dialog/
│       │   │       ├── confirm-dialog.component.ts
│       │   │       └── confirm-dialog.component.html
│       │   └── pipes/
│       │       ├── status-label.pipe.ts     # Traduce enum a texto legible
│       │       └── time-ago.pipe.ts         # "hace 5 minutos"
│       │
│       └── features/
│           │
│           ├── auth/                        # ← Pantalla de login
│           │   ├── login/
│           │   │   ├── login.component.ts
│           │   │   └── login.component.html
│           │   └── auth.routes.ts
│           │
│           ├── policy-editor/               # ← Vista principal del ADMIN
│           │   ├── policy-list/
│           │   │   ├── policy-list.component.ts
│           │   │   └── policy-list.component.html
│           │   ├── editor-shell/            # Layout de 3 paneles
│           │   │   ├── editor-shell.component.ts
│           │   │   └── editor-shell.component.html
│           │   ├── canvas/                  # Editor mxGraph
│           │   │   ├── canvas.component.ts
│           │   │   └── canvas.component.html
│           │   ├── node-panel/              # Panel izquierdo con tipos de nodo
│           │   │   ├── node-panel.component.ts
│           │   │   └── node-panel.component.html
│           │   ├── ai-assistant/            # Chat + voz + mutaciones
│           │   │   ├── ai-assistant.component.ts
│           │   │   └── ai-assistant.component.html
│           │   └── policy-editor.routes.ts
│           │
│           ├── dashboard/                   # ← Vista principal del FUNCIONARIO
│           │   ├── task-monitor/            # Panel de tareas con colores
│           │   │   ├── task-monitor.component.ts
│           │   │   └── task-monitor.component.html
│           │   ├── task-detail/             # Formulario para atender una tarea
│           │   │   ├── task-detail.component.ts
│           │   │   └── task-detail.component.html
│           │   └── dashboard.routes.ts
│           │
│           ├── tramite/                     # ← Vista de Atención al Cliente
│           │   ├── tramite-search/
│           │   │   ├── tramite-search.component.ts
│           │   │   └── tramite-search.component.html
│           │   ├── tramite-timeline/
│           │   │   ├── tramite-timeline.component.ts
│           │   │   └── tramite-timeline.component.html
│           │   └── tramite.routes.ts
│           │
│           └── analytics/                  # ← Dashboard de analíticas (ADMIN)
│               ├── analytics-dashboard/
│               │   ├── analytics-dashboard.component.ts
│               │   └── analytics-dashboard.component.html
│               └── analytics.routes.ts
│
├── angular.json
├── package.json
├── tsconfig.json
├── nginx.conf                               # Para el contenedor de producción
└── Dockerfile
```

---

## Descripción de cada archivo

### Configuración raíz

#### `environments/environment.ts`
Variables de entorno para desarrollo local. Contiene `apiUrl: 'http://localhost:8080'`
y `wsUrl: 'http://localhost:8080/ws'` para WebSocket. Angular CLI sustituye este
archivo por `environment.prod.ts` automáticamente al hacer el build de producción.

#### `app.config.ts`
Punto de configuración global de Angular 18 (reemplaza `AppModule`). Registra:
`provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor]))`,
`provideRouter(routes)`, `provideAnimations()`. Es el equivalente moderno
al array `providers` de `AppModule`.

#### `app.routes.ts`
Rutas raíz con lazy loading. Cada feature carga su módulo solo cuando el usuario
navega a esa ruta, reduciendo el bundle inicial.

```typescript
// Estructura esperada
{ path: 'login',     loadChildren: () => import('./features/auth/auth.routes') },
{ path: 'editor',   loadChildren: () => import('./features/policy-editor/...'),
                    canActivate: [authGuard, roleGuard('ADMIN')] },
{ path: 'dashboard', loadChildren: () => import('./features/dashboard/...'),
                    canActivate: [authGuard, roleGuard('FUNCIONARIO')] },
{ path: 'tramites', loadChildren: () => import('./features/tramite/...'),
                    canActivate: [authGuard] },
{ path: 'analytics', loadChildren: () => import('./features/analytics/...'),
                    canActivate: [authGuard, roleGuard('ADMIN')] },
{ path: '',         redirectTo: 'login', pathMatch: 'full' }
```

---

### `core/models/`

#### `user.model.ts`
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'FUNCIONARIO' | 'CLIENTE';
  active: boolean;
}
export interface LoginResponse {
  token: string;
  email: string;
  name: string;
  role: string;
}
```

#### `policy.model.ts`
```typescript
export interface Lane   { id: string; label: string; order: number; }
export interface Node   { id: string; type: NodeType; label: string;
                          laneId: string; x: number; y: number; }
export interface Edge   { id: string; from: string; to: string; label?: string; }
export type NodeType = 'start' | 'end' | 'task' | 'decision' | 'fork' | 'join';
export type PolicyStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export interface Graph  { lanes: Lane[]; nodes: Node[]; edges: Edge[]; }
export interface Policy { id: string; name: string; description: string;
                          status: PolicyStatus; graph: Graph;
                          createdBy: string; createdAt: string; }
export interface Mutation { type: MutationType; payload: Record<string, unknown>; }
export type MutationType = 'ADD_NODE'|'ADD_EDGE'|'DELETE_NODE'|'DELETE_EDGE'|'UPDATE_NODE';
```

#### `tramite.model.ts`
```typescript
export type TramiteStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';
export interface TramiteEvent {
  nodeId: string; nodeName: string; completedBy: string;
  notes: string; startedAt: string; completedAt: string; durationMinutes: number;
}
export interface Tramite {
  id: string; policyId: string; currentNodeId: string;
  status: TramiteStatus; clientName: string; clientContact: string;
  history: TramiteEvent[]; createdAt: string;
}
```

#### `task.model.ts`
```typescript
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
export interface Task {
  id: string; tramiteId: string; nodeId: string; nodeName: string;
  assignedToRole: string; status: TaskStatus;
  notes?: string; startedAt?: string; completedAt?: string;
}
```

---

### `core/services/`

#### `auth.service.ts`
Responsabilidades: llamar a `/auth/login` y `/auth/register`, guardar el token en
`localStorage`, decodificarlo con `@auth0/angular-jwt` para leer el rol y el email,
y exponer un `BehaviorSubject<User|null>` llamado `currentUser$` que el resto de la
app observa para reaccionar a cambios de sesión. También tiene `logout()` que limpia
el token y redirige a `/login`.

**Métodos:**
- `login(email, password): Observable<LoginResponse>`
- `register(name, email, password, role): Observable<User>`
- `me(): Observable<User>`
- `logout(): void`
- `getToken(): string | null`
- `isAuthenticated(): boolean`
- `hasRole(role: string): boolean`

#### `policy.service.ts`
Responsabilidades: CRUD completo de políticas y operaciones sobre el grafo.

**Métodos:**
- `getPolicies(): Observable<Policy[]>`
- `getPolicyById(id): Observable<Policy>`
- `createPolicy(name, description): Observable<Policy>`
- `updateGraph(id, graph: Graph): Observable<Policy>`
- `updateStatus(id, status: PolicyStatus): Observable<Policy>`
- `deletePolicy(id): Observable<void>`

#### `task.service.ts`
Responsabilidades: gestión de tareas del funcionario.

**Métodos:**
- `getMyTasks(): Observable<Task[]>` — llama a `GET /tasks/my`
- `startTask(taskId): Observable<Task>`
- `completeTask(taskId, notes, attachments): Observable<Task>`

#### `tramite.service.ts`
Responsabilidades: iniciar trámites y consultar su estado.

**Métodos:**
- `createTramite(policyId, clientName, clientContact): Observable<Tramite>`
- `searchTramites(query): Observable<Tramite[]>`
- `getTramiteById(id): Observable<Tramite>`
- `getTimeline(id): Observable<TramiteEvent[]>`
- `registerFcmToken(tramiteId, token): Observable<void>`

#### `ai.service.ts`
Responsabilidades: comunicación con los endpoints de IA del backend (que a su vez
llaman a FastAPI). Gestiona el `sessionId` de la conversación del tutor.

**Métodos:**
- `sendDiagramPrompt(prompt, graph): Observable<{mutations: Mutation[], explanation: string}>`
- `askTutor(prompt): Observable<string>`
- `getBottleneckReport(policyId): Observable<{report: string, bottlenecks: any[]}>`

Internamente, genera un `sessionId` (UUID) al instanciar el servicio y lo incluye
en cada llamada al tutor para que el backend mantenga la memoria de la conversación.

#### `websocket.service.ts`
Responsabilidades: gestionar la conexión STOMP persistente con Spring Boot.
Expone métodos para suscribirse a topics y enviar mensajes.

**Métodos:**
- `connect(): void` — inicializa la conexión con SockJS + STOMP
- `disconnect(): void`
- `subscribe(topic, callback): StompSubscription`
- `publish(destination, body): void`
- `isConnected(): boolean`

**Topics usados:**
- `/topic/policy/{id}` — mutaciones colaborativas del editor
- `/topic/tasks/{userId}` — nueva tarea asignada al funcionario
- `/topic/tramite/{id}` — cambio de estado de un trámite

---

### `core/guards/`

#### `auth.guard.ts`
Función guard (Angular 18 funcional). Verifica que `AuthService.isAuthenticated()`
sea true. Si no, redirige a `/login`. Se aplica a todas las rutas protegidas.

#### `role.guard.ts`
Función guard parametrizable. Recibe el rol requerido y verifica que el usuario
autenticado tenga ese rol. Si no, redirige a la vista correcta según su rol real
(ADMIN → /editor, FUNCIONARIO → /dashboard).

---

### `core/interceptors/`

#### `jwt.interceptor.ts`
Interceptor funcional de Angular 18. Clona cada request saliente y agrega el header
`Authorization: Bearer <token>` si hay token en localStorage. No modifica las
peticiones a rutas públicas (`/auth/login`, `/auth/register`).

#### `error.interceptor.ts`
Intercepta errores HTTP globalmente. Si recibe 401, limpia el token y redirige
al login. Si recibe 400 o 422, muestra un snackbar con el mensaje de error
del campo `message` del `ApiResponse`. Si recibe 500, muestra mensaje genérico.

---

### `shared/`

#### `navbar.component`
Barra superior con: logo/nombre del sistema, nombre del usuario autenticado,
rol badge con color (rojo=ADMIN, azul=FUNCIONARIO), y botón de logout.
Se muestra en todas las vistas excepto login.

#### `sidebar.component`
Menú lateral con navegación contextual según el rol. ADMIN ve: Políticas, Analytics.
FUNCIONARIO ve: Mi Monitor. Ambos ven: Trámites. Marca la ruta activa.

#### `status-badge.component`
Chip/badge visual que recibe un status como input y renderiza con el color
correspondiente. Usado en task-monitor, tramite-search y policy-list.
Colores: PENDING=rojo, IN_PROGRESS=amarillo, COMPLETED/DONE=verde, DRAFT=gris.

#### `confirm-dialog.component`
Dialog de confirmación reutilizable (Angular Material MatDialog). Recibe título
y mensaje como data. Devuelve true/false. Usado antes de acciones destructivas:
eliminar política, rechazar tarea, desactivar política.

#### `status-label.pipe.ts`
Transforma enums a texto legible en español:
`PENDING → 'Pendiente'`, `IN_PROGRESS → 'En progreso'`, `DONE → 'Completado'`, etc.

#### `time-ago.pipe.ts`
Recibe un timestamp ISO y devuelve texto relativo: `'hace 5 minutos'`, `'hace 2 horas'`.
Útil en el monitor de tareas para mostrar cuánto tiempo lleva una tarea esperando.

---

## Features en detalle

---

### Feature: `auth`

#### `login.component`
**Ruta:** `/login` (pública)  
**Vista:** Formulario centrado con email y password. Logo del sistema en la parte superior.  
**Lógica:**
1. Al submit llama a `AuthService.login()`
2. Guarda el token en localStorage
3. Lee el rol del token decodificado
4. Redirige: ADMIN → `/editor`, FUNCIONARIO → `/dashboard`
5. Si hay error 401 muestra mensaje inline bajo el formulario (no un alert)

**Validaciones reactivas:** email con formato válido, password mínimo 8 caracteres,
botón deshabilitado si el formulario es inválido, spinner en el botón mientras se procesa.

---

### Feature: `policy-editor`

Es la vista más compleja. Tiene dos sub-vistas: la lista de políticas y el editor propiamente.

#### `policy-list.component`
**Ruta:** `/editor` (requiere ADMIN)  
**Vista:** Tabla/grid de políticas con: nombre, estado (badge), fecha de creación, acciones.  
**Acciones por política:**
- Editar → navega a `/editor/{id}`
- Activar/Desactivar → llama a `PolicyService.updateStatus()` con confirm dialog
- Eliminar → solo si está en DRAFT, con confirm dialog

**Botón "Nueva política":** abre un dialog con campos nombre y descripción,
llama a `PolicyService.createPolicy()`, y navega al editor con el id creado.

#### `editor-shell.component`
**Ruta:** `/editor/{id}`  
**Vista:** Layout de tres paneles horizontales:

```
┌─────────────────┬──────────────────────────┬─────────────────┐
│   node-panel    │        canvas            │  ai-assistant   │
│   (240px)       │     (flex: 1)            │   (320px)       │
│                 │                          │                 │
│ Tipos de nodo   │  Editor mxGraph          │  Chat IA        │
│ para arrastrar  │  con swimlanes           │  + botón voz    │
└─────────────────┴──────────────────────────┴─────────────────┘
```

Responsabilidades del shell: cargar la política por ID al iniciar, conectar al
WebSocket del topic `/topic/policy/{id}`, distribuir el grafo al canvas,
y recibir mutaciones del `ai-assistant` para pasarlas al `canvas`.

Toolbar superior: nombre de la política (editable inline), estado badge,
botones Guardar, Activar/Desactivar, y contador de usuarios conectados colaborando.

#### `node-panel.component`
Panel izquierdo con los tipos de nodo disponibles para arrastrar al canvas.
Cada ítem es draggable (Angular CDK DragDrop o HTML5 drag nativo compatible con mxGraph).

**Nodos disponibles con ícono y descripción:**
- `start` — Inicio del proceso (círculo verde)
- `end` — Fin del proceso (círculo rojo con borde)
- `task` — Tarea / actividad (rectángulo)
- `decision` — Bifurcación condicional (rombo)
- `fork` — Inicio de proceso paralelo (barra horizontal gruesa)
- `join` — Reunión de procesos paralelos (barra horizontal gruesa)

También tiene un botón "Agregar carril" que añade un nuevo swimlane al canvas.

#### `canvas.component`
**El componente más crítico del frontend.**  
Encapsula mxGraph en un componente Angular. Recibe el `Graph` como `@Input()` y
emite cambios como `@Output() graphChange: EventEmitter<Graph>`.

**Funcionalidades:**
- Renderizar swimlanes verticales con el label del Lane en el encabezado
- Renderizar cada nodo con su forma según el tipo (mxGraph shapes)
- Renderizar aristas con flechas y label opcional
- Drag & drop de nuevos nodos desde `node-panel` al canvas
- Conectar nodos arrastrando desde el puerto de salida de uno al puerto de entrada de otro
- Doble clic en nodo o arista → editar su label inline
- Seleccionar y eliminar con tecla Delete
- Exportar el estado actual como `Graph` (método público `getGraph(): Graph`)
- Importar un `Graph` y renderizarlo completo (método público `loadGraph(graph: Graph)`)
- Aplicar lista de `Mutation[]` de la IA de forma animada (método público `applyMutations(mutations: Mutation[])`)
- Sincronización colaborativa: recibir mutación de WebSocket y aplicarla sin ciclos

**Importante:** mxGraph no tiene tipos TypeScript oficiales. Se instala con
`npm install mxgraph` y se importa como:
```typescript
import mx from 'mxgraph';
const mxInstance = mx({ mxBasePath: '' });
```

#### `ai-assistant.component`
Panel derecho. Dos modos que el usuario alterna con un toggle o pestañas:

**Modo Editor:** el prompt se interpreta como instrucción para modificar el diagrama.
Al enviar: llama a `AiService.sendDiagramPrompt(prompt, canvas.getGraph())`,
recibe `{mutations, explanation}`, pasa las mutaciones a `canvas.applyMutations()`,
y muestra `explanation` como mensaje del asistente en el chat.

**Modo Tutor:** el prompt se envía a `AiService.askTutor(prompt)` y la respuesta
se muestra como mensaje del asistente. Mantiene historial de conversación visible
en el componente.

**Botón de micrófono (Web Speech API):**
```typescript
const recognition = new (window as any).webkitSpeechRecognition();
recognition.lang = 'es-ES';
recognition.continuous = false;
recognition.onresult = (event) => {
  this.promptInput = event.results[0][0].transcript;
};
recognition.start();
```
Al detener la grabación, el texto transcrito queda en el input y el usuario
puede revisarlo antes de enviarlo.

**Indicador de estado:** mientras se procesa un prompt, el canvas muestra
un overlay semitransparente con spinner, y el panel muestra "Procesando...".

---

### Feature: `dashboard`

#### `task-monitor.component`
**Ruta:** `/dashboard` (requiere FUNCIONARIO)  
**Vista:** Panel principal del funcionario.

Tres columnas o pestañas según preferencia de diseño:
- **Pendientes** (rojo): tareas asignadas que no ha iniciado
- **En progreso** (amarillo): tarea que está atendiendo actualmente
- **Completadas** (verde): historial del día o semana

Cada tarjeta de tarea muestra: nombre del trámite, nombre del nodo/paso,
política asociada, tiempo esperando (con `time-ago.pipe`), y botón "Atender".

**Actualización en tiempo real:** al iniciar el componente, se suscribe al topic
`/topic/tasks/{userId}` vía `WebsocketService`. Cuando llega un mensaje (nueva tarea
asignada por el RoutingService del backend), se agrega a la columna Pendientes
sin recargar la página. El título del browser tab muestra el contador de pendientes:
`(3) Workflow — Mi Monitor`.

Al hacer clic en "Atender": llama a `TaskService.startTask()`, la tarjeta pasa
a la columna "En progreso", y navega a `/dashboard/task/{id}`.

#### `task-detail.component`
**Ruta:** `/dashboard/task/{id}`  
**Vista:** Formulario para atender la tarea seleccionada.

Muestra: nombre del paso, instrucciones del nodo (si las tiene), nombre del trámite,
datos del cliente. Campos del formulario: textarea de notas (requerido), input
de archivo para adjuntar documentos (opcional, múltiple).

Botón "Completar tarea": llama a `TaskService.completeTask()`. Al completar,
el backend (RoutingService) enruta automáticamente al siguiente departamento.
La vista muestra confirmación y vuelve al monitor.

---

### Feature: `tramite`

#### `tramite-search.component`
**Ruta:** `/tramites`  
**Vista:** Campo de búsqueda y lista de resultados.

El input tiene debounce de 400ms. Al escribir llama a `TramiteService.searchTramites(query)`.
Cada resultado muestra: ID del trámite, nombre del cliente, política usada,
estado actual (badge), y tiempo desde creación.

También tiene botón "Nuevo trámite": abre un dialog donde selecciona la política
(solo las ACTIVE), ingresa nombre y contacto del cliente, y llama a
`TramiteService.createTramite()`. Al crear, navega a la vista de timeline del trámite.

#### `tramite-timeline.component`
**Ruta:** `/tramites/{id}`  
**Vista:** Línea de tiempo visual del recorrido del trámite.

Cada paso completado muestra: nombre del departamento/nodo, funcionario que atendió,
duración en minutos, notas ingresadas, y timestamp. El paso actual (en progreso)
se muestra destacado con animación de pulsación. Los pasos futuros se muestran
en gris como referencia del flujo restante.

---

### Feature: `analytics`

#### `analytics-dashboard.component`
**Ruta:** `/analytics` (requiere ADMIN)  
**Vista:** Dashboard de métricas y análisis de IA.

**Sección 1 — Selector:** dropdown con las políticas ACTIVE para seleccionar cuál analizar.

**Sección 2 — Tarjetas de resumen:**
- Total de trámites activos
- Total completados
- Tiempo promedio de resolución
- Nodo más lento (resaltado en rojo)

**Sección 3 — Heatmap del flujo:**
Renderiza el grafo de la política de forma simplificada (sin editor, solo visualización).
Cada nodo está coloreado según su tiempo promedio de atención:
- Verde: < 30 minutos promedio
- Amarillo: 30–120 minutos
- Rojo: > 120 minutos

**Sección 4 — Tabla de funcionarios:**
Tabla con columnas: Nombre, Tareas completadas, Tiempo promedio, Eficiencia relativa.
Ordenable por columna.

**Sección 5 — Reporte de IA:**
Card con el texto del reporte generado por la IA (del endpoint `/ai/bottlenecks`).
Botón "Actualizar análisis" que recarga el reporte. Spinner mientras se genera.

---

## Conexión con el backend — Todos los endpoints consumidos

| Método | Endpoint backend | Servicio Angular | Componente que lo usa |
|--------|-----------------|------------------|-----------------------|
| POST | `/auth/login` | `AuthService.login()` | `LoginComponent` |
| POST | `/auth/register` | `AuthService.register()` | `LoginComponent` |
| GET | `/auth/me` | `AuthService.me()` | App init |
| GET | `/policies` | `PolicyService.getPolicies()` | `PolicyListComponent` |
| POST | `/policies` | `PolicyService.createPolicy()` | `PolicyListComponent` |
| GET | `/policies/{id}` | `PolicyService.getPolicyById()` | `EditorShellComponent` |
| PUT | `/policies/{id}/graph` | `PolicyService.updateGraph()` | `EditorShellComponent` |
| PUT | `/policies/{id}/status` | `PolicyService.updateStatus()` | `PolicyListComponent`, `EditorShellComponent` |
| GET | `/tasks/my` | `TaskService.getMyTasks()` | `TaskMonitorComponent` |
| PUT | `/tasks/{id}/start` | `TaskService.startTask()` | `TaskMonitorComponent` |
| PUT | `/tasks/{id}/complete` | `TaskService.completeTask()` | `TaskDetailComponent` |
| POST | `/tramites` | `TramiteService.createTramite()` | `TramiteSearchComponent` |
| GET | `/tramites` | `TramiteService.searchTramites()` | `TramiteSearchComponent` |
| GET | `/tramites/{id}` | `TramiteService.getTramiteById()` | `TramiteTimelineComponent` |
| GET | `/tramites/{id}/timeline` | `TramiteService.getTimeline()` | `TramiteTimelineComponent` |
| POST | `/ai/diagram` | `AiService.sendDiagramPrompt()` | `AiAssistantComponent` |
| POST | `/ai/tutor` | `AiService.askTutor()` | `AiAssistantComponent` |
| GET | `/analytics/policy/{id}/bottlenecks` | `AiService.getBottleneckReport()` | `AnalyticsDashboardComponent` |

**WebSocket topics:**

| Topic | Cuándo llega | Componente suscrito |
|-------|-------------|---------------------|
| `/topic/policy/{id}` | Otro admin aplica mutación en el editor | `EditorShellComponent` |
| `/topic/tasks/{userId}` | RoutingService asigna nueva tarea | `TaskMonitorComponent` |
| `/topic/tramite/{id}` | Trámite cambia de estado | `TramiteTimelineComponent` |

---

## CORS — Configuración requerida en Spring Boot

Para que Angular pueda llamar al backend sin ser bloqueado por el browser,
Spring Boot debe tener CORS configurado en `SecurityConfig.java`:

```java
config.setAllowedOrigins(List.of(
    "http://localhost:4200",              // Angular dev
    "https://workflow-frontend.web.app"   // Firebase Hosting prod (o URL de Cloud Run)
));
```

En desarrollo esto es suficiente. En producción se agrega la URL real del frontend desplegado.

---

## Pasos de implementación — En orden

### Bloque 1 — Fundación (equivalente a Día 3 del plan)
```
1.  Crear proyecto: ng new workflow-frontend --routing --style=scss --ssr=false
2.  Instalar dependencias: npm install @angular/material @angular/cdk
                           @auth0/angular-jwt @stomp/stompjs sockjs-client
3.  Crear estructura de carpetas vacía (core, shared, features)
4.  Crear todos los archivos de models (interfaces TypeScript)
5.  Configurar environments (dev y prod)
6.  Implementar jwt.interceptor.ts y error.interceptor.ts
7.  Configurar app.config.ts con HttpClient e interceptores
8.  Implementar AuthService (login, logout, me, currentUser$)
9.  Implementar auth.guard.ts y role.guard.ts
10. Implementar LoginComponent con formulario reactivo
11. Configurar app.routes.ts con redirección post-login según rol
    ► PRUEBA: Login desde el browser, token en localStorage, redirección
```

### Bloque 2 — Editor de políticas (Días 4–6)
```
12. Instalar mxGraph: npm install mxgraph
13. Implementar PolicyService
14. Implementar PolicyListComponent (tabla con acciones)
15. Implementar EditorShellComponent (layout 3 paneles)
16. Implementar NodePanelComponent (items arrastrables)
17. Implementar CanvasComponent con mxGraph:
    - Renderizar swimlanes
    - Renderizar nodos por tipo
    - Conectar nodos con aristas
    - getGraph() y loadGraph()
18. Implementar guardado: botón Guardar → PolicyService.updateGraph()
    ► PRUEBA: Crear política, diseñar grafo, guardar, recargar y ver que persiste
19. Implementar WebsocketService (conexión STOMP)
20. Conectar editor al topic /topic/policy/{id}
21. Sincronización colaborativa: mutaciones entre dos tabs
    ► PRUEBA: Abrir editor en dos tabs, cambio en una aparece en la otra
```

### Bloque 3 — Asistente IA y voz (Día 5 del plan)
```
22. Implementar AiService (sendDiagramPrompt, askTutor)
23. Implementar AiAssistantComponent:
    - Input de texto y botón enviar
    - Historial de mensajes
    - Modo Editor vs Modo Tutor
24. Conectar mutaciones de IA al canvas: canvas.applyMutations()
25. Implementar botón de micrófono con Web Speech API
    ► PRUEBA: Dictar "agrega una tarea en el primer carril" y ver el nodo aparecer
```

### Bloque 4 — Monitor del funcionario (Días 7–8)
```
26. Implementar TaskService
27. Implementar TaskMonitorComponent:
    - Tres columnas por estado con colores
    - Carga inicial de GET /tasks/my
28. Suscribir TaskMonitor al WebSocket /topic/tasks/{userId}
    (nueva tarea aparece sin recargar)
29. Implementar TaskDetailComponent con formulario y carga de archivos
    ► PRUEBA: Flujo completo — crear trámite, ver en monitor, atender, completar
```

### Bloque 5 — Trámites y analíticas (Días 9 y 14)
```
30. Implementar TramiteService
31. Implementar TramiteSearchComponent con debounce
32. Implementar TramiteTimelineComponent con línea de tiempo visual
    ► PRUEBA: Buscar trámite, ver timeline con pasos completados
33. Implementar AnalyticsDashboardComponent:
    - Selector de política
    - Tarjetas de resumen
    - Tabla de funcionarios
    - Reporte de IA
    ► PRUEBA: Ver reporte de IA con datos reales del backend
```

### Bloque 6 — Pulido y componentes compartidos (Día 15)
```
34. Implementar NavbarComponent con logout
35. Implementar SidebarComponent con navegación por rol
36. Implementar StatusBadgeComponent
37. Implementar ConfirmDialogComponent
38. Implementar StatusLabelPipe y TimeAgoPipe
39. Agregar loading states en todos los botones
40. Agregar manejo de errores inline (no solo snackbar)
41. Verificar responsive en pantallas medianas
```

### Bloque 7 — Build y Docker (Día 16)
```
42. Actualizar environment.prod.ts con URLs de Cloud Run reales
43. Build de producción: ng build --configuration=production
44. Verificar que el build no tiene errores ni warnings críticos
45. Construir imagen Docker con nginx
46. Probar imagen localmente: docker run -p 4200:80 workflow-frontend
47. Push a Google Container Registry y deploy en Cloud Run o Firebase Hosting
```

---

## Comandos de referencia

```bash
# Crear proyecto
ng new workflow-frontend --routing=true --style=scss --ssr=false

# Generar componentes y servicios (ejemplos)
ng generate component features/auth/login --standalone
ng generate service core/services/auth
ng generate guard core/guards/auth --functional
ng generate interceptor core/interceptors/jwt --functional
ng generate pipe shared/pipes/status-label --standalone

# Instalar todas las dependencias
npm install @angular/material @angular/cdk @angular/animations
npm install @auth0/angular-jwt
npm install @stomp/stompjs sockjs-client
npm install mxgraph
npm install --save-dev @types/sockjs-client

# Levantar en desarrollo
ng serve                          # http://localhost:4200

# Build de producción
ng build --configuration=production

# Agregar Angular Material (interactivo)
ng add @angular/material
```

---

## Cómo usar el agente IA con este documento

### Prompt efectivo para cada componente

```
Contexto del proyecto:
- Angular 18 standalone components
- Backend Spring Boot en http://localhost:8080
- Autenticación JWT con interceptor ya configurado
- Angular Material para componentes UI
- SCSS para estilos

Archivo a implementar: [NombreComponent].ts y su .html
Descripción: [pegar la descripción de este documento]
Depende de: [servicios que usa]
Inputs/Outputs si los tiene: [listar]

Implementa el componente completo con su template HTML y estilos SCSS inline.
Usa Angular Material para la UI. El código debe ser standalone (no NgModule).
```

### Orden recomendado de sesiones con el agente

Trabajar un Bloque completo por sesión de agente, empezando siempre por los
modelos e interfaces (TypeScript puro, sin dependencias), luego los servicios,
y finalmente los componentes que los consumen. Nunca empezar un componente
sin tener implementado el servicio del que depende.
