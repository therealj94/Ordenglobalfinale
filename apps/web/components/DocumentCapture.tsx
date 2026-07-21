import React, { useRef, useState } from 'react';
import { FiUpload, FiCheck, FiRotateCw, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface DocumentCaptureProps {
  onCapture: (photo: string) => void;
  onError: (error: string) => void;
}

type DocumentType = 'passport' | 'id' | 'drivers-license';

export default function DocumentCapture({ onCapture, onError }: DocumentCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('passport');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [useCamera, setUseCamera] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Back camera
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setUseCamera(true);
      }
    } catch (err) {
      onError('Could not access camera.');
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    const photo = canvasRef.current.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(photo);
    stopCamera();
    toast.success('Document captured!');
  };

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
      setCapturedPhoto(photo);
      toast.success('Document uploaded!');
    };
    reader.readAsDataURL(file);
  };

  const handleContinue = () => {
    if (!capturedPhoto) {
      onError('Please capture or upload a document');
      return;
    }
    onCapture(capturedPhoto);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    if (useCamera) {
      startCamera();
    }
  };

  return (
    <div className="p-8 md:p-12">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Scan Your Document</h2>
        <p className="text-gray-600 mb-8">
          Capture a clear photo of your ID, passport, or driver's license. Make sure all text is visible and readable.
        </p>

        {/* Document Type Selection */}
        {!capturedPhoto && !useCamera && (
          <div className="space-y-4 mb-8">
            <p className="font-semibold text-gray-700">Select document type:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { type: 'passport' as DocumentType, label: '📕 Passport' },
                { type: 'id' as DocumentType, label: '🪪 ID Card' },
                { type: 'drivers-license' as DocumentType, label: '🚗 Driver\'s License' }
              ].map((doc) => (
                <button
                  key={doc.type}
                  onClick={() => setDocumentType(doc.type)}
                  className={`p-4 rounded-lg border-2 transition font-semibold ${
                    documentType === doc.type
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                >
                  {doc.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Photo Preview */}
        {capturedPhoto && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-2xl">
            <img src={capturedPhoto} alt="Document" className="w-full" />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
              <div className="text-center">
                <div className="inline-block bg-green-500 rounded-full p-4 mb-4 animate-bounce">
                  <FiCheck size={32} className="text-white" />
                </div>
                <p className="text-white font-semibold">Document captured!</p>
              </div>
            </div>
          </div>
        )}

        {/* Camera Preview */}
        {useCamera && !capturedPhoto && (
          <div className="relative mb-8 rounded-2xl overflow-hidden shadow-2xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-video object-cover"
            />

            {/* Document frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-full max-w-xs border-4 border-cyan-400 rounded-xl shadow-lg" style={{ aspectRatio: '1.6/1' }}>
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-cyan-400"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-cyan-400"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-cyan-400"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-cyan-400"></div>
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30">
              <div className="text-center text-white">
                <FiFileText size={48} className="mb-4 mx-auto" />
                <h3 className="text-2xl font-bold mb-2">Capture Document</h3>
                <p className="text-blue-200">
                  Position the document within the frame<br />
                  Make sure all corners are visible
                </p>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Controls */}
        <div className="space-y-3 mb-6">
          {!capturedPhoto && !useCamera && (
            <>
              <button
                onClick={startCamera}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-cyan-700 transition transform hover:scale-105 flex items-center justify-center"
              >
                📷 Use Camera
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105 flex items-center justify-center"
              >
                <FiUpload className="mr-2" />
                Upload Photo
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </>
          )}

          {useCamera && !capturedPhoto && (
            <>
              <button
                onClick={capturePhoto}
                className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center"
              >
                📸 Capture Photo
              </button>

              <button
                onClick={stopCamera}
                className="w-full bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </>
          )}

          {capturedPhoto && (
            <>
              <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition transform hover:scale-105 flex items-center justify-center"
              >
                <FiCheck className="mr-2" />
                Continue
              </button>

              <button
                onClick={retakePhoto}
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
            <li>• Make sure the entire document is visible</li>
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
