/**
 * Extracts head-pose Euler angles (yaw, pitch, roll — in degrees) from the
 * 4x4 facial transformation matrix MediaPipe's FaceLandmarker returns.
 *
 * The matrix is stored column-major (OpenGL convention), 16 floats. We only
 * need the 3x3 rotation part. Decomposition assumes a Y-X-Z (yaw-pitch-roll)
 * rotation order, which is standard for head-pose estimation.
 *
 * NOTE: these thresholds were derived from documented conventions and are
 * NOT yet calibrated against a real camera + real face (this was built in an
 * environment without camera hardware). Expect to tune ANGLE_THRESHOLD_DEG
 * after testing with a real user — see FacialCapture.tsx's on-screen debug
 * readout, which shows live yaw/pitch numbers to make that easy.
 */

export interface HeadPose {
  yaw: number; // negative = turned toward camera's left, positive = camera's right
  pitch: number; // negative = looking down, positive = looking up
  roll: number;
}

export function computeHeadPose(matrixData: Float32Array | number[]): HeadPose {
  // Column-major 4x4 -> row-major 3x3 rotation part
  const m00 = matrixData[0];
  const m10 = matrixData[1];
  const m20 = matrixData[2];
  const m01 = matrixData[4];
  const m11 = matrixData[5];
  const m21 = matrixData[6];
  const m22 = matrixData[10];

  const RAD2DEG = 180 / Math.PI;

  const yaw = Math.atan2(m20, m22) * RAD2DEG;
  const pitch = Math.atan2(-m21, Math.sqrt(m20 * m20 + m22 * m22)) * RAD2DEG;
  const roll = Math.atan2(m01, m11) * RAD2DEG;

  return { yaw, pitch, roll };
}

export type FacePosition = 'looking-straight' | 'turn-left' | 'turn-right' | 'look-up' | 'look-down';

// How far off-center (in degrees) the user must turn for a position to
// count as reached. Tune these after real-world testing.
export const ANGLE_THRESHOLD_DEG = 15;
export const STRAIGHT_TOLERANCE_DEG = 10;

export function matchesTargetPose(position: FacePosition, pose: HeadPose): boolean {
  switch (position) {
    case 'looking-straight':
      return Math.abs(pose.yaw) < STRAIGHT_TOLERANCE_DEG && Math.abs(pose.pitch) < STRAIGHT_TOLERANCE_DEG;
    case 'turn-left':
      // Camera (non-mirrored) space: user's own left turn shows as negative yaw
      return pose.yaw < -ANGLE_THRESHOLD_DEG;
    case 'turn-right':
      return pose.yaw > ANGLE_THRESHOLD_DEG;
    case 'look-up':
      return pose.pitch > ANGLE_THRESHOLD_DEG;
    case 'look-down':
      return pose.pitch < -ANGLE_THRESHOLD_DEG;
    default:
      return false;
  }
}
