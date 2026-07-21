import React, { useRef, useEffect, useState } from 'react';
import { FiCamera, FiCheck, FiRotateCw, FiArrowUp, FiArrowDown, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface FacialCaptureProps {
  onCapture: (photo: string) => void;
  onError: (error: string) => void;
}

type FacePosition = 'looking-straight' | 'turn-left' | 'turn-right' | 'look-up' | 'look-down';

export default function FacialCapture({ onCapture, onError }: FacialCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facePosition, setFacePosition] = useState<FacePosition>('looking-straight');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
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
          setLoading(false);
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
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    // Flip horizontally (like a mirror)
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, -canvasRef.current.width, 0);

    // Convert to image
    const photo = canvasRef.current.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(photo);
    toast.success('Photo captured! Continue to next position.');

    // Move to next instruction after 2 seconds
    setTimeout(() => {
      if (instructions < positions.length - 1) {
        setInstructions(instructions + 1);
        setFacePosition(positions[instructions + 1].position);
        setCapturedPhoto(null);
      } else {
        // All photos captured
        onCapture(photo);
      }
    }, 2000);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const skipAndContinue = () => {
    onCapture('completed-facial');
  };

  const currentPosition = positions[instructions];
  const progress = ((instructions + 1) / positions.length) * 100;

  return (
    <div className="p-8 md:p-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Facial Verification</h2>
        <p className="text-gray-600 mb-8">
          Follow the instructions below. We'll capture your face in different positions to verify your identity.
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

        {/* Video Preview or Photo */}
        <div className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl bg-black">
          {!capturedPhoto ? (
            <>
              {loading ? (
                <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p>Initializing camera...</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full aspect-video object-cover"
                />
              )}

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
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                <div className="text-center text-white">
                  <div className="text-5xl mb-4">{currentPosition.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{currentPosition.label}</h3>
                  <p className="text-blue-200">{currentPosition.description}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
              <img
                src={capturedPhoto}
                alt="Captured"
                className="w-full h-full object-cover"
              />
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

        {/* Controls */}
        <div className="space-y-4">
          {!capturedPhoto ? (
            <>
              <button
                onClick={capturePhoto}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 transition transform hover:scale-105 flex items-center justify-center"
              >
                <FiCamera className="mr-2" size={24} />
                Capture Photo
              </button>

              {instructions > 0 && (
                <button
                  onClick={() => {
                    setInstructions(instructions - 1);
                    setFacePosition(positions[instructions - 1].position);
                  }}
                  className="w-full bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  Previous Position
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={retakePhoto}
                className="w-full bg-orange-600 text-white py-4 rounded-lg font-bold hover:bg-orange-700 transition flex items-center justify-center"
              >
                <FiRotateCw className="mr-2" />
                Retake Photo
              </button>

              <button
                onClick={skipAndContinue}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center"
              >
                <FiCheck className="mr-2" />
                Continue to Documents
              </button>
            </>
          )}
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          💡 Tip: Make sure you're in a well-lit area and your face is clearly visible.
        </p>
      </div>
    </div>
  );
}
