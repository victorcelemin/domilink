# DomiLink - Guia de Configuracion y Despliegue

## Arquitectura de despliegue

```
[GitHub Repository]
      |
      |-- push a main/develop
      |
      +-- [GitHub Actions]
            |
            +-- backend-deploy.yml  --> Google Cloud Run (5 microservicios)
            +-- web-deploy.yml      --> Vercel (version web)
            +-- mobile-apk.yml      --> EAS Build (APK Android de prueba)
```

## Costos (todo GRATIS)

| Servicio | Plan | Limite gratuito |
|---|---|---|
| Google Cloud Run | Always Free | 2M requests/mes, 360k GB-s CPU |
| Google Artifact Registry | Free tier | 0.5 GB por region |
| Vercel | Hobby | Deploys ilimitados, HTTPS, CDN global |
| EAS Build | Free | 30 builds/mes Android/iOS |
| GitHub Actions | Free | 2000 min/mes en repos publicos |

---

## PARTE 1: Preparar GitHub

### Paso 1.1 — Crear el repositorio

1. Ir a https://github.com/new
2. Nombre: `domilink`
3. Visibilidad: puede ser privado (GitHub Actions gratis en privados hasta 2000 min/mes)
4. **No** inicializar con README (el proyecto ya tiene uno)
5. Click en "Create repository"

### Paso 1.2 — Subir el codigo

Desde la carpeta `proyecto microservicios/` en tu terminal:

```bash
git init
git add .
git commit -m "feat: proyecto inicial DomiLink microservicios"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/domilink.git
git push -u origin main
```

---

## PARTE 2: Configurar Google Cloud (backend)

### Paso 2.1 — Crear proyecto en Google Cloud

1. Ir a https://console.cloud.google.com
2. Click en el selector de proyectos (arriba a la izquierda)
3. "Nuevo proyecto"
4. Nombre: `domilink-prod`
5. Anotar el **Project ID** (ej: `domilink-prod-123456`) — lo necesitaras despues

### Paso 2.2 — Activar las APIs necesarias

En la terminal de Google Cloud Shell (icono de terminal en la barra superior) o con gcloud instalado:

```bash
# Reemplaza con tu Project ID real
gcloud config set project TU_PROJECT_ID

# Activar las APIs requeridas por el workflow
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com
```

### Paso 2.3 — Crear el repositorio en Artifact Registry

```bash
gcloud artifacts repositories create domilink \
  --repository-format=docker \
  --location=us-central1 \
  --description="Imagenes Docker de DomiLink"
```

### Paso 2.4 — Crear Service Account para GitHub Actions

```bash
# Crear la cuenta de servicio
gcloud iam service-accounts create github-actions-domilink \
  --display-name="GitHub Actions - DomiLink"

# Asignar permisos necesarios
PROJECT_ID=$(gcloud config get-value project)

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-domilink@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-domilink@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-domilink@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions-domilink@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Generar y descargar el JSON de credenciales
gcloud iam service-accounts keys create gcp-sa-key.json \
  --iam-account="github-actions-domilink@$PROJECT_ID.iam.gserviceaccount.com"

# Ver el contenido del JSON (lo necesitas para el secreto de GitHub)
cat gcp-sa-key.json
```

**IMPORTANTE:** Borra el archivo `gcp-sa-key.json` despues de copiar su contenido. Nunca lo subas a git.

---

## PARTE 3: Configurar Vercel (version web)

### Paso 3.1 — Crear cuenta y proyecto

1. Ir a https://vercel.com
2. "Sign up" con tu cuenta de GitHub
3. "Add New Project" → selecciona el repo `domilink`
4. **Root Directory**: `domilink-mobile`
5. **Framework Preset**: Other
6. **Build Command**: `npx expo export --platform web --output-dir dist`
7. **Output Directory**: `dist`
8. Click "Deploy" (el primero puede fallar, no importa)

### Paso 3.2 — Obtener credenciales de Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Vincular con el proyecto
cd domilink-mobile
vercel link

# Esto crea .vercel/project.json con orgId y projectId
cat .vercel/project.json
```

El archivo mostrara algo como:
```json
{
  "orgId": "team_XXXXXXXXXX",
  "projectId": "prj_XXXXXXXXXX"
}
```

Para el token:
1. Ir a https://vercel.com/account/tokens
2. "Create Token"
3. Nombre: `github-actions`
4. Scope: Full Account
5. Copiar el token

---

## PARTE 4: Configurar EAS Build (APK Android)

### Paso 4.1 — Crear cuenta en Expo

1. Ir a https://expo.dev
2. "Create account"
3. Verificar el email

### Paso 4.2 — Vincular el proyecto

```bash
cd domilink-mobile

