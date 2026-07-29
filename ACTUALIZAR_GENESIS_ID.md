# Cómo actualizar GENESIS ID (producción)

GENESIS ID vive en dos servicios. **Los dos hay que actualizarlos**, porque los
cambios de esta versión tocan ambos:

| Parte | Dónde vive | Qué hace |
|---|---|---|
| **Backend / motor** | Render — `api.genesisid.online` | API, base de datos, verificación, GID |
| **Frontend / web** | Vercel — `www.genesisid.online` | Pantallas, pasaporte, botón "Volver a Veta Wallet" |

> El APK de Veta Wallet **no** trae estos cambios dentro: el botón de regreso y
> el flujo de verificación viven en GENESIS ID. Si no actualizas esto, la app
> nueva sigue chocando con la versión vieja del motor.

---

## Paso 0 — Subir el código

Todo está en la rama `claude/genesis-id-verification-engine-wj75mj`. Cuando la
mezcles a tu rama principal (`main`), Render y Vercel se despliegan solos si
tienes el auto-deploy activado (es lo normal).

Si prefieres desplegar sin mezclar todavía, en cada panel puedes elegir la rama
manualmente (más abajo).

---

## Paso 1 — Backend (Render)

### 1a. Desplegar el código

1. Entra a [dashboard.render.com](https://dashboard.render.com) → servicio **`genesis-id-api`**.
2. **Manual Deploy** → **Deploy latest commit**.
   - Si quieres desplegar la rama de trabajo sin mezclar: **Settings** →
     **Branch** → elige `claude/genesis-id-verification-engine-wj75mj` → guarda,
     y vuelve a **Manual Deploy**.
3. Espera a que el estado quede en **Live** (2–4 minutos).

### 1b. Correr la migración de base de datos ← **no te la saltes**

Esta versión agrega una columna nueva (`address` en `AppRegistrations`), que es
donde se guarda la dirección de Veta Wallet de cada usuario. Sin esto, vincular
la app va a dar error 500.

En Render → servicio `genesis-id-api` → pestaña **Shell**:

```bash
npm run migrate
```

Debe terminar con algo como:

```
== 018-add-app-address: migrated (0.008s)
```

Si `npm run migrate` no arranca porque faltan migraciones viejas marcadas, corre
antes `npm run fix-legacy-migrations` y repite.

### 1c. Revisar variables de entorno

En **Environment**, confirma que `FRONTEND_URL` apunte al dominio **con `www`**
(el dominio raíz sigue con el certificado SSL malo):

```
FRONTEND_URL=https://www.genesisid.online
CORS_ORIGIN=https://www.genesisid.online
```

Si lo cambias, Render redespliega solo.

---

## Paso 2 — Frontend (Vercel)

1. Entra a [vercel.com](https://vercel.com) → tu proyecto de GENESIS ID.
2. **Deployments** → **Redeploy** (o espera el deploy automático del push).
   - Para desplegar la rama de trabajo: **Settings** → **Git** →
     **Production Branch**, o abre el deploy de esa rama y usa
     **Promote to Production**.
3. Confirma en **Settings → Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://api.genesisid.online/api
NEXT_PUBLIC_APP_URL=https://www.genesisid.online
```

Si cambias alguna, hay que **redesplegar** para que tome efecto.

---

## Paso 3 — Comprobar que quedó bien

1. **El motor responde**
   ```
   https://api.genesisid.online/health
   ```
   Debe devolver estado OK.

2. **El endpoint nuevo existe** — abre en el navegador:
   ```
   https://api.genesisid.online/api/auth/verification-session
   ```
   Debe decir que el método no está permitido o pedir datos (**no** "not found").
   Si dice *not found*, el backend no se actualizó.

3. **La web nueva está arriba** — entra a `https://www.genesisid.online`,
   inicia sesión con una cuenta ya verificada y ve al dashboard: debajo de tu
   pasaporte tiene que aparecer el bloque **"Abrir en tus apps del ecosistema"**
   con los botones *Volver a Veta Wallet* y *Volver a My Token Pay*.
   Si no aparece, Vercel no tomó el deploy.

4. **El flujo completo, desde el teléfono** — instala el APK nuevo, crea una
   cuenta, verifica: al terminar debe salir tu pasaporte y el botón
   **"Volver a Veta Wallet"**.

---

## Paso 4 — El APK

El APK se genera aparte (no se despliega solo):

```bash
cd veta-wallet-app
npm install
eas build -p android --profile preview
```

Desinstala la versión anterior antes de instalar la nueva.

---

## Orden recomendado

1. Backend (Render) + **migración**
2. Frontend (Vercel)
3. APK

Así la app nueva nunca queda hablándole a un motor viejo.

---

## Si algo falla

| Síntoma | Causa casi siempre | Solución |
|---|---|---|
| Error 500 al vincular la app | Falta la migración | Paso 1b |
| "not found" en `verification-session` | Backend sin actualizar | Paso 1 |
| No sale el botón "Volver a Veta Wallet" | Vercel sin actualizar | Paso 2 |
| `ERR_SSL_UNRECOGNIZED_NAME_ALERT` | Se está usando el dominio sin `www` | Usa `www.genesisid.online` |
| El correo de recuperar contraseña lleva a un enlace roto | `FRONTEND_URL` sin `www` | Paso 1c |
