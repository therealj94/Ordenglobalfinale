const sharp = require('sharp');

/**
 * Automatic QUALITY checks only — resolution, brightness, and "is this a
 * blank/uniform image" (a proxy for a badly-aimed or accidental capture).
 *
 * IMPORTANT: this does NOT verify document authenticity (no hologram/MRZ/
 * security-feature checks) and does NOT confirm the selfie is the same
 * person as the document. It only catches obviously unusable captures so
 * a user can retry instantly instead of waiting on manual review. Treat
 * "automatic" verification built on this as "passed a quality gate", not
 * "confirmed to be a genuine, non-fraudulent identity". See
 * VERIFICATION_ENGINE.md for the full disclosure.
 */

const MIN_BRIGHTNESS = 25; // out of 255 — below this, image is likely too dark
const MAX_BRIGHTNESS = 235; // above this, image is likely blown out / blank white
const MIN_STDDEV = 8; // below this, image is likely a flat/blank capture

function dataUrlToBuffer(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  return Buffer.from(base64, 'base64');
}

async function checkImageQuality(dataUrl, { minWidth, minHeight, label }) {
  try {
    const buffer = dataUrlToBuffer(dataUrl);
    const image = sharp(buffer);

    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      return { pass: false, reason: `${label}: could not read image dimensions` };
    }
    if (metadata.width < minWidth || metadata.height < minHeight) {
      return { pass: false, reason: `${label}: resolution too low (${metadata.width}x${metadata.height})` };
    }

    const stats = await image.stats();
    const meanBrightness = stats.channels.slice(0, 3).reduce((sum, c) => sum + c.mean, 0) / 3;
    const avgStdDev = stats.channels.slice(0, 3).reduce((sum, c) => sum + c.stdev, 0) / 3;

    if (meanBrightness < MIN_BRIGHTNESS) {
      return { pass: false, reason: `${label}: image too dark` };
    }
    if (meanBrightness > MAX_BRIGHTNESS) {
      return { pass: false, reason: `${label}: image overexposed / blank` };
    }
    if (avgStdDev < MIN_STDDEV) {
      return { pass: false, reason: `${label}: image appears blank or out of focus` };
    }

    return { pass: true };
  } catch (error) {
    return { pass: false, reason: `${label}: failed to analyze image (${error.message})` };
  }
}

/**
 * Runs quality checks across all submitted images for a KYC submission.
 * Returns { pass: boolean, failures: string[] }.
 */
async function checkSubmissionQuality({ documentFrontImage, documentBackImage, selfieImages }) {
  const checks = [
    checkImageQuality(documentFrontImage, { minWidth: 500, minHeight: 300, label: 'Document front' })
  ];

  if (documentBackImage) {
    checks.push(checkImageQuality(documentBackImage, { minWidth: 500, minHeight: 300, label: 'Document back' }));
  }

  selfieImages.forEach((img, idx) => {
    checks.push(checkImageQuality(img, { minWidth: 300, minHeight: 300, label: `Selfie ${idx + 1}` }));
  });

  const results = await Promise.all(checks);
  const failures = results.filter((r) => !r.pass).map((r) => r.reason);

  return { pass: failures.length === 0, failures };
}

module.exports = { checkImageQuality, checkSubmissionQuality };
