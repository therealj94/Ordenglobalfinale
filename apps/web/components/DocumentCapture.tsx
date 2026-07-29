import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FiUpload, FiCheck, FiRotateCw, FiFileText, FiCamera, FiCameraOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { DocumentType } from '@/hooks/useVerification';
import { analyzeDocFrame, isDocFrameGood, docFrameHint, DocFrameMetrics } from '@/lib/docQuality';
import { useT } from '@/lib/i18n';

export interface DocumentCaptureResult {
  documentType: DocumentType;
  frontImage: string;
  backImage?: string;
}

interface DocumentCaptureProps {
  onCapture: (result: DocumentCaptureResult) => void;
  onError: (error: string) => void;
}

type Side = 'front' | 'back';

const DOC_OPTIONS: { type: DocumentType; label: string; needsBack: boolean }[] = [
  { type: 'PASSPORT', label: '📕 Passport', needsBack: false },
  { type: 'ID_CARD', label: '🪪 ID Card', needsBack: true },
  { type: 'DRIVERS_LICENSE', label: "🚗 Driver's License", needsBack: true }
];

// Auto-capture used to be able to fire about a second after the camera
// opened — before anyone could physically get the document into the frame —
// and whatever it grabbed then went on to fail the server's quality check.
// Nothing here can align the document for the user, so the timings give them
// room to do it and the manual button is available throughout.
const ALIGN_GRACE_MS = 3500; // no auto-capture at all until this has passed
const STABLE_HOLD_MS = 1800; // and the frame must then stay good this long
const DETECTION_INTERVAL_MS = 150; // ~6-7 checks/sec
const SHOW_DEBUG = process.env.NODE_ENV !== 'production';

