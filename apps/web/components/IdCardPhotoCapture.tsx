import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FiCamera, FiUpload, FiCheck, FiRotateCw, FiCameraOff, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface IdCardPhotoCaptureProps {
  onSubmit: (photo: string) => Promise<void>;
}

export default function IdCardPhotoCapture({ onSubmit }: IdCardPhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setUseCamera(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (useCamera && stream && !photo && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().catch(() => {});
          setCameraLoading(false);
        };
      }
    }
  }, [useCamera, stream, photo]);

  const startCamera = async () => {
    try {
      setCameraError(false);
      setCameraLoading(true);
      setUseCamera(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 720 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      setCameraError(true);
      setCameraLoading(false);
      toast.error('Could not access camera. You can upload a photo instead.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0);

    setPhoto(canvas.toDataURL('image/jpeg', 0.92));
    stopCamera();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPhoto(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!photo) return;
    try {
      setSubmitting(true);
      await onSubmit(photo);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save photo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      {photo && (
        <div className="relative mb-4 rounded-xl overflow-hidden shadow-lg">
          <img src={photo} alt="ID card preview" className="w-full aspect-square object-cover" />
          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent pb-2">
            <div className="bg-green-500 rounded-full p-1.5">
              <FiCheck size={16} className="text-white" />
            </div>
          </div>
        </div>
      )}

      {useCamera && !photo && (
        <div className="relative mb-4 rounded-xl overflow-hidden shadow-lg bg-black aspect-square">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover [transform:scaleX(-1)]" />
          {cameraLoading && !cameraError && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center text-white text-center px-4">
              <FiCameraOff size={28} className="mb-2 text-red-400" />
              <p className="text-sm">Couldn't access your camera.</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      <div className="space-y-3">
        {!photo && !useCamera && (
          <>
            <button
              onClick={startCamera}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-blue-700 transition flex items-center justify-center"
            >
              <FiCamera className="mr-2" />
              Take Photo
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition flex items-center justify-center"
            >
              <FiUpload className="mr-2" />
              Upload Photo
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </>
        )}

        {useCamera && !photo && !cameraLoading && (
          <button
            onClick={capturePhoto}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center"
          >
            <FiCamera className="mr-2" />
            Capture
          </button>
        )}

        {photo && (
          <>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition flex items-center justify-center"
            >
              {submitting ? <FiLoader className="animate-spin mr-2" /> : <FiCheck className="mr-2" />}
              {submitting ? 'Saving...' : 'Use This Photo'}
            </button>
            <button
              onClick={() => setPhoto(null)}
              disabled={submitting}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 disabled:opacity-50 transition flex items-center justify-center"
            >
              <FiRotateCw className="mr-2" />
              Retake
            </button>
          </>
        )}
      </div>
    </div>
  );
}
