# Veriff Integration Guide

## Overview
GENESIS ID integra con Veriff.com para verificación facial. Veriff es una solución de verificación de identidad basada en IA que utiliza video en vivo y reconocimiento de documentos.

## Setup Inicial

### 1. Obtener Credenciales de Veriff
- Ir a https://station.veriff.com/
- Login en tu cuenta Veriff Premium
- Ir a Settings → API Keys
- Copiar:
  - **API Key** (para autenticación)
  - **API Secret** (para validar webhooks)

### 2. Configurar Variables de Entorno
```bash
VERIFF_API_KEY=your_api_key_here
VERIFF_SECRET=your_api_secret_here
VERIFF_API_URL=https://stationapi.veriff.com
VERIFF_CALLBACK_URL=https://genesis-id.orden-global.com/api/auth/verify-callback
```

### 3. Configurar Webhook en Veriff
1. En Veriff Dashboard → Settings → Webhooks
2. Agregar URL de callback: `https://genesis-id.orden-global.com/api/auth/verify-callback`
3. Seleccionar eventos a recibir:
   - Session Created
   - Submitted for Review
   - Approved
   - Rejected
   - Expired

---

## Flujo de Verificación

### 1. Usuario Inicia Verificación
```
Usuario → GENESIS ID Frontend → POST /api/auth/verify-init
```

**Payload:**
```json
{
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "veriffUrl": "https://station.veriff.com/sessions/session-id",
  "sessionId": "veriff-session-id"
}
```

### 2. Usuario Redirigido a Veriff
Frontend redirige a: `veriffUrl`

Veriff:
- Captura video en vivo del usuario
- Captura documento de identidad (pasaporte, licencia, etc.)
- Valida documentos
- Toma decisión (Approved/Rejected)

### 3. Veriff Envía Webhook a GENESIS ID
```
POST /api/auth/verify-callback
```

**Payload:**
```json
{
  "verification": {
    "id": "veriff-session-id",
    "status": "submitted",
    "decision": "approved",
    "timestamp": 1234567890,
    "person": {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1990-01-15"
    },
    "document": {
      "type": "PASSPORT",
      "country": "US",
      "number": "ABC123456"
    }
  }
}
```

### 4. GENESIS ID Procesa Resultado
- Valida firma del webhook (HMAC-SHA256)
- Actualiza BD con resultado
- Si aprobado: crea JWT tokens
- Redirige a usuario a app original con token

---

## API Veriff Endpoints

### Create Session
```
POST https://stationapi.veriff.com/v1/sessions
X-AUTH-CLIENT: {API_KEY}
Content-Type: application/json
```

**Request:**
```json
{
  "verification": {
    "timestamp": 1234567890,
    "vendorData": "user-uuid",
    "person": {
      "givenNames": "John",
      "surname": "Doe",
      "dateOfBirth": "1990-01-15"
    }
  },
  "consent": {
    "processing": true,
    "thirdParties": false
  },
  "redirectUrl": "https://genesis-id.orden-global.com/verify-result"
}
```

**Response:**
```json
{
  "verification": {
    "id": "session-id",
    "url": "https://station.veriff.com/sessions/session-id",
    "sessionToken": "token",
    "timestamp": 1234567890
  }
}
```

### Get Decision
```
GET https://stationapi.veriff.com/v1/sessions/{sessionId}/decision
X-AUTH-CLIENT: {API_KEY}
```

**Response:**
```json
{
  "verification": {
    "id": "session-id",
    "status": "submitted",
    "decision": "approved"
  }
}
```

---

## Webhook Validation

GENESIS ID valida cada webhook usando HMAC-SHA256:

```javascript
const hash = crypto
  .createHmac('sha256', VERIFF_SECRET)
  .update(body)
  .digest('hex');
```

Si la firma no coincide, el webhook se rechaza.

---

## Testing

### Sandbox Mode
Veriff proporciona un sandbox para testing sin usar cámaras reales:
```
https://stationapi.veriff.com/api/v1/sandbox
```

### Test Credentials
En sandbox, puedes usar:
- Documento: cualquier imagen válida
- Verificación: automáticamente aprobada

### Mock Webhook para Local
```bash
curl -X POST http://localhost:3000/api/auth/verify-callback \
  -H "Content-Type: application/json" \
  -d '{
    "verification": {
      "id": "test-session",
      "decision": "approved",
      "timestamp": 1234567890
    }
  }'
```

---

## Estados de Verificación

### Session Status
- `created` - Sesión creada, esperando que usuario inicie
- `started` - Usuario comenzó la verificación
- `submitted` - Usuario envió documentos, en review
- `decided` - Decisión tomada (approved/rejected)
- `abandoned` - Usuario abandonó la verificación

### Decision Status
- `approved` - Verificación exitosa
- `rejected` - Verificación fallida
- `pending` - En revisión manual (puede tomar 24-48h)

---

## Manejo de Errores

### Sesión Expirada
```json
{
  "status": 401,
  "error": "Verification session expired"
}
```

**Solución:** Usuario debe iniciar nueva verificación.

### Documento Rechazado
```json
{
  "status": 400,
  "error": "Document rejected: poor quality"
}
```

**Solución:** Usuario puede reintentar con mejor documento.

### Webhook Signature Invalid
GENESIS ID rechaza webhooks con firma inválida.

---

## Compliance & Security

### GDPR
- Veriff almacena datos en EU
- GENESIS ID no almacena fotos/videos (solo metadata)
- 30 días de retención de logs

### PCI DSS
- No manejamos datos de tarjeta de crédito
- Verificación es solo de identidad

### AML/KYC
- Veriff mantiene compliance AML/KYC
- Puedes opcionalmente usar datos de verificación para KYC

---

## Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| Webhook no llega | URL incorrecta | Verificar URL en Veriff Dashboard |
| Token inválido | API Key expirada | Renovar en Veriff Dashboard |
| Sesión no carga | CORS issue | Verificar CORS en GENESIS ID |
| Usuario no verificado | Documento rechazado | Usuario reintentar con mejor documento |

---

## Costs
Veriff Premium tiene costo por verificación. Checka pricing en Veriff Dashboard.

## Support
- Veriff Support: support@veriff.com
- GENESIS ID Support: dev@orden-global.com
