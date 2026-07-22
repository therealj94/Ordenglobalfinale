# GENESIS ID — Verification Engine

GENESIS ID does **not** rely on Veriff or any third-party identity verification
provider. It **is** the verification engine for the Orden Global ecosystem —
built and owned end-to-end.

## What GENESIS ID does itself

| Capability | How it works today |
|---|---|
| Facial liveness capture | Live camera, 5 head positions (straight, left, right, up, down), **auto-captured** via real-time head-pose estimation (MediaPipe FaceLandmarker, self-hosted, runs entirely in-browser) — `apps/web/components/FacialCapture.tsx`, angle math in `apps/web/lib/facePose.ts` |
| Document capture | Front + back capture for ID cards / driver's licenses, single photo-page capture for passports — `apps/web/components/DocumentCapture.tsx` |
| AML / KYC declaration | Date of birth, nationality, country of residence, occupation, source of funds, and PEP (Politically Exposed Person) status — `apps/web/components/AMLForm.tsx` |
| Storage | Captured images on the `Verification` record; AML fields split between `User` (profile: DOB, nationality, residence, occupation) and `Verification` (declared per-submission: source of funds, PEP) |
| Decision | Manual review by a human admin today (`reviewMode: 'manual'`); the `rawData`/`livenessResult` JSONB fields exist so an in-house automated check can plug in later without a schema change |
| Review UI | `/admin/reviews` — admins see the submitted photos and full AML declaration (PEP cases are flagged), add notes, and approve/reject |

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
- `sourceOfFunds`, `isPEP`, `pepDetails` — AML declaration for this submission
- `reviewMode` — `'manual'` today, `'automatic'` once an in-house/licensed
  automated check is wired in
- `status`, `verifiedAt`, `rejectionReason`

`User` (`src/models/User.js`) also carries persistent KYC profile fields set
on first submission: `dateOfBirth`, `nationality`, `countryOfResidence`,
`occupation`.

### Head-pose detection

`apps/web/lib/facePose.ts` extracts yaw/pitch/roll from the 4x4 facial
transformation matrix MediaPipe returns, and checks it against per-position
thresholds (`ANGLE_THRESHOLD_DEG`, `STRAIGHT_TOLERANCE_DEG`). These were set
from standard conventions but **have not been calibrated against a real
camera + real face** — this was built in an environment without camera
hardware. `FacialCapture.tsx` shows a live yaw/pitch debug readout in
development mode to make tuning easy, and always offers a manual "Capture
Anyway" fallback after ~9 seconds so detection issues never block a user.

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
