# Despliegue en Google Cloud — Workflow Manager

Este documento describe el proceso completo para llevar los tres servicios a producción en Google Cloud Platform.

---

## Arquitectura cloud elegida

```
Usuarios
   │
   ▼
Firebase Hosting  (Angular · CDN global · gratis)
   │  HTTPS
   ▼
Cloud Run — Backend  (Spring Boot · escala automática)
   │  HTTP interno
   ├──► Cloud Run — FastAPI  (IA · escala a cero)
   │         │
   │         ▼
   └──► MongoDB Atlas  (base de datos · región GCP us-central1)
              ▲
              │ (ambos servicios leen/escriben)
```

| Componente | Servicio GCP | Motivo |
|-----------|-------------|--------|
| Frontend Angular | Firebase Hosting | SPA estática, CDN global, certificado SSL automático |
| Backend Spring Boot | Cloud Run | Contenerizado, escala a cero, pago por uso |
| Servicio FastAPI | Cloud Run | Idem; carga baja entre llamadas |
| Base de datos | MongoDB Atlas (en GCP) | MongoDB gestionado, misma región que Cloud Run |
| Imágenes Docker | Artifact Registry | Registro privado de GCP |
| Secretos | Secret Manager | API keys y credenciales de BD |

---

## Prerequisitos

### Herramientas locales

```bash
# 1. Google Cloud CLI
# Descargar desde: https://cloud.google.com/sdk/docs/install
gcloud --version

# 2. Docker Desktop (para construir imágenes)
docker --version

# 3. Firebase CLI (para el frontend)
npm install -g firebase-tools
firebase --version
```

### Cuenta y proyecto GCP

1. Crea un proyecto en https://console.cloud.google.com
2. Activa facturación (Cloud Run y Artifact Registry tienen capa gratuita generosa)
3. Guarda el **Project ID** — lo usarás en todos los comandos

```bash
# Autenticarse
gcloud auth login

# Configurar el proyecto por defecto
gcloud config set project TU_PROJECT_ID

# Habilitar las APIs necesarias
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  firebase.googleapis.com
```

---

## Paso 1 — Base de datos: MongoDB Atlas

Cloud Run no tiene acceso directo a la red privada de MongoDB. Lo más sencillo es usar **MongoDB Atlas** en la misma región de GCP.

### 1.1 Crear el cluster

1. Ve a https://cloud.mongodb.com y crea una cuenta o inicia sesión
2. Crea un nuevo proyecto y dentro un **cluster M0 (gratis)** o **M10+ (producción)**
3. En la creación del cluster, elige:
   - **Cloud Provider:** Google Cloud
   - **Region:** `us-central1` (la misma que usarás para Cloud Run)
4. Una vez creado, ve a **Database Access** y crea un usuario:
   - Usuario: `workflow_user`
   - Password: genera una contraseña segura y guárdala
   - Role: `readWriteAnyDatabase`
5. Ve a **Network Access** → Add IP Address → selecciona **"Allow access from anywhere"** (`0.0.0.0/0`)
   > En producción real puedes restringir a las IPs de Cloud Run, pero requiere IP estática (VPC).
6. En la vista del cluster, haz clic en **Connect** → **Drivers** → copia la connection string:
   ```
   mongodb+srv://workflow_user:<password>@cluster0.xxxxx.mongodb.net/workflow_db?retryWrites=true&w=majority
   ```
   Guarda esta URI — la usarás en los pasos siguientes.

---

## Paso 2 — Guardar secretos en Secret Manager

Centraliza todas las credenciales para no escribirlas en variables de entorno directamente.

```bash
# MongoDB URI (la misma para backend y FastAPI)
echo -n "mongodb-uri" | \
  gcloud secrets create MONGO_URI --data-file=-

# Anthropic API Key (solo FastAPI la necesita)
echo -n "sk-ant-api03-TU_CLAVE" | \
  gcloud secrets create ANTHROPIC_API_KEY --data-file=-

# JWT Secret del backend
echo -n "$(openssl rand -base64 64)" | \
  gcloud secrets create JWT_SECRET --data-file=-
```

Para leer un secreto en el futuro:
```bash
gcloud secrets versions access latest --secret="MONGO_URI"
```

---

## Paso 3 — Artifact Registry (repositorio de imágenes Docker)

```bash
# Crear el repositorio de imágenes en us-central1
gcloud artifacts repositories create workflow-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Imágenes del sistema Workflow Manager"

# Configurar Docker para que use gcloud como autenticador
gcloud auth configure-docker us-central1-docker.pkg.dev
```

