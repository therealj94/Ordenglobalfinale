import React, { useRef, useEffect, useState } from 'react';
import { FiCamera, FiCheck, FiRotateCw, FiArrowUp, FiArrowDown, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface FacialCaptureProps {
  onCapture: (photos: string[]) => void;
  onError: (error: string) => void;
}

type FacePosition = 'looking-straight' | 'turn-left' | 'turn-right' | 'look-up' | 'look-down';

export default function FacialCapture({ onCapture, onError }: FacialCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructions, setInstructions] = useState(0);

  const positions: { position: FacePosition; label: string; icon: React.ReactNode; description: string }[] = [
    { position: 'looking-straight', label: 'Look Straight', icon: <FiCamera />, description: 'Face the camera directly' },
    { position: 'turn-left', label: 'Turn Left', icon: <FiArrowLeft />, description: 'Rotate your head to the left' },
    { position: 'turn-right', label: 'Turn Right', icon: <FiArrowRight />, description: 'Rotate your head to the right' },
    { position: 'look-up', label: 'Look Up', icon: <FiArrowUp />, description: 'Tilt your head upward' },
    { position: 'look-down', label: 'Look Down', icon: <FiArrowDown />, description: 'Tilt your head downward' }
  ];

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
          // Wait for real frame dimensions before allowing capture — without
          // this, videoWidth/videoHeight can still be 0, producing a blank
          // (zero-size) canvas capture.
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
            setLoading(false);
          };
        }
      } catch (err: any) {
        onError('Could not access camera. Please check permissions.');
        console.error('Camera error:', err);
      }
    };

    startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      toast.error('Camera is still starting up, try again in a moment');
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    // Flip horizontally (like a mirror)
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, -canvasRef.current.width, 0);

    const photo = canvasRef.current.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(photo);

    const updatedPhotos = [...capturedPhotos, photo];
    setCapturedPhotos(updatedPhotos);
    toast.success(`Captured (${updatedPhotos.length}/${positions.length})`);

    setTimeout(() => {
      if (instructions < positions.length - 1) {
        setInstructions(instructions + 1);
        setCapturedPhoto(null);
      } else {
        stream?.getTracks().forEach((track) => track.stop());
        onCapture(updatedPhotos);
      }
    }, 900);
  };

  const currentPosition = positions[instructions];
  const progress = ((instructions + (capturedPhoto ? 1 : 0)) / positions.length) * 100;

  return (
    <div className="p-8 md:p-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Facial Verification</h2>
        <p className="text-gray-600 mb-8">
          Follow the instructions below. We'll capture your face in different positions to verify liveness.
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

        {/* Video Preview + Photo overlay */}
        <div className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl bg-black">
          {/* The video element stays mounted for the component's entire
              lifetime — its ref/srcObject is only ever set once. Loading and
              "photo captured" states are drawn as overlays on TOP of it
              instead of swapping it out, otherwise remounting a fresh
              <video> loses the attached camera stream (videoWidth/Height
              reset to 0), breaking every capture after the first. */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-video object-cover [transform:scaleX(-1)] bg-gray-900"
          />

          {loading && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p>Initializing camera...</p>
              </div>
            </div>
          )}

          {!loading && !capturedPhoto && (
            <>
              {/* Overlay guides */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-80 border-4 border-cyan-400 rounded-3xl shadow-lg">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-cyan-400"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-cyan-400"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-cyan-400"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-cyan-400"></div>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-black bg-opacity-60 rounded-full px-6 py-3 text-center text-white flex items-center gap-3">
                  <span className="text-2xl">{currentPosition.icon}</span>
                  <div className="text-left">
                    <p className="font-bold leading-tight">{currentPosition.label}</p>
                    <p className="text-blue-200 text-xs">{currentPosition.description}</p>
                  </div>
                </div>
              </div>
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

        {/* Thumbnails of captured photos */}
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

        {/* Controls */}
        {!capturedPhoto && (
          <button
            onClick={capturePhoto}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition transform hover:scale-105 flex items-center justify-center"
          >
            <FiCamera className="mr-2" size={24} />
            Capture Photo
          </button>
        )}

        <p className="text-center text-gray-600 text-sm mt-6">
          💡 Tip: Make sure you're in a well-lit area and your face is clearly visible.
        </p>
      </div>
    </div>
  );
}