# Login en Expo
npx eas-cli login

# Inicializar EAS en el proyecto
npx eas-cli init

# Esto te pedira que confirmes el proyecto y asignara un projectId
# Actualiza app.json con el projectId real que te da Expo
```

### Paso 4.3 — Obtener token de Expo

1. Ir a https://expo.dev/settings/access-tokens
2. "Create token"
3. Nombre: `github-actions`
4. Copiar el token

---

## PARTE 5: Configurar secretos en GitHub

Ir a: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

Agregar estos secretos uno por uno:

| Nombre del secreto | Valor | De donde se obtiene |
|---|---|---|
| `GCP_PROJECT_ID` | `domilink-prod-123456` | Google Cloud Console (paso 2.1) |
| `GCP_SA_KEY` | `{ "type": "service_account", ... }` | Contenido completo del gcp-sa-key.json (paso 2.4) |
| `JWT_SECRET` | Minimo 32 caracteres aleatorios | Generar con: `openssl rand -hex 32` |
| `VERCEL_TOKEN` | `xxxxxxxxxxx` | Vercel dashboard (paso 3.2) |
| `VERCEL_ORG_ID` | `team_XXXXXXXXXX` | Archivo .vercel/project.json (paso 3.2) |
| `VERCEL_PROJECT_ID` | `prj_XXXXXXXXXX` | Archivo .vercel/project.json (paso 3.2) |
| `EXPO_TOKEN` | `xxxxxxxxxxx` | expo.dev/settings/access-tokens (paso 4.3) |
| `API_GATEWAY_URL` | `https://domilink-api-gateway-xxx.run.app` | Despues del primer deploy del backend |

**Nota sobre API_GATEWAY_URL:** Este secreto lo agregas DESPUES del primer deploy del backend. La URL la encuentras en Google Cloud Console → Cloud Run → domilink-api-gateway.

---

## PARTE 6: Primer deploy

### Secuencia correcta de deploys

```
1. Push a main del codigo
       |
       v
2. Se ejecuta backend-deploy.yml
   → Compila los 5 microservicios con Maven
   → Construye 5 imagenes Docker
   → Las sube a Artifact Registry
   → Despliega en Cloud Run (puede tardar 10-15 min el primero)
       |
       v
3. Copiar la URL del api-gateway desde Cloud Run
   → Agregarla como secreto API_GATEWAY_URL en GitHub
       |
       v
4. Hacer un segundo push (o re-run del workflow web)
   → se ejecuta web-deploy.yml con la URL real
   → build de Expo Web con la URL del backend
   → deploy en Vercel
       |
       v
5. se ejecuta mobile-apk.yml
   → verificacion TypeScript
   → build del APK en EAS Cloud (tarda ~15 min)
   → APK disponible en expo.dev para descargar
```

---

## Resultado final

Despues de la configuracion:

- **Backend**: `https://domilink-api-gateway-HASH.run.app`
  - Auth: `/api/auth/**`
  - Companies: `/api/companies/**`
  - Couriers: `/api/couriers/**`
  - Orders: `/api/orders/**`

- **Web**: `https://domilink-web.vercel.app` (o dominio propio)

- **APK Android**: descargable desde `expo.dev/accounts/TU_USUARIO/projects/domilink/builds`
  - Para instalar: activar "Fuentes desconocidas" en Android → instalar el .apk descargado

---

## Solucion de problemas comunes

**Error: "Permission denied on Artifact Registry"**
→ Verificar que el Service Account tiene el rol `artifactregistry.writer`

**Error: "Cloud Run service not found"**
→ Es normal en el primer deploy. Los servicios internos (auth, company, etc.) deben desplegarse antes que el gateway. El workflow lo maneja con `needs:`.

**Error: "expo export failed"**
→ Verificar que `react-native-maps` tiene el mock web en `src/mocks/react-native-maps.web.js`

**El APK no se conecta al backend**
→ Verificar que `API_GATEWAY_URL` esta configurado en los secretos de GitHub antes del build del APK
