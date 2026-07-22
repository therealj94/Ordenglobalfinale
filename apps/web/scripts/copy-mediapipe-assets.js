/**
 * Copies MediaPipe's WASM runtime (bundled inside node_modules) into
 * /public so the browser can load it from our own server, with no
 * external CDN dependency. Runs automatically via the "postinstall" script.
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const DEST_DIR = path.join(__dirname, '..', 'public', 'mediapipe-wasm');

if (!fs.existsSync(SRC_DIR)) {
  console.warn('[copy-mediapipe-assets] @mediapipe/tasks-vision wasm folder not found, skipping.');
  process.exit(0);
}

fs.mkdirSync(DEST_DIR, { recursive: true });

for (const file of fs.readdirSync(SRC_DIR)) {
  fs.copyFileSync(path.join(SRC_DIR, file), path.join(DEST_DIR, file));
}

console.log(`[copy-mediapipe-assets] Copied MediaPipe WASM runtime to ${DEST_DIR}`);
