import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { FiShield } from 'react-icons/fi';
import { COUNTRIES } from '@/lib/countries';

export interface GenesisIDCardProps {
  fullName: string;
  gid: string;
  nationality?: string | null;
  idCardPhoto?: string | null;
  dateOfBirth?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  /** Full detail (DOB + issue/expiry dates) — only for the owner or admin, never the public QR view. */
  showFullDetails?: boolean;
}

function countryName(code?: string | null) {
  if (!code) return '—';
  return COUNTRIES.find((c) => c.code === code)?.name || code;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

export default function GenesisIDCard({
  fullName,
  gid,
  nationality,
  idCardPhoto,
  dateOfBirth,
  issuedAt,
  expiresAt,
  showFullDetails = true
}: GenesisIDCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const verifyUrl = `${appUrl}/verify-gid/${encodeURIComponent(gid)}`;
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 200, color: { dark: '#1e293b', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [gid]);

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-indigo-200 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-white bg-opacity-15 flex items-center justify-center">
            <FiShield className="text-white" size={18} />
          </div>
          <div>
            <p className="text-white font-extrabold text-lg leading-tight tracking-wide">GENESIS ID</p>
            <p className="text-indigo-200 text-[10px] uppercase tracking-widest">Orden Global Ecosystem</p>
          </div>
        </div>
        <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Digital Identity</p>
      </div>

      {/* Body */}
      <div className="bg-gradient-to-br from-slate-50 to-white p-6">
        <div className="flex gap-5">
          {/* Photo */}
          <div className="shrink-0 w-28 h-32 rounded-lg overflow-hidden bg-gray-200 border-2 border-white shadow-md">
            {idCardPhoto ? (
              <img src={idCardPhoto} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center px-2">
                No photo
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Genesis ID Number</p>
            <p className="font-mono font-bold text-xl text-slate-900 tracking-wide mb-2 truncate">{gid}</p>

            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Full Name</p>
            <p className="font-semibold text-slate-900 mb-2 truncate">{fullName}</p>

            <div className="grid grid-cols-2 gap-x-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Nationality</p>
                <p className="text-slate-800 text-sm mb-2">{countryName(nationality)}</p>
              </div>
              {showFullDetails && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Date of Birth</p>
                  <p className="text-slate-800 text-sm mb-2">{formatDate(dateOfBirth)}</p>
                </div>
              )}
            </div>

            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Status</p>
            <p className="text-green-700 font-bold text-sm flex items-center gap-1">
              VERIFIED MEMBER <span className="text-amber-500">✓</span>
            </p>
          </div>

          {/* QR */}
          <div className="shrink-0 hidden sm:flex flex-col items-center justify-center">
            {qrDataUrl && <img src={qrDataUrl} alt="Scan to verify" className="w-20 h-20" />}
            <p className="text-[8px] uppercase tracking-wider text-gray-400 mt-1 text-center">Scan to verify</p>
          </div>
        </div>

        {showFullDetails && (
          <div className="flex justify-between mt-5 pt-4 border-t border-indigo-100 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Issued</p>
              <p className="text-slate-700">{formatDate(issuedAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Valid Until</p>
              <p className="text-slate-700">{formatDate(expiresAt)}</p>
            </div>
          </div>
        )}

        {/* Mobile QR (shown below fields on small screens) */}
        {qrDataUrl && (
          <div className="sm:hidden flex flex-col items-center mt-4 pt-4 border-t border-indigo-100">
            <img src={qrDataUrl} alt="Scan to verify" className="w-24 h-24" />
            <p className="text-[9px] uppercase tracking-wider text-gray-400 mt-1">Scan to verify</p>
          </div>
        )}
      </div>
    </div>
  );
}
