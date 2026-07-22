# GENESIS ID — KYC SDK

Drop-in identity verification for every app in the Orden Global ecosystem
(Veta Wallet, My Token Pay, and future apps). One verification, shared across
every connected app — no matter what stack the app is built with.

## How it works

```
┌─────────────┐        1. Open widget         ┌──────────────────────┐
│  Your App   │ ─────────────────────────────►│  GENESIS ID          │
│ (frontend)  │                                │  /embed/verify       │
│             │◄───────────────────────────── │  (facial + document  │
└─────────────┘   2. postMessage: status       │   capture flow)      │
       │                                        └──────────────────────┘
       │ 3. Server-to-server confirm
       ▼
┌─────────────┐        X-API-Key header        ┌──────────────────────┐
│  Your App   │ ─────────────────────────────► │  GENESIS ID          │
│ (backend)   │  POST /api/apps/user-status     │  API                 │
└─────────────┘◄───────────────────────────── │                       │
                { verified: true, ... }         └──────────────────────┘
```

1. **Frontend**: your app opens the GENESIS ID verification widget (modal or
   redirect). The user completes facial capture (5-angle rotation liveness
   check) and document scan (ID front/back, driver's license front/back, or
   passport photo page).
2. **Widget reports back**: `approved`, `pending` (manual review), or
   `rejected`, via `postMessage`.
3. **Your backend independently confirms** the result using your app's secret
   API key — never trust the frontend event alone for anything that grants
   real access. This is the same pattern Stripe and Auth0 use for their
   webhooks/callbacks.

## 1. Get your API key

In the GENESIS ID admin panel: **Settings → Connect New App**. You'll get a
key like `gid_live_xxxxxxxxxxxxxxxxxxxx` — store it in your backend's secrets
manager. It is only shown once.

## 2. Add the widget to your frontend

### Plain HTML / any framework

```html
<script src="https://genesis-id.orden-global.com/sdk/genesis-kyc-sdk.js"></script>
<button id="verify-btn">Verify My Identity</button>

<script>
  document.getElementById('verify-btn').addEventListener('click', function () {
    GenesisKYC.verify({
      userId: currentUser.genesisId, // the user's GENESIS ID uuid
      appName: 'veta-wallet',
      onComplete: function (result) {
        // result.status: 'approved' | 'pending' | 'rejected'
        console.log('KYC result', result);
        // Now call YOUR backend to confirm + unlock features.
      },
      onError: function (err) {
        console.error('KYC error', err);
      }
    });
  });
</script>
```

For local development, point the widget at your local GENESIS ID instance:

```html
<script>
  window.GENESIS_KYC_BASE_URL = 'http://localhost:3001';
</script>
<script src="http://localhost:3001/sdk/genesis-kyc-sdk.js"></script>
```

### React / Next.js apps

Copy `react/GenesisKYCButton.tsx` into your project (or publish this package
to your private npm registry and import it):

```tsx
import GenesisKYCButton from './GenesisKYCButton';

<GenesisKYCButton
  userId={user.genesisId}
  appName="veta-wallet"
  className="btn-primary"
  onComplete={(result) => {
    if (result.status === 'approved') {
      // refresh user state, unlock features
    }
  }}
  onError={(err) => toast.error(err.message)}
>
  Verify My Identity
</GenesisKYCButton>
```

### Mobile-friendly full-page redirect (alternative to the modal)

```js
GenesisKYC.verifyRedirect({
  userId: currentUser.genesisId,
  appName: 'veta-wallet',
  returnUrl: window.location.href // GENESIS ID redirects back here with ?status=...
});
```

## 3. Confirm on your backend (required)

See `server-examples/node-example.js` for Node/Express, or
`server-examples/curl-examples.md` for PHP, Python, and raw HTTP — works with
any backend language since it's just authenticated HTTP calls.

```js
// after receiving onComplete() on the frontend, ask YOUR backend:
const status = await fetch('/your-backend/verification-status/' + userId);
// your backend calls GENESIS ID with its secret X-API-Key and returns the
// authoritative answer — never trust the frontend event alone.
```

## Document types supported

| Type | Images required |
|---|---|
| Passport | Photo page (1 image) |
| National ID card | Front + back (2 images) |
| Driver's license | Front + back (2 images) |

Plus 5 facial angles captured live (straight, left, right, up, down) for
liveness / anti-spoofing.

## Review modes

- **Manual** — default today. A human admin reviews the submitted photos in
  the GENESIS ID admin panel (`/admin/reviews`) and approves or rejects.
- **Automatic** — reserved for when an in-house document/liveness analysis
  step is added to GENESIS ID's own backend. See `VERIFICATION_ENGINE.md`.
  Users are notified by email either way.

## Files in this package

```
kyc-sdk/
├── genesis-kyc-sdk.js       # vanilla JS widget (also served at /sdk/genesis-kyc-sdk.js)
├── react/
│   └── GenesisKYCButton.tsx # React wrapper component
├── server-examples/
│   ├── node-example.js      # Node/Express backend confirmation example
│   └── curl-examples.md     # PHP / Python / raw HTTP examples
└── README.md                # this file
```

## Security checklist for integrators

- [ ] API key stored server-side only (env var / secrets manager), never in frontend code
- [ ] Backend confirms verification status via `/api/apps/user-status` before granting access
- [ ] `X-API-Key` sent only over HTTPS in production
- [ ] Revoke and rotate the key immediately if it ever leaks
