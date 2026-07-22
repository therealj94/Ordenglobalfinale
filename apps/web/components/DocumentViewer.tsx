import React, { useState } from 'react';
import { FiX, FiZoomIn, FiUser, FiFileText } from 'react-icons/fi';

interface DocumentViewerProps {
  verification: {
    documentType?: string;
    documentFrontImage?: string;
    documentBackImage?: string;
    selfieImages?: string[];
  };
  onClose: () => void;
}

export default function DocumentViewer({ verification, onClose }: DocumentViewerProps) {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const images: { label: string; src?: string }[] = [
    { label: 'Document — Front', src: verification.documentFrontImage },
    { label: 'Document — Back', src: verification.documentBackImage },
    ...(verification.selfieImages || []).map((img, idx) => ({
      label: `Selfie ${idx + 1}`,
      src: img
    }))
  ].filter((img) => !!img.src);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <FiFileText className="mr-2 text-blue-600" />
            Submitted Documents — {verification.documentType || 'N/A'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6">
          {images.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No documents were submitted for this verification.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <div className="rounded-lg overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                    <img
                      src={img.src}
                      alt={img.label}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setZoomedImage(img.src!)}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <FiZoomIn className="text-white" size={24} onClick={() => setZoomedImage(img.src!)} />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mt-2 flex items-center">
                    {img.label.startsWith('Selfie') ? (
                      <FiUser className="mr-1 text-gray-400" size={14} />
                    ) : (
                      <FiFileText className="mr-1 text-gray-400" size={14} />
                    )}
                    {img.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zoomed image overlay */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <img src={zoomedImage} alt="Zoomed" className="max-w-full max-h-full rounded-lg" />
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 text-white bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30"
          >
            <FiX size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
