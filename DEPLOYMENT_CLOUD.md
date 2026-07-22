# GENESIS ID — Despliegue en la nube (Render + Vercel + dominio propio)

Esta es la ruta **simple** de despliegue: sin Docker, sin AWS, sin línea de
comandos de infraestructura. Conectas tu repositorio de GitHub y las
plataformas construyen y despliegan solas.

- **Backend + base de datos** → [Render](https://render.com)
- **Frontend (Next.js)** → [Vercel](https://vercel.com)
- **Dominio**: `genesisid.online` (GoDaddy) — `genesisid.online` para la app,
  `api.genesisid.online` para el backend.

Para la ruta completa en AWS (más barata a gran escala, pero mucho más
compleja), ver `DEPLOYMENT.md`.

---

## Fase 1 — Backend + base de datos en Render

El repo ya incluye `render.yaml` en la raíz, así que Render puede crear el
servicio web **y** la base de datos Postgres juntos, con la conexión ya
enchufada entre los dos.

1. Crea una cuenta en https://render.com (puedes entrar con tu cuenta de
   GitHub).
2. En el dashboard, click **New +** → **Blueprint**.
3. Conecta tu repositorio de GitHub (`therealj94/Ordenglobalfinale` o el
   nombre que tengas) y selecciona la rama
   `claude/genesis-id-verification-engine-wj75mj`.
4. Render va a leer `render.yaml` y te va a mostrar 2 recursos por crear:
   - `genesis-id-db` (base de datos Postgres)
   - `genesis-id-api` (servicio web)
5. Antes de confirmar, te va a pedir rellenar algunos valores marcados como
   "sync: false" — estos:
   - `CORS_ORIGIN` → `https://genesisid.online` (lo ajustamos si hace falta
     agregar más orígenes después)
   - `FRONTEND_URL` → `https://genesisid.online`
   - `ADMIN_EMAIL` → el correo que quieras usar para el primer admin
   - `ADMIN_PASSWORD` → una contraseña segura para ese admin
   - `EMAIL_USER` / `EMAIL_PASSWORD` / `EMAIL_FROM` → tus credenciales de
     Gmail (contraseña de aplicación) para que salgan los correos reales.
     Si todavía no las tienes, puedes dejarlas vacías por ahora y las
     agregamos después — el sistema funciona igual, solo no envía correos
     hasta que las configures.
6. Click **Apply** / **Create**. Render va a construir el backend (tarda
   unos minutos la primera vez).
7. Cuando termine, Render te da una URL pública tipo
   `https://genesis-id-api.onrender.com`. Pruébala en el navegador en
   `https://genesis-id-api.onrender.com/health` — debe responder
   `{"status":"ok",...}`.

### Correr las migraciones en Render

La base de datos se crea vacía — hay que correr las migraciones una vez:

1. En el dashboard de Render, entra al servicio `genesis-id-api`.
2. Ve a la pestaña **Shell** (te abre una terminal conectada a tu servicio,
   ya en la nube).
3. Corre:
   ```
   npm run migrate
   npm run seed
   ```
4. Eso crea las tablas y el primer usuario admin con el `ADMIN_EMAIL` /
   `ADMIN_PASSWORD` que pusiste en el paso anterior.

Cuando tengamos todo funcionando, avísame y seguimos con la Fase 2
(frontend en Vercel).

---

## Fase 2 — Frontend en Vercel

1. Crea una cuenta en https://vercel.com (con GitHub).
2. **Add New** → **Project** → importa el mismo repositorio.
3. En la configuración del proyecto:
   - **Root Directory** → `apps/web` (muy importante, porque el frontend
     vive en esa subcarpeta, no en la raíz del repo).
   - **Framework Preset** → Next.js (debería detectarlo solo).
4. En **Environment Variables**, agrega:
   - `NEXT_PUBLIC_API_URL` → `https://genesis-id-api.onrender.com/api`
     (la URL que te dio Render en la Fase 1, con `/api` al final)
   - `NEXT_PUBLIC_APP_URL` → `https://genesisid.online`
   - `NEXT_PUBLIC_ADMIN_URL` → `https://genesisid.online/admin`
5. Click **Deploy**. Cuando termine, te da una URL tipo
   `https://tu-proyecto.vercel.app` — pruébala, debe cargar la pantalla de
   login de GENESIS ID.

---

## Fase 3 — Conectar el dominio `genesisid.online` (GoDaddy)

### 3a. Frontend en Vercel

1. En el proyecto de Vercel → **Settings** → **Domains**.
2. Agrega `genesisid.online` y también `www.genesisid.online`.
3. Vercel te va a mostrar los registros DNS exactos que hay que agregar
   (normalmente un registro **A** para el dominio raíz y un **CNAME** para
   `www`). Copia exactamente lo que te muestre — puede variar.
4. Ve a GoDaddy → tu dominio `genesisid.online` → **DNS** → **Manage DNS**.
5. Agrega ahí los registros que Vercel te mostró (edita si ya existe un
   registro `A` o `CNAME` con el mismo nombre, GoDaddy no deja duplicados).
6. Espera unos minutos a unas horas (propagación DNS) y Vercel marcará el
   dominio como verificado con candado ✅ automáticamente.

### 3b. Backend en Render

1. En el servicio `genesis-id-api` de Render → **Settings** → **Custom
   Domains**.
2. Agrega `api.genesisid.online`.
3. Render te muestra un registro **CNAME** para agregar (algo como
   `api` → `genesis-id-api.onrender.com`).
4. En GoDaddy DNS, agrega ese registro CNAME con nombre `api`.
5. Espera a que Render marque el dominio como verificado (SSL se activa
   solo, gratis, vía Let's Encrypt).

### 3c. Actualizar las variables ahora que hay dominio propio

Una vez ambos dominios estén verificados con su propio certificado:

- En Render (`genesis-id-api`) → **Environment**:
  - `CORS_ORIGIN` → `https://genesisid.online`
  - `FRONTEND_URL` → `https://genesisid.online`
- En Vercel → **Environment Variables**:
  - `NEXT_PUBLIC_API_URL` → `https://api.genesisid.online/api`
  - `NEXT_PUBLIC_APP_URL` → `https://genesisid.online`
  - `NEXT_PUBLIC_ADMIN_URL` → `https://genesisid.online/admin`
- Vuelve a desplegar ambos (Render: **Manual Deploy** → **Deploy latest
  commit**; Vercel: **Deployments** → **Redeploy**) para que tomen los
  nuevos valores.

---

## Notas importantes

- **Render ya no tiene plan gratis para el backend** (solo para sitios
  estáticos). El servicio web "Starter" cuesta ~$7/mes y la base de datos
  "Basic 256mb" ~$7/mes más — total aproximado **~$14/mes**, muy por debajo
  de los ~$110/mes de la ruta AWS. Revisa los precios actuales en
  render.com/pricing antes de confirmar, pueden cambiar.
- **Vercel es gratis** para este tipo de proyecto en su plan Hobby.
- El primer request a Render después de estar inactivo puede tardar unos
  segundos en "despertar" si usas un plan con auto-sleep — normal, no es un
  error.
- Cada vez que hagamos `git push` a la rama conectada, Render y Vercel
  vuelven a desplegar solos automáticamente.