export default function DocumentCapture({ onCapture, onError }: DocumentCaptureProps) {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // full-res capture
  const sampleCanvasRef = useRef<HTMLCanvasElement>(null); // small analysis buffer
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const capturingRef = useRef(false);

  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [side, setSide] = useState<Side>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showManualFallback, setShowManualFallback] = useState(true);
  const [canAutoCapture, setCanAutoCapture] = useState(false);
  const [metrics, setMetrics] = useState<DocFrameMetrics | null>(null);

  const selectedDoc = DOC_OPTIONS.find((d) => d.type === documentType);
  const currentImage = side === 'front' ? frontImage : backImage;

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setUseCamera(false);
    setHoldProgress(0);
    holdStartRef.current = null;
  }, []);

  const setImageForSide = useCallback(
    (photo: string) => {
      if (side === 'front') setFrontImage(photo);
      else setBackImage(photo);
    },
    [side]
  );

  const capturePhoto = useCallback(() => {
    if (capturingRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!video.videoWidth || !video.videoHeight) {
      toast.error('Camera is still starting up, try again in a moment');
      return;
    }

    capturingRef.current = true;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      capturingRef.current = false;
      return;
    }

    // Back/environment camera is not mirrored — capture as-is.
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const photo = canvas.toDataURL('image/jpeg', 0.92);
    setImageForSide(photo);
    stopCamera();
    toast.success(`${side === 'front' ? 'Front' : 'Back'} captured!`);
    capturingRef.current = false;
  }, [side, setImageForSide, stopCamera]);

  const startCamera = async () => {
    try {
      setCameraError(false);
      setCameraLoading(true);
      setUseCamera(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
        audio: false
      });
      // Hand the stream to state; the effect below attaches it once the
      // <video> element is actually in the DOM (avoids a render race that
      // could otherwise leave the loading spinner stuck).
      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      setCameraError(true);
      setCameraLoading(false);
      onError('Could not access camera. You can upload a photo instead.');
    }
  };

  // Attach the live stream to the <video> once both exist.
  useEffect(() => {
    if (useCamera && stream && !currentImage && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().catch(() => {});
          setCameraLoading(false);
        };
      }
    }
  }, [useCamera, stream, currentImage]);

  // Reset the hold timer whenever we (re)enter live camera mode, and start the
  // window in which auto-capture stays disabled so the document can be lined
  // up first. The manual button is shown from the start rather than appearing
  // only once auto-capture has struggled — the user knows when it's aligned.
  useEffect(() => {
    if (!useCamera || currentImage) return;
    holdStartRef.current = null;
    setHoldProgress(0);
    setShowManualFallback(true);
    setCanAutoCapture(false);
    const t = setTimeout(() => setCanAutoCapture(true), ALIGN_GRACE_MS);
    return () => clearTimeout(t);
  }, [useCamera, currentImage, side]);

  // Auto-capture detection loop
  useEffect(() => {
    if (!useCamera || currentImage || cameraLoading || cameraError) return;

    let lastCheck = 0;

    const loop = () => {
      const video = videoRef.current;
      const sampleCanvas = sampleCanvasRef.current;

      if (!video || !sampleCanvas || capturingRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = performance.now();
      if (now - lastCheck >= DETECTION_INTERVAL_MS && video.videoWidth > 0) {
        lastCheck = now;
        const m = analyzeDocFrame(video, sampleCanvas);
        if (m) {
          setMetrics(m);
          if (isDocFrameGood(m) && canAutoCapture) {
            if (holdStartRef.current === null) holdStartRef.current = now;
            const elapsed = now - holdStartRef.current;
            setHoldProgress(Math.min(100, (elapsed / STABLE_HOLD_MS) * 100));
            if (elapsed >= STABLE_HOLD_MS) {
              holdStartRef.current = null;
              capturePhoto();
              return;
            }
          } else {
            holdStartRef.current = null;
            setHoldProgress(0);
          }
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [useCamera, currentImage, cameraLoading, cameraError, capturePhoto, canAutoCapture]);

  // Clean up camera on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const photo = e.target?.result as string;
      setImageForSide(photo);
      toast.success(`${side === 'front' ? 'Front' : 'Back'} uploaded!`);
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    if (side === 'front') setFrontImage(null);
    else setBackImage(null);
  };

  const goToNextSide = () => {
    if (side === 'front' && selectedDoc?.needsBack) {
      setSide('back');
    } else {
      finalize();
    }
  };

  const finalize = () => {
    if (!documentType || !frontImage) {
      onError('Missing document image');
      return;
    }
    if (selectedDoc?.needsBack && !backImage) {
      onError('Back image is required');
      return;
    }
    onCapture({
      documentType,
      frontImage,
      backImage: selectedDoc?.needsBack ? backImage || undefined : undefined
    });
  };

  // Step 1: choose document type
  if (!documentType) {
    return (
      <div className="p-8 md:p-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Document</h2>
          <p className="text-gray-600 mb-8">Choose the type of identity document you'll use to verify.</p>

          <div className="grid grid-cols-1 gap-4">
            {DOC_OPTIONS.map((doc) => (
              <button
                key={doc.type}
                onClick={() => setDocumentType(doc.type)}
                className="p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition text-left flex items-center justify-between"
              >
                <div>
                  <p className="text-xl font-semibold text-gray-900">{doc.label}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {doc.needsBack ? 'We need front and back photos' : 'We need the photo page'}
                  </p>
                </div>
                <FiCamera className="text-blue-600" size={24} />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold text-gray-900">
            Scan {selectedDoc?.label.replace(/^\p{Emoji}\s*/u, '')}
          </h2>
          {selectedDoc?.needsBack && (
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
              {side === 'front' ? 'Step 1/2: Front' : 'Step 2/2: Back'}
            </span>
          )}
        </div>
        <p className="text-gray-600 mb-8">
          Hold the {side === 'front' ? 'front' : 'back'} of your document inside the frame — it captures
          automatically once it's clear and readable.
        </p>

        {/* Photo Preview */}
        {currentImage && (
          <div className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl">
            <img src={currentImage} alt="Document" className="w-full" />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <div className="text-center">
                <div className="inline-block bg-green-500 rounded-full p-4 mb-4 animate-bounce">
                  <FiCheck size={32} className="text-white" />
                </div>
                <p className="text-white font-semibold">Captured!</p>
              </div>
            </div>
          </div>
        )}

        {/* Camera Preview */}
        {useCamera && !currentImage && (
          <div className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] sm:aspect-video object-cover" />

            {cameraLoading && !cameraError && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p>Initializing camera...</p>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white px-6">
                  <FiCameraOff size={40} className="mx-auto mb-4 text-red-400" />
                  <p>Couldn't access your camera. Upload a photo instead.</p>
                </div>
              </div>
            )}

            {!cameraLoading && !cameraError && (
              <>
                {/* Framing guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className={`relative w-4/5 border-4 rounded-xl shadow-lg transition-colors ${
                      holdProgress > 0 ? 'border-green-400' : 'border-cyan-400'
                    }`}
                    style={{ aspectRatio: '1.6/1' }}
                  >
                    <div className={`absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 ${holdProgress > 0 ? 'border-green-400' : 'border-cyan-400'}`}></div>
                    <div className={`absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 ${holdProgress > 0 ? 'border-green-400' : 'border-cyan-400'}`}></div>
                    <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 ${holdProgress > 0 ? 'border-green-400' : 'border-cyan-400'}`}></div>
                    <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 ${holdProgress > 0 ? 'border-green-400' : 'border-cyan-400'}`}></div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
                  <div className="bg-black bg-opacity-60 rounded-full px-6 py-3 text-center text-white flex items-center gap-3">
                    <FiFileText size={22} />
                    <div className="text-left">
                      <p className="font-bold leading-tight">
                        {side === 'front' ? t('doc.side.front') : t('doc.side.back')}
                      </p>
                      <p className="text-blue-200 text-xs">
                        {holdProgress > 0
                          ? t('doc.hint.hold')
                          : !canAutoCapture
                          ? t('doc.hint.align')
                          : t(`doc.hint.${docFrameHint(metrics)}`)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hold-still progress */}
                {holdProgress > 0 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="bg-black bg-opacity-60 rounded-full px-4 py-2 text-white text-sm flex items-center gap-2">
                      <div className="w-24 bg-gray-600 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-400 h-2 rounded-full" style={{ width: `${holdProgress}%` }} />
                      </div>
                      {t('doc.hint.hold')}
                    </div>
                  </div>
                )}

                {SHOW_DEBUG && metrics && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-green-300 text-[10px] font-mono px-2 py-1 rounded pointer-events-none">
                    bright {metrics.brightness.toFixed(0)} sharp {metrics.sharpness.toFixed(1)} fill {metrics.fill.toFixed(1)}
                  </div>
                )}
              </>
            )}

            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={sampleCanvasRef} className="hidden" />
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3 mb-6">
          {!currentImage && !useCamera && (
            <>
              <button
                onClick={startCamera}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-cyan-700 transition transform hover:scale-105 flex items-center justify-center"
              >
                📷 Use Camera (auto-capture)
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105 flex items-center justify-center"
              >
                <FiUpload className="mr-2" />
                Upload Photo
              </button>

              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </>
          )}

          {useCamera && !currentImage && (
            <>
              {showManualFallback && !cameraError && (
                <button
                  onClick={capturePhoto}
                  className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition flex items-center justify-center"
                >
                  <FiCamera className="mr-2" />
                  {t('doc.captureNow')}
                </button>
              )}
              <button
                onClick={stopCamera}
                className="w-full bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                Cancel
              </button>
            </>
          )}

          {currentImage && (
            <>
              <button
                onClick={goToNextSide}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition transform hover:scale-105 flex items-center justify-center"
              >
                <FiCheck className="mr-2" />
                {side === 'front' && selectedDoc?.needsBack ? 'Continue to Back Side' : 'Continue'}
              </button>

              <button
                onClick={retake}
                className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700 transition flex items-center justify-center"
              >
                <FiRotateCw className="mr-2" />
                Retake
              </button>
            </>
          )}
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-3">✓ Tips for clear photos:</h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Make sure the entire document is visible inside the frame</li>
            <li>• Use natural light to avoid glares</li>
            <li>• Keep the document flat and straight</li>
            <li>• All text must be readable</li>
            <li>• Avoid shadows and blur</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
