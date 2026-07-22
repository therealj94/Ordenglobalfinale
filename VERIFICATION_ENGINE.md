# GENESIS ID — Verification Engine

GENESIS ID does **not** rely on Veriff or any third-party identity verification
provider. It **is** the verification engine for the Orden Global ecosystem —
built and owned end-to-end.

## What GENESIS ID does itself

| Capability | How it works today |
|---|---|
| Facial liveness capture | Live camera in the browser, 5 guided head positions (straight, left, right, up, down) — `apps/web/components/FacialCapture.tsx` |
| Document capture | Front + back capture for ID cards / driver's licenses, single photo-page capture for passports — `apps/web/components/DocumentCapture.tsx` |
| Storage | Captured images stored on the `Verification` record (`documentFrontImage`, `documentBackImage`, `selfieImages`) |
| Decision | Manual review by a human admin today (`reviewMode: 'manual'`); the `rawData`/`livenessResult` JSONB fields exist so an in-house automated check can plug in later without a schema change |
| Review UI | `/admin/reviews` — admins see the submitted photos, add notes, and approve/reject |

## Why manual review (for now)

Automatic pass/fail decisions require document-authenticity checks (hologram/MRZ
validation, tamper detection) and liveness/anti-spoofing scoring — real
computer-vision work. Rather than fake that with a stubbed "always approve"
switch, GENESIS ID ships with **honest manual review**: every submission goes
to a human admin, who sees the actual captured photos before deciding.

This is a deliberate, incremental path:

1. **Today**: manual review only (`reviewMode: 'manual'`).
2. **Later**: plug in an in-house or licensed document/liveness analysis
   step inside `KYCController.submitKYC` (`src/controllers/KYCController.js`).
   When a verification's automated confidence is high, mark
   `reviewMode: 'automatic'` and set `status` directly; otherwise fall back to
   the same manual queue that already exists. No API or frontend changes are
   needed to add this — the review queue and manual-approval flow keep
   working as the fallback.

## Data model

`Verification` (`src/models/Verification.js`):
- `sessionId` — GENESIS ID's own verification session identifier (was
  previously tied to Veriff's session id; now fully internal)
- `documentType`, `documentCountry`, `documentNumber`
- `documentFrontImage`, `documentBackImage` — base64 captures
- `selfieImages` — array of the 5 rotation-angle captures
- `livenessResult` — reserved for a future automated liveness score
- `reviewMode` — `'manual'` today, `'automatic'` once an in-house/licensed
  automated check is wired in
- `status`, `verifiedAt`, `rejectionReason`

`ManualReviewCase` (`src/models/ManualReviewCase.js`) — one row per
verification pending human review; tracks who reviewed it, when, and their
notes.

## Ecosystem integration

Veta Wallet, My Token Pay, and any other Orden Global app never talk to a
third party either — they talk to GENESIS ID directly:

- Frontend: `packages/kyc-sdk` (the `GenesisKYC.verify()` widget) opens
  GENESIS ID's own `/embed/verify` page — not an external verification site.
- Backend: apps confirm status server-to-server via `/api/apps/user-status`,
  authenticated with a GENESIS ID API key (see Admin → Settings).

See `API.md` for the full endpoint reference and `packages/kyc-sdk/README.md`
for integration instructions.
