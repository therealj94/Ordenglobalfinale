// Turning a camera frame into an upload-sized image.
//
// Captures used to be written out at whatever resolution the camera happened
// to deliver. `width: { ideal: 1280 }` is a hint, not a cap, so a modern phone
// can hand back 1080p or more, and seven of those as base64 (five face angles
// plus both sides of a document) went past the server's request limit — the
// submission was rejected before any check ran, which surfaced to the user as
// a verification failure blamed on lighting.

/**
 * Longest edge of a stored capture. Comfortably above the server's quality
 * floor (it wants at least a few hundred pixels) while keeping a full
 * submission to a few megabytes.
 */
export const CAPTURE_MAX_DIMENSION = 1400;

/** JPEG quality — high enough that sharpness checks still behave, small enough to upload on mobile data. */
export const CAPTURE_QUALITY = 0.85;

/**
 * Draws the current video frame into `canvas`, scaled so its longest edge is
 * at most CAPTURE_MAX_DIMENSION, and returns it as a JPEG data URL.
 *
 * @param mirrored flips horizontally — selfie cameras show a mirrored preview,
 *                 so the stored photo has to match what the user saw.
 */
export function captureFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  { mirrored = false }: { mirrored?: boolean } = {}
): string | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const scale = Math.min(1, CAPTURE_MAX_DIMENSION / Math.max(vw, vh));
  const w = Math.round(vw * scale);
  const h = Math.round(vh * scale);

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.save();
  if (mirrored) {
    ctx.scale(-1, 1);
    ctx.drawImage(video, -w, 0, w, h);
  } else {
    ctx.drawImage(video, 0, 0, w, h);
  }
  ctx.restore();

  return canvas.toDataURL('image/jpeg', CAPTURE_QUALITY);
}

/** Rough byte size of a data URL, for deciding whether a submission will fit. */
export function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.floor((base64.length * 3) / 4);
}

/** Comfortably under the server's request limit, leaving room for the rest of the body. */
const SUBMISSION_BUDGET_BYTES = 9 * 1024 * 1024;

function reencode(dataUrl: string, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Shrinks a set of captures until the whole submission fits.
 *
 * A fixed capture size isn't a guarantee: `width: { ideal: … }` is only a hint,
 * so what the camera actually hands back varies by device, and a detailed real
 * photo compresses far worse than a plain one. Measuring the real total and
 * stepping down only when needed is what makes this hold on any camera, rather
 * than hoping one chosen resolution is small enough everywhere.
 *
 * Steps stay well above the server's minimum resolution, so shrinking costs
 * some detail but never pushes the images below what the quality checks need.
 */
export async function shrinkToFit(images: string[]): Promise<string[]> {
  const total = (list: string[]) => list.reduce((sum, d) => sum + dataUrlBytes(d), 0);
  if (total(images) <= SUBMISSION_BUDGET_BYTES) return images;

  const steps: { maxDim: number; quality: number }[] = [
    { maxDim: 1200, quality: 0.8 },
    { maxDim: 1000, quality: 0.75 },
    { maxDim: 800, quality: 0.7 }
  ];

  let current = images;
  for (const step of steps) {
    current = await Promise.all(current.map((d) => reencode(d, step.maxDim, step.quality)));
    if (total(current) <= SUBMISSION_BUDGET_BYTES) break;
  }
  return current;
}
