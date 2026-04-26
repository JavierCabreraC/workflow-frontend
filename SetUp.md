# Manual de Setup y Uso — Workflow Manager

Sistema de gestión de trámites organizacionales con editor visual de procesos e inteligencia artificial.

---

## Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

| Herramienta | Versión mínima | Verificar con |
|-------------|---------------|---------------|
| Docker Desktop | Cualquiera | `docker --version` |
| Java JDK | 21 | `java --version` |
| Node.js | 18+ | `node --version` |
| uv (Python) | Cualquiera | `uv --version` |

Para instalar `uv` si no lo tienes:
```bash
# Linux / macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

---

## Paso 1 — Base de datos (MongoDB)

El backend levanta MongoDB automáticamente mediante Docker Compose. Solo necesitas tener Docker Desktop corriendo.

```bash
cd workflow-backend
docker compose up -d
```

Verifica que el contenedor está activo:
```bash
docker ps
# Debes ver: workflow-mongo   mongo:7   Up
```

> La base de datos persiste en el volumen `mongo-data`. Para borrarla completamente: `docker compose down -v`.

---

## Paso 2 — Servicio de IA (FastAPI)

### 2.1 Configurar la API key de Anthropic

```bash
cd workflow-ai
cp .env.example .env
```

Edita el archivo `.env` y reemplaza el valor de `ANTHROPIC_API_KEY`:
```env
ANTHROPIC_API_KEY=sk-ant-api03-TU_CLAVE_REAL_AQUI
MONGO_URI=mongodb://root:secret@localhost:27017/workflow_db?authSource=admin
ENVIRONMENT=development
```

Obtén tu API key en: https://console.anthropic.com

### 2.2 Instalar dependencias y arrancar

```bash
cd workflow-ai
uv run uvicorn app.main:app --reload --port 8000
```

Verifica que está activo abriendo: http://localhost:8000/health  
Deberías ver: `{"status": "ok", "service": "workflow-ai"}`

La documentación interactiva de la API está en: http://localhost:8000/docs

---

## Paso 3 — Backend (Spring Boot)

```bash
cd workflow-backend
./gradlew bootRun --args='--spring.profiles.active=dev'
```

> El perfil `dev` conecta al MongoDB de Docker con las credenciales correctas (`root:secret`).

Primera ejecución: Gradle descargará dependencias (~2 minutos). Las siguientes arrancan en segundos.

Verifica que está activo:
```bash
curl http://localhost:8080/health
# {"status":"UP"}
```

---

## Paso 4 — Frontend (Angular)

```bash
cd workflow-frontend
npm install      # Solo la primera vez
npm start
```

Abre el navegador en: http://localhost:4200

---

## Resumen de servicios activos

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend Angular | http://localhost:4200 | Interfaz web |
| Backend Spring Boot | http://localhost:8080 | API REST + WebSocket |
| FastAPI IA | http://localhost:8000 | Servicio de inteligencia artificial |
| MongoDB | localhost:27017 | Base de datos |

---

## Uso del sistema

### Roles disponibles

El sistema tiene tres roles con accesos distintos:

| Rol | Acceso | Descripción |
|-----|--------|-------------|
| `ADMIN` | `/editor`, `/analytics` | Diseña las políticas de proceso y ve analíticas |
| `FUNCIONARIO` | `/dashboard` | Atiende las tareas asignadas en su monitor |
| `CLIENTE` | `/tramites` | Consulta el estado de sus trámites |

---

### Crear cuentas de usuario

No hay usuarios predefinidos. Crea las cuentas que necesites desde el endpoint de registro, o directamente desde el formulario de login si el frontend lo expone.

**Opción A — Desde la terminal (recomendado para el primer uso):**

```bash
# Crear admin
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin Principal", "email": "admin@empresa.com", "password": "password123", "role": "ADMIN"}'

# Crear funcionario
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Ana García", "email": "ana@empresa.com", "password": "password123", "role": "FUNCIONARIO"}'

