import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FiCamera, FiCheck, FiArrowUp, FiArrowDown, FiArrowLeft, FiArrowRight, FiCameraOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  computeHeadPose,
  matchesTargetPose,
  FacePosition,
  HeadPose
} from '@/lib/facePose';

interface FacialCaptureProps {
  onCapture: (photos: string[]) => void;
  onError: (error: string) => void;
}

const STABLE_HOLD_MS = 800; // how long the pose must match before auto-capturing
const MANUAL_FALLBACK_AFTER_MS = 9000; // show "Capture Anyway" if stuck this long
const SHOW_DEBUG_ANGLES = process.env.NODE_ENV !== 'production';

export default function FacialCapture({ onCapture, onError }: FacialCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const matchStartRef = useRef<number | null>(null);
  const instructionsRef = useRef(0);
  const capturedPhotosRef = useRef<string[]>([]);
  const capturingRef = useRef(false);

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [modelLoading, setModelLoading] = useState(true);
  const [instructions, setInstructions] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [matchProgress, setMatchProgress] = useState(0);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [debugPose, setDebugPose] = useState<HeadPose | null>(null);
  const [cameraError, setCameraError] = useState(false);

  const positions: { position: FacePosition; label: string; icon: React.ReactNode; description: string }[] = [
    { position: 'looking-straight', label: 'Look Straight', icon: <FiCamera />, description: 'Face the camera directly' },
    { position: 'turn-left', label: 'Turn Left', icon: <FiArrowLeft />, description: 'Rotate your head to the left' },
    { position: 'turn-right', label: 'Turn Right', icon: <FiArrowRight />, description: 'Rotate your head to the right' },
    { position: 'look-up', label: 'Look Up', icon: <FiArrowUp />, description: 'Tilt your head upward' },
    { position: 'look-down', label: 'Look Down', icon: <FiArrowDown />, description: 'Tilt your head downward' }
  ];

  useEffect(() => {
    instructionsRef.current = instructions;
    matchStartRef.current = null;
    setMatchProgress(0);
    setShowManualFallback(false);

    const fallbackTimer = setTimeout(() => setShowManualFallback(true), MANUAL_FALLBACK_AFTER_MS);
    return () => clearTimeout(fallbackTimer);
  }, [instructions]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || capturingRef.current) return;
    if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      return;
    }

    capturingRef.current = true;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      capturingRef.current = false;
      return;
    }

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, -canvasRef.current.width, 0);

    const photo = canvasRef.current.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(photo);

    const updatedPhotos = [...capturedPhotosRef.current, photo];
    capturedPhotosRef.current = updatedPhotos;
    setCapturedPhotos(updatedPhotos);
    toast.success(`Captured (${updatedPhotos.length}/${positions.length})`);

    setTimeout(() => {
      capturingRef.current = false;
      if (instructionsRef.current < positions.length - 1) {
        setInstructions((i) => i + 1);
        setCapturedPhoto(null);
      } else {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        onCapture(updatedPhotos);
      }
    }, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCapture]);

  // Start camera
  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false
        });

        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
            setCameraLoading(false);
          };
        }
      } catch (err) {
        setCameraError(true);
        onError('Could not access camera. Please check permissions.');
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the face landmarker model (self-hosted, runs entirely in-browser)
  useEffect(() => {
    let cancelled = false;

    const loadModel = async () => {
      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
        const filesetResolver = await FilesetResolver.forVisionTasks('/mediapipe-wasm');

        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: '/models/face_landmarker.task',
            delegate: 'GPU'
          },
          outputFacialTransformationMatrixes: true,
          runningMode: 'VIDEO',
          numFaces: 1
        });

        if (cancelled) return;
        landmarkerRef.current = landmarker;
        setModelLoading(false);
      } catch (err) {
        console.error('Failed to load face detection model:', err);
        if (!cancelled) {
          // Detector failed to load (e.g. unsupported browser) — fall back
          // to manual capture only, don't block the whole flow.
          setModelLoading(false);
          landmarkerRef.current = null;
        }
      }
    };

    loadModel();

    return () => {
      cancelled = true;
      landmarkerRef.current?.close?.();
    };
  }, []);

  // Detection loop
  useEffect(() => {
    if (cameraLoading || modelLoading) return;

    const DETECTION_INTERVAL_MS = 120; // ~8 checks/sec — plenty for stability-based capture, much lighter than every frame
    let lastDetectionAt = 0;

    const detect = () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !landmarker || capturingRef.current) {
        rafRef.current = requestAnimationFrame(detect);
        return;
      }

      const now = performance.now();
      const dueForDetection = now - lastDetectionAt >= DETECTION_INTERVAL_MS;

      if (dueForDetection && video.currentTime !== lastVideoTimeRef.current && video.videoWidth > 0) {
        lastVideoTimeRef.current = video.currentTime;
        lastDetectionAt = now;

        try {
          const result = landmarker.detectForVideo(video, performance.now());
          const matrix = result?.facialTransformationMatrixes?.[0]?.data;

          if (matrix) {
            setFaceDetected(true);
            const pose = computeHeadPose(matrix);
            setDebugPose(pose);

            const target = positions[instructionsRef.current].position;
            const isMatch = matchesTargetPose(target, pose);

            if (isMatch) {
              if (matchStartRef.current === null) {
                matchStartRef.current = performance.now();
              }
              const elapsed = performance.now() - matchStartRef.current;
              setMatchProgress(Math.min(100, (elapsed / STABLE_HOLD_MS) * 100));

              if (elapsed >= STABLE_HOLD_MS) {
                matchStartRef.current = null;
                capturePhoto();
              }
            } else {
              matchStartRef.current = null;
              setMatchProgress(0);
            }
          } else {
            setFaceDetected(false);
            matchStartRef.current = null;
            setMatchProgress(0);
          }
        } catch (err) {
          // Detection hiccup on a single frame — ignore and keep the loop alive
        }
      }

      rafRef.current = requestAnimationFrame(detect);
    };

    rafRef.current = requestAnimationFrame(detect);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraLoading, modelLoading, capturePhoto]);

  const currentPosition = positions[instructions];
  const progress = ((instructions + (capturedPhoto ? 1 : 0)) / positions.length) * 100;
  const isLoading = cameraLoading || modelLoading;

  return (
    <div className="p-8 md:p-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Facial Verification</h2>
        <p className="text-gray-600 mb-8">
          Hold each position steady — the camera will capture automatically once it confirms the angle.
        </p>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Position {instructions + 1} of {positions.length}
            </span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Video Preview + overlays */}
        <div className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-video object-cover [transform:scaleX(-1)] bg-gray-900"
          />

          {isLoading && !cameraError && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p>{cameraLoading ? 'Initializing camera...' : 'Loading face detector...'}</p>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white px-6">
                <FiCameraOff size={40} className="mx-auto mb-4 text-red-400" />
                <p>Couldn't access your camera. Check browser permissions and try again.</p>
              </div>
            </div>
          )}

          {!isLoading && !capturedPhoto && !cameraError && (
            <>
              {/* Overlay guide, color reflects detection state */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`relative w-64 h-80 border-4 rounded-3xl shadow-lg transition-colors ${
                    faceDetected ? 'border-cyan-400' : 'border-gray-500'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 ${faceDetected ? 'border-cyan-400' : 'border-gray-500'}`}></div>
                  <div className={`absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 ${faceDetected ? 'border-cyan-400' : 'border-gray-500'}`}></div>
                  <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 ${faceDetected ? 'border-cyan-400' : 'border-gray-500'}`}></div>
                  <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 ${faceDetected ? 'border-cyan-400' : 'border-gray-500'}`}></div>
                </div>
              </div>

              {/* Instructions box */}
              <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-black bg-opacity-60 rounded-full px-6 py-3 text-center text-white flex items-center gap-3">
                  <span className="text-2xl">{currentPosition.icon}</span>
                  <div className="text-left">
                    <p className="font-bold leading-tight">{currentPosition.label}</p>
                    <p className="text-blue-200 text-xs">
                      {faceDetected ? currentPosition.description : 'Center your face in the frame'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hold-still progress ring */}
              {faceDetected && matchProgress > 0 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                  <div className="bg-black bg-opacity-60 rounded-full px-4 py-2 text-white text-sm flex items-center gap-2">
                    <div className="w-24 bg-gray-600 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-green-400 h-2 rounded-full"
                        style={{ width: `${matchProgress}%` }}
                      />
                    </div>
                    Hold still...
                  </div>
                </div>
              )}

              {SHOW_DEBUG_ANGLES && debugPose && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-green-300 text-[10px] font-mono px-2 py-1 rounded pointer-events-none">
                  yaw {debugPose.yaw.toFixed(0)}° pitch {debugPose.pitch.toFixed(0)}°
                </div>
              )}
            </>
          )}

          {capturedPhoto && (
            <div className="absolute inset-0">
              <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="text-center">
                  <div className="inline-block bg-green-500 rounded-full p-4 mb-4 animate-bounce">
                    <FiCheck size={32} className="text-white" />
                  </div>
                  <p className="text-white font-semibold">Photo captured!</p>
                </div>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Thumbnails */}
        {capturedPhotos.length > 0 && (
          <div className="flex gap-2 mb-6 justify-center">
            {positions.map((p, idx) => (
              <div
                key={p.position}
                className={`w-14 h-14 rounded-lg border-2 overflow-hidden flex items-center justify-center ${
                  idx < capturedPhotos.length ? 'border-green-500' : 'border-gray-300 bg-gray-100'
                }`}
              >
                {idx < capturedPhotos.length ? (
                  <img src={capturedPhotos[idx]} alt={p.label} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs">{idx + 1}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Manual fallback, only if auto-capture is taking too long */}
        {!isLoading && !capturedPhoto && showManualFallback && (
          <button
            onClick={capturePhoto}
            className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center"
          >
            <FiCamera className="mr-2" />
            Having trouble? Capture Anyway
          </button>
        )}

        <p className="text-center text-gray-600 text-sm mt-6">
          💡 Tip: Make sure you're in a well-lit area and your face is clearly visible. No need to click anything — just hold the position.
        </p>
      </div>
    </div>
  );
}
