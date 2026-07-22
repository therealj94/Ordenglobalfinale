import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { FiShield, FiDownload, FiLoader } from 'react-icons/fi';
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
  /** Show a "Download" button that exports the card as a PNG. Off by default (e.g. on the public verify page). */
  allowDownload?: boolean;
}

function countryName(code?: string | null) {
  if (!code) return '—';
  return COUNTRIES.find((c) => c.code === code)?.name || code;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

// Decorative, passport-style "machine readable zone" — NOT a real ICAO 9303
// MRZ (no check digits, not meant to be scanned). Purely visual flavor to
// match the passport-page aesthetic.
function buildMrzLines(fullName: string, gid: string, nationality?: string | null) {
  // Real MRZs transliterate accented Latin letters to their unaccented
  // equivalent (García -> GARCIA) rather than dropping them.
  const clean = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const surname = clean(parts[parts.length - 1] || '');
  const given = clean(parts.slice(0, -1).join(' ') || parts[0] || '');
  const country = clean(nationality || 'UNK').padEnd(3, 'X').slice(0, 3);

  let line1 = `ID${country}${surname}<<${given}`;
  line1 = (line1 + '<'.repeat(36)).slice(0, 36);

  const gidCompact = clean(gid).padEnd(16, '<').slice(0, 16);
  let line2 = `${gidCompact}${country}${'<'.repeat(16)}`;
  line2 = line2.slice(0, 36);

  return [line1, line2];
}

export default function GenesisIDCard({
  fullName,
  gid,
  nationality,
  idCardPhoto,
  dateOfBirth,
  issuedAt,
  expiresAt,
  showFullDetails = true,
  allowDownload = false
}: GenesisIDCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const verifyUrl = `${appUrl}/verify-gid/${encodeURIComponent(gid)}`;
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 220, color: { dark: '#1e293b', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [gid]);

  const [mrzLine1, mrzLine2] = buildMrzLines(fullName, gid, nationality);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `${gid}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      // Silently ignore — the card is still visible on screen either way.
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        ref={cardRef}
        className="rounded-2xl overflow-hidden shadow-2xl border border-indigo-200 bg-white relative"
      >
        {/* Security-paper watermark texture — runs the full height of the card */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, #1e3a8a 0px, #1e3a8a 1px, transparent 1px, transparent 9px), repeating-linear-gradient(25deg, #1e3a8a 0px, #1e3a8a 1px, transparent 1px, transparent 9px)'
          }}
        />
        {/* Large faded shield watermark, passport-style */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05]">
          <FiShield size={260} className="text-indigo-900" />
        </div>

        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white bg-opacity-10 flex items-center justify-center border border-indigo-400 shrink-0">
              <FiShield className="text-amber-400" size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-white font-extrabold text-lg leading-tight tracking-wide">GENESIS ID</p>
              <p className="text-indigo-300 text-[8px] uppercase tracking-[0.2em]">by Orden Global Ecosystem</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500" />

        {/* Body — stacked vertically, passport-page style */}
        <div className="relative bg-gradient-to-b from-slate-50 to-white px-6 pt-6 pb-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-500 font-semibold mb-4">
            Global Digital Identity
          </p>

          {/* Photo */}
          <div className="mx-auto w-32 h-40 rounded-lg overflow-hidden bg-gray-200 border-2 border-white shadow-md ring-1 ring-indigo-100 mb-4">
            {idCardPhoto ? (
              <img src={idCardPhoto} alt={fullName} className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center px-2">
                No photo
              </div>
            )}
          </div>

          {/* Fields — stacked, left-aligned inside a centered block */}
          <div className="inline-block text-left w-full max-w-[240px]">
            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Global Identity Number</p>
            <p className="font-mono font-bold text-lg text-slate-900 tracking-wide mb-2 truncate">{gid}</p>

            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Full Name</p>
            <p className="font-semibold text-slate-900 mb-2 truncate">{fullName}</p>

            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Nationality</p>
            <p className="text-slate-800 text-sm mb-2">{countryName(nationality)}</p>

            {showFullDetails && (
              <>
                <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Date of Birth</p>
                <p className="text-slate-800 text-sm mb-2">{formatDate(dateOfBirth)}</p>
              </>
            )}

            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Status</p>
            <p className="text-green-700 font-bold text-sm flex items-center gap-1">
              VERIFIED MEMBER <span className="text-amber-500">✓</span>
            </p>
          </div>

          {/* QR */}
          {qrDataUrl && (
            <div className="flex flex-col items-center mt-4">
              <img src={qrDataUrl} alt="Scan to verify" className="w-28 h-28" />
              <p className="text-[8px] uppercase tracking-wider text-gray-400 mt-1">Scan to verify</p>
            </div>
          )}

          {showFullDetails && (
            <div className="flex justify-between mt-5 pt-4 border-t border-indigo-100 text-xs max-w-[240px] mx-auto">
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Issued</p>
                <p className="text-slate-700">{formatDate(issuedAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold">Valid Until</p>
                <p className="text-slate-700">{formatDate(expiresAt)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Passport-style machine-readable zone (decorative) */}
        <div className="relative bg-slate-900 px-5 py-3">
          <p className="font-mono text-[10px] text-green-400 tracking-[0.1em] leading-relaxed whitespace-pre text-center">
            {mrzLine1}
            {'\n'}
            {mrzLine2}
          </p>
        </div>

        {/* Footer */}
        <div className="relative bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 px-5 py-2 flex items-center justify-center">
          <p className="text-indigo-300 text-[8px] uppercase tracking-[0.2em]">Genesis ID · Orden Global Ecosystem</p>
        </div>
      </div>

      {allowDownload && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {downloading ? <FiLoader className="animate-spin" /> : <FiDownload />}
          {downloading ? 'Preparing download...' : 'Download GENESIS ID'}
        </button>
      )}
    </div>
  );
}