El prefijo de tus imágenes será:
```
us-central1-docker.pkg.dev/TU_PROJECT_ID/workflow-repo/
```

---

## Paso 4 — Dockerfile del servicio FastAPI

El archivo `workflow-ai/Dockerfile` no existe aún. Créalo:

```dockerfile
# workflow-ai/Dockerfile
FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --system

COPY app/ ./app/

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Paso 5 — Dockerfile y nginx del Frontend Angular

El frontend tampoco tiene Dockerfile. Créa los dos archivos:

**`workflow-frontend/nginx.conf`:**
```nginx
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;

    # Soporte para rutas de Angular (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache de assets compilados
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
```

**`workflow-frontend/Dockerfile`:**
```dockerfile
# Stage 1: Build Angular
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

# Stage 2: Nginx para servir la SPA
FROM nginx:alpine
COPY --from=builder /app/dist/workflow-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
```

> **Nota:** Cloud Run expone el puerto 8080 por defecto. Ajusta si la carpeta de salida de Angular es diferente (verifica en `angular.json` → `outputPath`).

---

## Paso 6 — Corregir el Dockerfile del Backend

El `workflow-backend/Dockerfile` actual hace referencia a `build.gradle` y `settings.gradle`, pero el proyecto usa la extensión `.kts`. Corrige las líneas:

```dockerfile
# workflow-backend/Dockerfile — versión corregida
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon

COPY src src
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## Paso 7 — Actualizar la URL de producción del Frontend

Antes de construir la imagen Angular, actualiza `workflow-frontend/src/environments/environment.prod.ts` con las URLs definitivas de Cloud Run:

```typescript
// Rellena las URLs después de hacer el primer deploy del backend y FastAPI
export const environment = {
  production: true,
  apiUrl: 'https://workflow-backend-HASH-uc.a.run.app',
  wsUrl:  'https://workflow-backend-HASH-uc.a.run.app/ws'
};
```

> Las URLs exactas las obtienes después del Paso 9. En el primer deploy usa placeholders y actualiza luego.

---

## Paso 8 — Construir y subir las imágenes Docker

Ejecuta estos comandos desde la raíz del repositorio:

```bash
PROJECT_ID=$(gcloud config get-value project)
REGION=us-central1
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/workflow-repo"

# --- FastAPI ---
docker build -t "${REGISTRY}/workflow-ai:latest" ./workflow-ai
docker push "${REGISTRY}/workflow-ai:latest"

# --- Backend Spring Boot ---
docker build -t "${REGISTRY}/workflow-backend:latest" ./workflow-backend
docker push "${REGISTRY}/workflow-backend:latest"

# --- Frontend Angular ---
docker build -t "${REGISTRY}/workflow-frontend:latest" ./workflow-frontend
docker push "${REGISTRY}/workflow-frontend:latest"
```

La primera construcción del backend tarda 3–5 minutos (descarga dependencias Gradle). Las siguientes son rápidas gracias al caché de capas Docker.

---

## Paso 9 — Desplegar en Cloud Run

### 9.1 FastAPI (primero, porque el backend necesita su URL)

```bash
gcloud run deploy workflow-ai \
  --image "${REGISTRY}/workflow-ai:latest" \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --set-secrets "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,MONGO_URI=MONGO_URI:latest" \
  --set-env-vars "ENVIRONMENT=production"
```

Al finalizar, Cloud Run imprime la URL del servicio. Guárdala:
```
Service URL: https://workflow-ai-HASH-uc.a.run.app
```

### 9.2 Backend Spring Boot

```bash
FASTAPI_URL="https://workflow-ai-HASH-uc.a.run.app"  # URL del paso anterior

gcloud run deploy workflow-backend \
  --image "${REGISTRY}/workflow-backend:latest" \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 10 \
  --set-secrets "MONGO_URI=MONGO_URI:latest,JWT_SECRET=JWT_SECRET:latest" \
  --set-env-vars "FASTAPI_URL=${FASTAPI_URL},ENVIRONMENT=production"
```

Guarda también su URL:
```
Service URL: https://workflow-backend-HASH-uc.a.run.app
```

### 9.3 Actualizar CORS del backend con la URL del frontend

Antes de desplegar el frontend, necesitas registrar su URL en la variable de entorno del backend para que CORS la permita. Si usas Firebase Hosting la URL será `https://TU_PROJECT_ID.web.app`.

