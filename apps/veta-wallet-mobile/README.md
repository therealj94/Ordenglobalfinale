# Veta Wallet — App móvil (Expo SDK 51)

Billetera cripto de **Orden Global** en React Native + Expo. La billetera en sí
(precios, balances, transacciones) es de **demostración**, pero la **identidad
está conectada de verdad al motor GENESIS ID**: registro, inicio de sesión,
recuperación de contraseña, verificación KYC y el **GENESIS ID tipo pasaporte**
son reales, provienen del backend y sirven en todo el ecosistema Orden Global.

## 🪪 GENESIS ID (identidad real)
- **Registro / inicio de sesión** contra GENESIS ID (`src/api.js` → `POST /auth/login`, `/auth/register`).
- **Verificación KYC** real: se abre la verificación facial + documento + AML del propio motor (`src/screens/Onboard.js`).
- **Tarjeta GENESIS ID tipo pasaporte** (`src/screens/GidCard.js`): número GID, foto,
  nacionalidad, fecha de nacimiento, emisión/vigencia, firma, zona MRZ decorativa
  y **QR real** que apunta a la página pública de verificación del GID.
  Se abre **tocando la foto de perfil circular** (Inicio, Ajustes o Información personal).
- La sesión se guarda en el dispositivo (`AsyncStorage`) y se rehidrata el perfil
  completo desde `GET /auth/me` al abrir la app, con refresco automático de token.

## 📱 Compatibilidad Android
`minSdkVersion 23` → **Android 6.0+** (cubre >99% de dispositivos Android activos hoy).
React Native 0.74 (usado por Expo SDK 51) ya no soporta Android 5.0 (API 21) internamente — bajar de API 23
requeriría una versión de Expo/React Native de 2022-2023 sin soporte activo, con más riesgo de bugs y
sin varias librerías modernas. El mínimo queda fijado explícitamente vía `expo-build-properties` en `app.json`,
así que no depende del valor por defecto de ninguna herramienta.

## ✨ Incluye
- Animación de arranque con el logo cargando la billetera (varios segundos).
- Login / registro sobre foto de fondo con tarjeta *glass* (conectados a GENESIS ID).
- **KYC real** vía el motor GENESIS ID y **frase de recuperación** de 12 palabras (crear + **verla desde el menú → Ajustes → Seguridad → Frase de recuperación**).
- **GENESIS ID tipo pasaporte**: toca tu foto de perfil circular para abrirlo.
- Dashboard con balance, **botones 3D**, y lista de activos.
- **Velas japonesas (candlestick)** por moneda: toca cualquier activo para abrir su gráfico e info.
- Info de cada moneda: **ORIGEN** (cripto nativa / pagos, 1 gramín = 1/55 g oro), **ONDK** (representación de Orden Global en token), **AUKA** (reserva de oro 1:1) y **AGKA** (reserva de plata 1:1).
- Enviar, Recibir (QR), Comprar/Vender, **Swap**, Tarjeta débito con **flip 3D**, Remesas, Actividad, Notificaciones, Crecer (staking) y Ajustes.
- Gestos: **desliza a los lados** para cambiar de pestaña y **desliza hacia abajo** para refrescar (en Inicio).
- Íconos vectoriales (sin emojis), transiciones y feedback háptico.

## 💰 Precios (simulados, jul 2026)
`ORIGEN = oro/55 = $2.35` · `ONDK = $2.10` · `AUKA = oro $129.26/g` · `AGKA = plata $1.92/g` · `BTC $64,378` · `ETH $1,904` · `USDT/USDC $1`

## ▶️ Correr en VS Code
```bash
cd veta-wallet-app
npm install
npx expo start
```
- Escanea el QR con la app **Expo Go** (Android/iOS), o pulsa `a` para abrir en un emulador Android / `i` para iOS.

> Requiere Node 18+. La primera vez, `npm install` descarga las dependencias de Expo SDK 51.

## 📦 Generar APK descargable (Android)
Con **EAS Build** (recomendado, en la nube — así se generó el APK original):
```bash
cd apps/veta-wallet-mobile
npm install -g eas-cli
eas login                                   # tu cuenta Expo
eas build -p android --profile preview
```
El perfil `preview` (en `eas.json`) genera un **.apk** instalable. Al terminar,
EAS imprime un **enlace de descarga** (y queda también en expo.dev → tu proyecto →
Builds). Ese `.apk` se instala directo en cualquier Android 6.0+.

> El APK no se puede compilar dentro de este entorno automatizado porque no trae
> el Android SDK ni la sesión de tu cuenta Expo; EAS Build lo hace en la nube con
> un comando. El código de esta carpeta ya está verificado (empaqueta con Metro
> sin errores), listo para ese build.

Compilación local (requiere Android SDK + Java):
```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# APK en android/app/build/outputs/apk/release/
```

## 🗂 Estructura
```
App.js                 Navegación, transiciones, swipe, tabbar, toast
src/theme.js           Colores y gradientes (teal + oro)
src/data.js            Tokens, precios, velas, textos de cada moneda, semilla
src/ui.js              Componentes: Logo, Botón3D, Velas, listas, etc.
src/screens/           Splash, Auth, Onboard (KYC + Semilla), Home,
                       TokenDetail, Trade (Send/Receive/Buy/Swap),
                       Card, More (Remesas/Actividad/Notif/Earn/Ajustes)
assets/                logo, ícono, splash, fondo de login
```

## 🔌 Estado de la conexión
- **Ya conectado al motor GENESIS ID**: identidad (registro, login, recuperación
  de contraseña, KYC) y el GENESIS ID tipo pasaporte son reales. Configurable con
  `EXPO_PUBLIC_GENESIS_API_URL` / `EXPO_PUBLIC_GENESIS_APP_URL` (por defecto apuntan
  a producción: `https://api.genesisid.online` y `https://genesisid.online`).
- **Aún demo**: precios, balances y transacciones de la billetera (`src/data.js`).
  Para hacerlos reales, reemplázalos por llamadas a tu API / RPC de Orden Global.

---
Diseño por **Monark Brand Labs** · Orden Global · roa.corphn@gmail.com
