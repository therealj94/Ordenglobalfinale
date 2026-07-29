// Lightweight, dependency-free frame analysis used to auto-capture a
// document photo once it's well-lit and in focus. It runs entirely in the
// browser on a small downscaled sample of the guide region, so it's cheap
// enough to run several times per second.
//
// NOTE: this is a *framing/focus* aid, not a document-authenticity check.
// It only decides "the picture looks sharp and bright enough to keep" — the
// same honest scope as the server-side ImageQualityService. It has NOT been
// calibrated against a wide range of real cameras, so the thresholds below
// are conservative and there is always a manual capture fallback.

export interface DocFrameMetrics {
  brightness: number; // 0-255 mean luminance of the sampled region
  sharpness: number; // mean local gradient magnitude (focus proxy)
  /**
   * How different the guide region is from the frame just outside it.
   *
   * Brightness and sharpness alone say nothing about whether a document is
   * actually in the box — a lit desk or a patterned surface satisfies both,
   * which is why capture used to fire within a second of the camera opening,
   * before anyone could line anything up. A card or passport page placed in
   * the guide stands out from its surroundings; empty background doesn't.
   */
  fill: number;
}

// A frame is considered "good enough" to auto-capture when it is neither too
// dark nor blown out, and sharp enough to suggest the document is in focus.
export const DOC_MIN_BRIGHTNESS = 45;
export const DOC_MAX_BRIGHTNESS = 248;
export const DOC_MIN_SHARPNESS = 12;
// Tuned to be reachable with an ordinary ID on an ordinary background rather
// than to be clever: the manual button is always there, so the cost of being
// slightly too strict is a tap, while too lenient means a wasted attempt.
export const DOC_MIN_FILL = 10;

const SAMPLE_W = 160;
const SAMPLE_H = 100;

/**
 * Samples the centered guide region of the video into a small canvas and
 * returns brightness + sharpness metrics. Returns null if the video isn't
 * ready yet.
 *
 * @param video    the live <video> element
 * @param canvas   a reusable (hidden) canvas for sampling
 * @param regionFraction  how much of the frame the guide box covers (0-1)
 */
export function analyzeDocFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  regionFraction = { w: 0.8, h: 0.55 }
): DocFrameMetrics | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return null;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  canvas.width = SAMPLE_W;
  canvas.height = SAMPLE_H;

  // Crop the centered guide region from the source video, downscaled.
  const sw = vw * regionFraction.w;
  const sh = vh * regionFraction.h;
  const sx = (vw - sw) / 2;
  const sy = (vh - sh) / 2;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, SAMPLE_W, SAMPLE_H);

  const { data } = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H);

  // Grayscale buffer
  const gray = new Float32Array(SAMPLE_W * SAMPLE_H);
  let brightnessSum = 0;
  for (let i = 0; i < SAMPLE_W * SAMPLE_H; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = lum;
    brightnessSum += lum;
  }
  const brightness = brightnessSum / (SAMPLE_W * SAMPLE_H);

  // Sharpness proxy: mean gradient magnitude (|dx| + |dy|) across interior
  // pixels. In-focus documents (with text/edges) score much higher than a
  // blurry frame or an empty surface.
  let gradSum = 0;
  let count = 0;
  for (let y = 1; y < SAMPLE_H - 1; y++) {
    for (let x = 1; x < SAMPLE_W - 1; x++) {
      const idx = y * SAMPLE_W + x;
      const dx = Math.abs(gray[idx + 1] - gray[idx - 1]);
      const dy = Math.abs(gray[idx + SAMPLE_W] - gray[idx - SAMPLE_W]);
      gradSum += dx + dy;
      count++;
    }
  }
  const sharpness = count ? gradSum / count : 0;

  // How much the middle of the guide differs from its outer ring. A document
  // filling the box makes these two areas clearly different; pointing the
  // camera at nothing in particular leaves them nearly identical.
  const marginX = Math.round(SAMPLE_W * 0.22);
  const marginY = Math.round(SAMPLE_H * 0.22);
  let innerSum = 0;
  let innerCount = 0;
  let ringSum = 0;
  let ringCount = 0;
  for (let y = 0; y < SAMPLE_H; y++) {
    for (let x = 0; x < SAMPLE_W; x++) {
      const v = gray[y * SAMPLE_W + x];
      const inner = x >= marginX && x < SAMPLE_W - marginX && y >= marginY && y < SAMPLE_H - marginY;
      if (inner) {
        innerSum += v;
        innerCount++;
      } else {
        ringSum += v;
        ringCount++;
      }
    }
  }
  const fill =
    innerCount && ringCount ? Math.abs(innerSum / innerCount - ringSum / ringCount) : 0;

  return { brightness, sharpness, fill };
}

export function isDocFrameGood(m: DocFrameMetrics): boolean {
  return (
    m.brightness >= DOC_MIN_BRIGHTNESS &&
    m.brightness <= DOC_MAX_BRIGHTNESS &&
    m.sharpness >= DOC_MIN_SHARPNESS &&
    m.fill >= DOC_MIN_FILL
  );
}

/** What the frame is still missing, so the user can be told rather than left guessing. */
export function docFrameHint(m: DocFrameMetrics | null): 'searching' | 'dark' | 'bright' | 'blurry' | 'ready' {
  if (!m) return 'searching';
  if (m.brightness < DOC_MIN_BRIGHTNESS) return 'dark';
  if (m.brightness > DOC_MAX_BRIGHTNESS) return 'bright';
  if (m.fill < DOC_MIN_FILL) return 'searching';
  if (m.sharpness < DOC_MIN_SHARPNESS) return 'blurry';
  return 'ready';
}