# Crear cliente
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Juan Pérez", "email": "juan@empresa.com", "password": "password123", "role": "CLIENTE"}'
```

**Opción B — Desde Swagger UI del backend:**  
Abre http://localhost:8080/swagger-ui (si está habilitado) o usa el formulario de registro de la app.

---

### Flujo completo de uso

#### 1. ADMIN — Diseñar un proceso

1. Abre http://localhost:4200 e ingresa con el usuario `ADMIN`
2. Serás redirigido automáticamente a **`/editor`** (lista de políticas)
3. Haz clic en **"Nueva política"** → ingresa nombre y descripción → confirma
4. Haz clic en **Editar** para abrir el editor visual

**En el editor (canvas mxGraph):**
- El panel izquierdo muestra los tipos de nodo disponibles — arrástralos al canvas
- Conecta nodos arrastrando desde el borde de uno al borde del siguiente
- Doble clic sobre un nodo o arista para editar su etiqueta
- Usa el **asistente de IA** (panel derecho) para modificar el diagrama con lenguaje natural:
  - *Modo Editor*: escribe una instrucción como "Agrega una tarea de Revisión en el carril Recepción" y el diagrama se modifica automáticamente
  - *Modo Tutor*: pregunta dudas sobre UML o el sistema ("¿Cuándo uso un nodo Fork?")
- Presiona el micrófono para dictar instrucciones por voz (español)
- Haz clic en **Guardar** para persistir el diagrama

**Tipos de nodo disponibles:**

| Tipo | Forma | Uso |
|------|-------|-----|
| `start` | Círculo verde | Inicio del proceso (obligatorio, solo uno) |
| `end` | Círculo rojo | Fin del proceso (obligatorio) |
| `task` | Rectángulo | Actividad que realiza un funcionario |
| `decision` | Rombo | Bifurcación condicional (sí/no) |
| `fork` | Barra gruesa | Inicia tareas en paralelo |
| `join` | Barra gruesa | Espera a que todas las ramas paralelas terminen |

5. Una vez el diagrama está completo (con al menos un nodo `start` y uno `end`), haz clic en **Activar** → el proceso ya puede recibir trámites

---

#### 2. CLIENTE — Iniciar un trámite

1. Ingresa con el usuario `CLIENTE` → serás redirigido a **`/tramites`**
2. Haz clic en **"Nuevo Trámite"**
3. Selecciona la política activa en el desplegable
4. Ingresa nombre y datos de contacto del cliente → confirma
5. Serás llevado a la línea de tiempo del trámite:
   - El paso actual aparece **destacado y pulsante**
   - Los pasos completados muestran quién los atendió y cuánto tardaron
   - Los pasos futuros aparecen en gris

---

#### 3. FUNCIONARIO — Atender tareas

1. Ingresa con el usuario `FUNCIONARIO` → serás redirigido a **`/dashboard`**
2. El monitor muestra tres columnas: **Pendientes**, **En progreso**, **Completadas**
3. Las tareas nuevas llegan en tiempo real (sin recargar la página) vía WebSocket
4. Haz clic en **Atender** en una tarea pendiente → pasa a "En progreso"
5. En el formulario de detalle:
   - Escribe las notas de la gestión realizada
   - Adjunta archivos si es necesario
   - Haz clic en **Completar tarea**
6. El sistema enruta automáticamente al siguiente paso del proceso y notifica al funcionario del siguiente carril

---

#### 4. ADMIN — Ver analíticas

1. Ingresa como `ADMIN` → navega a **`/analytics`** desde el menú lateral
2. Selecciona la política a analizar en el desplegable
3. Verás:
   - **Tarjetas de resumen**: total de trámites activos, completados, tiempo promedio
   - **Tabla de funcionarios**: rendimiento individual con eficiencia calculada
   - **Reporte de IA**: haz clic en "Actualizar análisis" para que la IA identifique cuellos de botella y genere recomendaciones en lenguaje natural

---

## Detener los servicios

```bash
# Frontend: Ctrl+C en la terminal donde corre npm start
# Backend:  Ctrl+C en la terminal donde corre gradlew
# FastAPI:  Ctrl+C en la terminal donde corre uvicorn

# MongoDB (detener el contenedor pero conservar datos):
cd workflow-backend
docker compose stop

# MongoDB (detener y eliminar datos):
docker compose down -v
```

---

## Solución de problemas frecuentes

**El backend no conecta a MongoDB**
- Verifica que Docker Desktop está corriendo y el contenedor `workflow-mongo` está activo: `docker ps`
- Asegúrate de usar el perfil `dev`: `--args='--spring.profiles.active=dev'`

**FastAPI lanza error `anthropic_api_key Field required`**
- El archivo `workflow-ai/.env` no existe o no tiene la clave configurada
- Alternativa rápida: `export ANTHROPIC_API_KEY=tu-clave && uv run uvicorn app.main:app --reload --port 8000`

**El frontend muestra errores CORS**
- Verifica que el backend está corriendo en el puerto 8080
- El backend ya tiene CORS configurado para `http://localhost:4200`

**Las mutaciones de IA no se aplican al diagrama**
- Verifica que FastAPI está corriendo en el puerto 8000 (`curl http://localhost:8000/health`)
- Revisa los logs del backend: buscará errores con el prefijo `FastAPI /ai/diagram error`

**El WebSocket no conecta (tareas no llegan en tiempo real)**
- Verifica que el backend está activo
- El endpoint WebSocket es `ws://localhost:8080/ws` con soporte SockJS

---

## Orden de arranque recomendado

```
1. Docker Desktop (si no está corriendo)
2. MongoDB:   cd workflow-backend && docker compose up -d
3. FastAPI:   cd workflow-ai     && uv run uvicorn app.main:app --reload --port 8000
4. Backend:   cd workflow-backend && ./gradlew bootRun --args='--spring.profiles.active=dev'
5. Frontend:  cd workflow-frontend && npm start
```

Espera a que cada servicio esté completamente iniciado antes de arrancar el siguiente.
