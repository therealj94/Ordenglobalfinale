import React, { useRef, useState, useEffect } from 'react';
import { FiUpload, FiCheck, FiRotateCw, FiFileText, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { DocumentType } from '@/hooks/useVerification';

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

export default function DocumentCapture({ onCapture, onError }: DocumentCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [side, setSide] = useState<Side>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [useCamera, setUseCamera] = useState(false);

  const selectedDoc = DOC_OPTIONS.find((d) => d.type === documentType);
  const currentImage = side === 'front' ? frontImage : backImage;

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
        audio: false
      });

      // The <video> element only mounts once useCamera flips to true, so its
      // ref isn't attached yet at this point — hand the stream to state and
      // let the effect below attach it once the element exists.
      setStream(mediaStream);
      setUseCamera(true);
    } catch (err) {
      onError('Could not access camera.');
    }
  };

  useEffect(() => {
    if (useCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [useCamera, stream]);

  const stopCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setUseCamera(false);
  };

  const setImageForSide = (photo: string) => {
    if (side === 'front') setFrontImage(photo);
    else setBackImage(photo);
  };

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
    ctx.drawImage(videoRef.current, 0, 0);

    const photo = canvasRef.current.toDataURL('image/jpeg', 0.9);
    setImageForSide(photo);
    stopCamera();
    toast.success(`${side === 'front' ? 'Front' : 'Back'} captured!`);
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
          Capture a clear photo of the {side === 'front' ? 'front' : 'back'} side. Make sure all text is visible.
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
            <video ref={videoRef} autoPlay playsInline className="w-full aspect-video object-cover" />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="relative w-full max-w-xs border-4 border-cyan-400 rounded-xl shadow-lg"
                style={{ aspectRatio: '1.6/1' }}
              >
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-cyan-400"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-cyan-400"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-cyan-400"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-cyan-400"></div>
              </div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30 pointer-events-none">
              <div className="text-center text-white">
                <FiFileText size={48} className="mb-4 mx-auto" />
                <h3 className="text-2xl font-bold mb-2">
                  Capture {side === 'front' ? 'Front' : 'Back'}
                </h3>
                <p className="text-blue-200">Position the document within the frame</p>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
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

          {useCamera && !currentImage && (
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
