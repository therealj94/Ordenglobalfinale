# GENESIS ID Web - Frontend Application

A Next.js + TypeScript web application with GENESIS ID's own identity verification flow (no third-party verification provider) and a full admin dashboard for the Orden Global ecosystem.

## 🚀 Features

- **User Registration & Authentication** - Email/password with JWT tokens (plus a short-lived onboarding token for pre-verification users)
- **Facial Verification** - Live camera, 5-angle guided rotation (straight, left, right, up, down) for liveness — built in-house, no external SDK
- **Document Scanning** - ID card / driver's license (front + back) or passport (photo page), camera or file upload
- **KYC Flow** - Step-by-step guided verification process with progress tracking
- **Embeddable Widget Page** (`/embed/verify`) - loaded in an iframe by ecosystem apps via `packages/kyc-sdk`
- **Admin Dashboard** - Users, verifications (with document viewer), manual review queue, connected-app API keys, reports
- **Real-time Status** - Toast notifications, live status updates
- **Responsive Design** - Mobile-friendly UI with Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **UI Components**: Headless UI, React Icons
- **HTTP Client**: Axios with automatic token refresh
- **Notifications**: React Hot Toast

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
cd apps/web
npm install
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000/api
npm run dev
```

Server runs on `http://localhost:3001`

## 📁 Project Structure

```
apps/web/
├── components/
│   ├── Layout.tsx           # Main layout wrapper
│   ├── Header.tsx            # Navigation header
│   ├── Sidebar.tsx           # Admin sidebar
│   ├── KYCFlow.tsx           # KYC verification flow orchestrator
│   ├── FacialCapture.tsx     # Live camera, 5-angle rotation capture
│   ├── DocumentCapture.tsx   # Document type + front/back capture
│   └── DocumentViewer.tsx    # Admin: view submitted photos
├── pages/
│   ├── _app.tsx              # Global styles + Toaster
│   ├── index.tsx             # Home page
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── verify.tsx            # Standalone KYC flow page
│   ├── embed/
│   │   └── verify.tsx        # Iframe-embeddable KYC flow (for ecosystem apps)
│   ├── dashboard/
│   │   └── index.tsx         # User dashboard
│   └── admin/
│       ├── index.tsx         # Admin dashboard (charts)
│       ├── users.tsx
│       ├── verifications.tsx
│       ├── reviews.tsx       # Manual review queue
│       ├── settings.tsx      # Connected-app API keys
│       └── reports.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useVerification.ts    # submitKYC / getKYCStatus
│   └── useRequireAdmin.ts    # route guard for /admin/*
├── lib/
│   └── apiClient.ts          # Axios client with JWT + refresh interceptors
├── types/
│   └── index.ts
├── styles/globals.css
├── public/sdk/genesis-kyc-sdk.js  # served copy of the ecosystem widget
├── tailwind.config.js
└── postcss.config.js
```

## 🔐 Key Components

### **KYCFlow** (`components/KYCFlow.tsx`)
Orchestrates: intro → `FacialCapture` → `DocumentCapture` → submit → review/completed/failed. Accepts an `onStatusChange` callback so the embeddable page can report results to a parent app.

### **FacialCapture** (`components/FacialCapture.tsx`)
Live camera preview that stays mounted for the component's whole lifetime (captured-photo previews render as an overlay, not a remount — remounting loses the attached `MediaStream`). Waits for the video's `loadedmetadata` event before enabling capture, so a 0×0 canvas is never produced. Captures 5 angles.

### **DocumentCapture** (`components/DocumentCapture.tsx`)
Document type selection, then front (+ back for ID/license) capture via camera or file upload.

### **useAuth** (`hooks/useAuth.ts`)
Registration, login/logout, JWT refresh, and `fetchProfile()` (used to restore the session on page load via `/auth/me`).

### **useVerification** (`hooks/useVerification.ts`)
`submitKYC()` → `POST /api/kyc/submit`, `getKYCStatus()` → `GET /api/kyc/status/:userId`.

### **apiClient** (`lib/apiClient.ts`)
Automatic JWT injection, refresh-on-401, redirects to `/auth/login` on unrecoverable auth failure.

## 📄 Main Pages

### Public
- **/** - Home page
- **/auth/register**, **/auth/login**
- **/verify** - standalone KYC flow (`?userId=`)
- **/embed/verify** - iframe-embeddable KYC flow for ecosystem apps (`?userId=&appName=`)

### Protected
- **/dashboard** - user dashboard

### Admin (requires `role: admin`, guarded by `useRequireAdmin`)
- **/admin**, **/admin/users**, **/admin/verifications**, **/admin/reviews**, **/admin/settings**, **/admin/reports**

## 🔌 API Integration

Backend at `http://localhost:3000/api`. Key endpoints used by this frontend:

```
POST /auth/register           - Register (returns onboardingToken)
POST /auth/login
GET  /auth/me
POST /auth/refresh
POST /auth/logout

POST /kyc/submit               - Submit facial + document capture
GET  /kyc/status/:userId

GET  /admin/users, /admin/verifications, /admin/manual-reviews
POST /admin/reviews/:id/approve, /admin/reviews/:id/reject
GET/POST/DELETE /admin/apps    - connected-app API keys
GET  /admin/reports, /admin/logs
```

`/api/apps/*` (user-status, register-app, token-validate) are called by
**other apps' backends** with an `X-API-Key`, not by this frontend — see
`packages/kyc-sdk/README.md`.

## ✅ Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001/admin
NODE_ENV=development
```

## 🧪 Testing

```bash
npm run test
npm run type-check
```

## 📝 Code Quality

```bash
npm run lint
npm run format
```

## 🚀 Building for Production

```bash
npm run build
npm run start
```

## 🔒 Security Features

- JWT auth with automatic refresh
- Short-lived onboarding token scoped to a single userId for pre-verification KYC
- Admin routes gated client-side (`useRequireAdmin`) **and** server-side (`adminMiddleware`)
- Input validation on all forms
- CORS configured on the backend

## 🎯 User Flow

```
1. Home page → "Get Started" → /auth/register
2. Register → onboarding token issued
3. Redirected to /verify?userId=...
4. FacialCapture: 5 guided angles (straight, left, right, up, down)
5. DocumentCapture: document type → front (+ back) capture
6. POST /kyc/submit → status: pending
7. Shows "Under Review" — a human admin reviews the photos
8. Once approved: user logs in normally → JWT → /dashboard
9. If rejected: shown the reason, can retry
```

## 📊 Admin Flow

```
/admin/reviews → pending cases list
   ↓
Select case → view user info + submitted photos (DocumentViewer)
   ↓
Add notes → Approve or Reject
   ↓
User status updates + email notification
```

## 🐛 Troubleshooting

### "API connection refused"
- Check backend is running on `http://localhost:3000`
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Camera doesn't start / capture stays disabled
- Check browser camera permissions
- Capture is gated on the video's `loadedmetadata` event — if the camera
  never initializes, check the browser console for `getUserMedia` errors

### "Token expired"
- Automatic refresh should handle this; if it still fails, log in again
- Check localStorage for `accessToken`/`refreshToken`

## 📚 Additional Resources

- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- Root `VERIFICATION_ENGINE.md` for how the verification pipeline works
- `packages/kyc-sdk/README.md` for how other apps embed this flow

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Submit a pull request

## 📄 License

MIT

## 🆘 Support

- GitHub Issues
- Email: dev@orden-global.com
- Slack: #genesis-id
