# 🚀 GENESIS ID - Quick Start Guide (VSCode)

**Guía rápida para ver todo funcionando en 15 minutos**

## ⚡ Requisitos (Instala estos primero)

1. **VSCode**: https://code.microsoft.com/
2. **Node.js 18+**: https://nodejs.org/
3. **Docker Desktop**: https://www.docker.com/products/docker-desktop
   - (Alternativa: PostgreSQL local si lo tienes instalado)

---

## 📋 Step-by-Step

### **PASO 1: Abrir Terminal en VSCode (Ctrl+`)**

### **PASO 2: Clonar Proyecto**

```bash
git clone https://github.com/therealj94/Ordenglobalfinale.git
cd Ordenglobalfinale
code .
```

### **PASO 3: Iniciar PostgreSQL (Docker)**

```bash
docker run --name genesis-id-postgres \
  -e POSTGRES_PASSWORD=localdevpassword \
  -e POSTGRES_DB=genesis_id_db \
  -p 5432:5432 \
  -d postgres:14-alpine

# Espera 5 segundos para que inicie
sleep 5
echo "✅ PostgreSQL iniciado"
```

### **PASO 4: Configurar Backend**

```bash
# Instalar dependencias
npm install

# Crear archivo .env (copiar contenido de abajo)
```

**Crear archivo `.env` en raíz con:**

```env
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=genesis_id_db
DB_USER=postgres
DB_PASSWORD=localdevpassword

JWT_SECRET=tu_super_secret_key_12345
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=tu_refresh_secret_12345
JWT_REFRESH_EXPIRES_IN=7d

VERIFF_API_KEY=test_key
VERIFF_SECRET=test_secret
VERIFF_API_URL=https://stationapi.veriff.com
VERIFF_CALLBACK_URL=http://localhost:3000/api/auth/verify-callback

FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001,http://localhost:3002,http://localhost:3003

EMAIL_SERVICE=gmail
EMAIL_USER=test@gmail.com
EMAIL_PASSWORD=test

LOG_LEVEL=debug
```

```bash
# Crear tablas en base de datos
npm run migrate

# Iniciar backend
npm run dev

# Espera a ver:
# ✅ "Database connected successfully"
# ✅ "GENESIS ID server running on port 3000"
```

**✅ Backend corriendo en http://localhost:3000**

### **PASO 5: Abrir NUEVA Terminal (Ctrl+`)**

```bash
# En la nueva terminal
cd apps/web

# Instalar dependencias
npm install

# Crear .env.local
```

**Crear archivo `.env.local` en `apps/web/` con:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_VERIFF_URL=https://station.veriff.com
NODE_ENV=development
```

```bash
# Iniciar frontend
npm run dev

# Espera a ver:
# ✅ "compiled successfully"
# ✅ "Local: http://localhost:3001"
```

**✅ Frontend corriendo en http://localhost:3001**

### **PASO 6: Abre Browser**

```
http://localhost:3001
```

**¡YA DEBERÍAS VER GENESIS ID!** 🎉

---

## 📱 Interactuar con la App

### **Home Page**
- Ves el landing page profesional
- Botones: "Get Started" y "Sign In"

### **Hacer Registro**
1. Click "Get Started"
2. Llena: Email, Password, Name
3. Click "Create Account"
4. ✅ Te redirige a `/verify`

### **Ver KYC Facial (Nuevo)**
1. Verás 5 pasos en el stepper
2. Click "Start Verification"
3. **Ahora ves:**
   - ✅ Cámara en tiempo real
   - ✅ Guía de rostro (rectángulo azul)
   - ✅ Instrucciones: "Look Straight", "Turn Left", etc.
   - ✅ Botón "Capture Photo"
4. Click "Capture Photo"
5. Vés preview de foto con opción "Retake" o "Continue"
6. Si continúas → Paso siguiente: Scan Document

### **Escanear Documento**
1. Ves opciones: Passport, ID Card, Driver's License
2. Elige una
3. Opciones:
   - **Use Camera**: Abre cámara (back camera)
   - **Upload Photo**: Sube imagen desde PC
4. Sigue guías en pantalla
5. Click "Capture Photo" o sube
6. Ves preview y "Continue"

### **Resultado**
- Si es sandbox/test: Puede ser "Approved" o "Under Review"
- **Approved** → ✅ Ves dashboard
- **Under Review** → ⏳ Admin debe revisar en panel `/admin/reviews`

---

## 🖥️ Acceder a Admin Panel

1. Abre: `http://localhost:3001/admin`
2. **Usuarios de prueba** (crear primero):
   - Email: `admin@test.com`
   - Password: `AdminPassword123`

