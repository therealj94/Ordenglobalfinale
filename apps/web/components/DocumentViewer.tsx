import React, { useState } from 'react';
import { FiX, FiZoomIn, FiUser, FiFileText, FiAlertTriangle } from 'react-icons/fi';

const SOURCE_OF_FUNDS_LABELS: Record<string, string> = {
  salary: 'Salary / employment income',
  savings: 'Personal savings',
  business_income: 'Business income',
  investments: 'Investments',
  inheritance: 'Inheritance',
  other: 'Other'
};

function calculateAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

interface DocumentViewerProps {
  verification: {
    documentType?: string;
    documentFrontImage?: string;
    documentBackImage?: string;
    selfieImages?: string[];
    sourceOfFunds?: string;
    isPEP?: boolean;
    pepDetails?: string;
    User?: {
      dateOfBirth?: string;
      nationality?: string;
      countryOfResidence?: string;
      occupation?: string;
    };
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

  const user = verification.User;
  const hasAmlInfo = !!user || !!verification.sourceOfFunds;

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
          {hasAmlInfo && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">AML / Compliance Declaration</h4>
              <div className="bg-gray-50 rounded p-4 grid grid-cols-2 gap-3 text-sm">
                <p><span className="text-gray-600">Age:</span> <span className="font-medium">{calculateAge(user?.dateOfBirth) ?? 'N/A'}</span></p>
                <p><span className="text-gray-600">Nationality:</span> <span className="font-medium">{user?.nationality || 'N/A'}</span></p>
                <p><span className="text-gray-600">Country of Residence:</span> <span className="font-medium">{user?.countryOfResidence || 'N/A'}</span></p>
                <p><span className="text-gray-600">Occupation:</span> <span className="font-medium">{user?.occupation || 'N/A'}</span></p>
                <p className="col-span-2"><span className="text-gray-600">Source of Funds:</span> <span className="font-medium">{SOURCE_OF_FUNDS_LABELS[verification.sourceOfFunds || ''] || 'N/A'}</span></p>
              </div>
              {verification.isPEP && (
                <div className="mt-3 bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex items-center font-bold text-red-700 mb-2">
                    <FiAlertTriangle className="mr-2" />
                    Politically Exposed Person — Enhanced Due Diligence Required
                  </div>
                  <p className="text-sm text-red-800">{verification.pepDetails}</p>
                </div>
              )}
            </div>
          )}

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