```bash
gcloud run services update workflow-backend \
  --region us-central1 \
  --set-env-vars "FRONTEND_URL=https://TU_PROJECT_ID.web.app,FASTAPI_URL=${FASTAPI_URL}"
```

---

## Paso 10 — Desplegar el Frontend en Firebase Hosting

Firebase Hosting es más simple y económico que Cloud Run para una SPA estática.

```bash
cd workflow-frontend

# Iniciar sesión en Firebase
firebase login

# Vincular con tu proyecto GCP (usa el mismo Project ID)
firebase use TU_PROJECT_ID

# Compilar Angular para producción
# (asegúrate de que environment.prod.ts tiene las URLs correctas del Paso 7)
npm run build -- --configuration=production

# Desplegar
firebase deploy --only hosting
```

Firebase imprimirá la URL pública:
```
Hosting URL: https://TU_PROJECT_ID.web.app
```

> Si el proyecto no tiene Firebase habilitado: `firebase init hosting` y sigue el asistente. Cuando pregunte por el directorio público, usa `dist/workflow-frontend/browser`.

---

## Paso 11 — Verificar la integración

Comprueba cada servicio en orden:

```bash
# 1. MongoDB Atlas — verifica conectividad desde el backend
curl https://workflow-backend-HASH-uc.a.run.app/health

# 2. FastAPI
curl https://workflow-ai-HASH-uc.a.run.app/health

# 3. Backend con login
curl -X POST https://workflow-backend-HASH-uc.a.run.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@empresa.com","password":"password123","role":"ADMIN"}'

# 4. Frontend
# Abre en el navegador: https://TU_PROJECT_ID.web.app
```

---

## Resumen de URLs en producción

| Servicio | URL |
|---------|-----|
| Frontend | `https://TU_PROJECT_ID.web.app` |
| Backend | `https://workflow-backend-HASH-uc.a.run.app` |
| FastAPI | `https://workflow-ai-HASH-uc.a.run.app` |
| Swagger FastAPI | `https://workflow-ai-HASH-uc.a.run.app/docs` |

---

## Actualizar a una nueva versión

El proceso de actualización es siempre el mismo: rebuild → push → redeploy.

```bash
# Ejemplo: actualizar solo el backend
docker build -t "${REGISTRY}/workflow-backend:latest" ./workflow-backend
docker push "${REGISTRY}/workflow-backend:latest"
gcloud run services update-traffic workflow-backend \
  --to-latest \
  --region us-central1
```

Cloud Run hace el cambio de versión sin downtime (rolling update automático).

---

## Costos estimados (carga baja)

| Servicio | Capa gratuita | Costo estimado uso real |
|---------|--------------|------------------------|
| Cloud Run (backend + AI) | 2M requests/mes gratis | ~$0–5 USD/mes |
| Firebase Hosting | 10 GB transferencia gratis | $0 USD/mes |
| Artifact Registry | 0.5 GB gratis | ~$0–1 USD/mes |
| Secret Manager | 6 secretos gratis | $0 USD/mes |
| MongoDB Atlas M0 | Gratis (512 MB) | $0 USD/mes |
| MongoDB Atlas M10 | — | ~$57 USD/mes |

Para un entorno de desarrollo/demo, el costo total puede ser **$0** usando las capas gratuitas de todos los servicios.

---

## Problemas frecuentes en Cloud

**Cloud Run no puede conectar a MongoDB Atlas**
- Verifica que en MongoDB Atlas → Network Access está permitida la IP `0.0.0.0/0`
- Verifica que el secreto `MONGO_URI` contiene la connection string correcta de Atlas (no la de localhost)

**FastAPI tarda mucho en responder la primera petición**
- Cloud Run escala a cero cuando no hay tráfico. El "cold start" de FastAPI tarda ~3–5 segundos.
- Para evitarlo: `--min-instances 1` en el comando de deploy (tiene costo adicional)

**El frontend no puede conectar al backend (error CORS)**
- Verifica que `FRONTEND_URL` está correctamente seteado en el backend con la URL exacta de Firebase Hosting
- Las URLs en Firebase usan HTTPS; el backend debe aceptar ese origen exacto

**Error 403 al subir imágenes a Artifact Registry**
- Ejecuta `gcloud auth configure-docker us-central1-docker.pkg.dev` y vuelve a intentar

**El backend no lee los secretos de Secret Manager**
- El service account de Cloud Run necesita el rol `Secret Manager Secret Accessor`:
  ```bash
  gcloud projects add-iam-policy-binding TU_PROJECT_ID \
    --member="serviceAccount:TU_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
  ```