3. Verás:
   - Dashboard con stats
   - Listar usuarios
   - Verificaciones
   - **Manual Reviews** ← Panel donde admin revisa casos

---

## 🐛 Solucionar Problemas

### **Error: "Connection refused" en port 5432**

```bash
# Verificar Docker
docker ps

# Si no aparece genesis-id-postgres:
docker run --name genesis-id-postgres \
  -e POSTGRES_PASSWORD=localdevpassword \
  -e POSTGRES_DB=genesis_id_db \
  -p 5432:5432 \
  -d postgres:14-alpine
```

### **Error: "npm: command not found"**

- Instala Node.js desde https://nodejs.org/
- Reinicia VSCode

### **Error: "ENOENT: no such file or directory .env"**

- Verifica que creaste `.env` en RAÍZ (no en apps/web)
- Verifica que creaste `.env.local` en `apps/web/`

### **Error: "Port 3000/3001 already in use"**

```bash
# Mata el proceso
lsof -i :3000     # Encuentra el PID
kill -9 <PID>     # Mata el proceso
```

### **Cámara no funciona**

- Verifica permisos de navegador (permitir cámara)
- Usa HTTPS en producción (localhost HTTP está OK)
- Si usas VM: activa redirección USB de cámara

---

## 📸 Feature: Facial Verification

### Componentes Nuevos:

1. **FacialCapture.tsx**
   - Real-time camera
   - Face guide overlay (rectángulo azul)
   - 5 posiciones: straight, left, right, up, down
   - Progress bar
   - Photo preview y retake

2. **DocumentCapture.tsx**
   - Camera + file upload
   - Document type selector
   - Frame guide overlay
   - Capture y retake

3. **KYCFlow.tsx Mejorado**
   - 5 pasos visuales con stepper
   - Progress bar con gradiente
   - Animaciones suaves
   - Responsive design

---

## 🎨 Ver el Diseño

La UI está hecha con **Tailwind CSS**:
- Colores: Blue, Cyan, Purple, Green (profesional)
- Animaciones: Smooth transitions, pulse, bounce
- Layout: Mobile-first responsive
- Iconos: React Icons (FiCamera, FiCheck, etc.)

---

## 📊 Arquitectura

```
Terminal 1: Backend (Node.js)      → :3000
Terminal 2: Frontend (Next.js)     → :3001
PostgreSQL (Docker)                → :5432
```

**Flujo:**
```
http://localhost:3001 (Frontend)
    ↓
POST /api/auth/register (Backend API)
    ↓
INSERT INTO users (PostgreSQL)
    ↓
Redirige a /verify
    ↓
Mostrar KYC (FacialCapture + DocumentCapture)
    ↓
POST /api/auth/verify-init
    ↓
Retorna JWT tokens
    ↓
Acceso a dashboard
```

---

## ✨ Próximos Pasos

### Después de ver funcionando:

1. **Personalizar Colores**
   - Edita `apps/web/components/*.tsx`
   - Cambia clases Tailwind

2. **Conectar Veriff Real**
   - Consigue API Key en https://veriff.com
   - Actualiza .env: VERIFF_API_KEY, VERIFF_SECRET

3. **Desplegar a Producción**
   - Backend: AWS ECS
   - Frontend: Vercel/Netlify
   - DB: AWS RDS

4. **Conectar Apps**
   - Veta Wallet (:3002)
   - My Token Pay (:3003)

---

## 📞 Ayuda Rápida

**Terminal no abre?**
- Ctrl+` (backtick) en VSCode abre terminal

**Quiero ver sin instalar?**
- Usa live version (cuando esté deployada)

**Quiero cambiar puerto?**
- Backend: Edita `PORT=3000` en .env
- Frontend: Edita `npm run dev` en package.json

---

## ✅ Checklist Final

- [ ] Node.js instalado (`node --version`)
- [ ] Docker instalado (`docker --version`)
- [ ] Proyecto clonado
- [ ] PostgreSQL corriendo
- [ ] Backend iniciado (http://localhost:3000/health)
- [ ] Frontend iniciado (http://localhost:3001)
- [ ] Cámara permitida en navegador
- [ ] Puedo ver home page
- [ ] Puedo registrar usuario
- [ ] Puedo ver KYC facial
- [ ] Puedo capturar foto facial
- [ ] Puedo subir documento

---

🎉 **¡Listo! GENESIS ID está funcionando localmente**

Para preguntas: Ver `INTEGRATION.md` para documentación completa
