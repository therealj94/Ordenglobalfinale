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

// A woven guilloché-style engraving — overlapping wave paths tiled both
// ways, the same kind of engine-turned security print real passport paper
// uses, instead of a flat straight-line grid. Sepia ink tone on the cream
// paper background.
const GUILLOCHE_TILE = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
    <g fill='none' stroke='#8a6a3a' stroke-width='0.6'>
      <path d='M-10,10 Q20,-10 50,10 T110,10 T170,10'/>
      <path d='M-10,30 Q20,10 50,30 T110,30 T170,30'/>
      <path d='M-10,50 Q20,30 50,50 T110,50 T170,50'/>
      <path d='M-10,70 Q20,50 50,70 T110,70 T170,70'/>
      <path d='M-10,90 Q20,70 50,90 T110,90 T170,90'/>
      <path d='M-10,110 Q20,90 50,110 T110,110 T170,110'/>
      <path d='M10,-10 Q-10,20 10,50 T10,110 T10,170'/>
      <path d='M30,-10 Q10,20 30,50 T30,110 T30,170'/>
      <path d='M50,-10 Q30,20 50,50 T50,110 T50,170'/>
      <path d='M70,-10 Q50,20 70,50 T70,110 T70,170'/>
      <path d='M90,-10 Q70,20 90,50 T90,110 T90,170'/>
      <path d='M110,-10 Q90,20 110,50 T110,110 T110,170'/>
    </g>
  </svg>
`)}`;

// Repeating "GENESIS ID" micro-print, tiled diagonally — the same kind of
// security-paper watermark real passports/ID documents use, built as an
// inline SVG data URI so no image asset is needed.
const WATERMARK_TILE = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='210' height='120'>
    <text x='0' y='60' font-family='Georgia, serif' font-size='15' font-weight='700'
      letter-spacing='2' fill='#7a5a2e' transform='rotate(-28 105 60)'>GENESIS ID</text>
  </svg>
`)}`;

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
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 220, color: { dark: '#2b2013', light: '#00000000' } })
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
        className="rounded-lg overflow-hidden shadow-2xl border border-[#c9b98a] bg-[#f6efdb] relative"
      >
        {/* Header — the "cover" band */}
        <div className="relative bg-gradient-to-r from-[#1a2a4a] via-[#152238] to-[#0f1a2e] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white bg-opacity-10 flex items-center justify-center border border-amber-400/50 shrink-0">
              <FiShield className="text-amber-400" size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-white font-serif font-bold text-lg leading-tight tracking-wide">GENESIS ID</p>
              <p className="text-amber-200/70 text-[8px] uppercase tracking-[0.2em]">by Orden Global Ecosystem</p>
            </div>
          </div>
        </div>
        <div className="h-[3px] bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600" />

        {/* Body — the "paper" page */}
        <div className="relative px-6 pt-6 pb-4 text-center">
          {/* Warm paper gradient wash */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, #fffbf0 0%, #f3ead0 60%, #ecdfb8 100%)' }}
          />
          {/* Guilloché engraving */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.22]"
            style={{ backgroundImage: `url("${GUILLOCHE_TILE}")`, backgroundRepeat: 'repeat' }}
          />
          {/* "GENESIS ID" micro-print watermark */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.16]"
            style={{ backgroundImage: `url("${WATERMARK_TILE}")`, backgroundRepeat: 'repeat' }}
          />
          {/* Large faded shield emblem */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.09]">
            <FiShield size={280} className="text-[#4a3618]" />
          </div>
          {/* Engraved double-rule frame */}
          <div className="absolute inset-2 border-double border-4 border-amber-800/25 pointer-events-none rounded-sm" />

          <div className="relative z-10">
            <p className="font-serif text-[11px] uppercase tracking-[0.25em] text-amber-900/70 font-semibold mb-4">
              Global Digital Identity
            </p>

            {/* Photo */}
            <div className="mx-auto w-32 h-40 overflow-hidden bg-gray-200 border-2 border-[#4a3618]/40 shadow-md mb-4">
              {idCardPhoto ? (
                <img src={idCardPhoto} alt={fullName} className="w-full h-full object-cover grayscale-[0.15] sepia-[0.15]" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center px-2">
                  No photo
                </div>
              )}
            </div>

            {/* Fields — stacked, left-aligned inside a centered block */}
            <div className="inline-block text-left w-full max-w-[240px]">
              <p className="text-[10px] uppercase tracking-widest text-amber-900/60 font-semibold">Global Identity Number</p>
              <p className="font-mono font-bold text-lg text-[#2b2013] tracking-wide mb-2 truncate">{gid}</p>

              <p className="text-[10px] uppercase tracking-widest text-amber-900/60 font-semibold">Full Name</p>
              <p className="font-serif font-semibold text-[#2b2013] text-lg mb-2 truncate">{fullName}</p>

              <p className="text-[10px] uppercase tracking-widest text-amber-900/60 font-semibold">Nationality</p>
              <p className="text-[#3a2c18] text-sm mb-2">{countryName(nationality)}</p>

              {showFullDetails && (
                <>
                  <p className="text-[10px] uppercase tracking-widest text-amber-900/60 font-semibold">Date of Birth</p>
                  <p className="text-[#3a2c18] text-sm mb-2">{formatDate(dateOfBirth)}</p>
                </>
              )}

              <p className="text-[10px] uppercase tracking-widest text-amber-900/60 font-semibold">Status</p>
              <p className="text-emerald-800 font-bold text-sm flex items-center gap-1">
                VERIFIED MEMBER <span className="text-amber-600">✓</span>
              </p>
            </div>

            {/* QR */}
            {qrDataUrl && (
              <div className="flex flex-col items-center mt-4">
                <img src={qrDataUrl} alt="Scan to verify" className="w-28 h-28" />
                <p className="text-[8px] uppercase tracking-wider text-amber-900/50 mt-1">Scan to verify</p>
              </div>
            )}

            {showFullDetails && (
              <div className="flex justify-between mt-5 pt-4 border-t border-amber-800/25 text-xs max-w-[240px] mx-auto">
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-widest text-amber-900/60 font-semibold">Issued</p>
                  <p className="text-[#3a2c18]">{formatDate(issuedAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-amber-900/60 font-semibold">Valid Until</p>
                  <p className="text-[#3a2c18]">{formatDate(expiresAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Passport-style machine-readable zone (decorative) */}
        <div className="relative bg-[#0f1a2e] px-5 py-3">
          <p className="font-mono text-[10px] text-emerald-400/90 tracking-[0.1em] leading-relaxed whitespace-pre text-center">
            {mrzLine1}
            {'\n'}
            {mrzLine2}
          </p>
        </div>

        {/* Footer */}
        <div className="relative bg-gradient-to-r from-[#1a2a4a] via-[#152238] to-[#0f1a2e] px-5 py-2 flex items-center justify-center">
          <p className="text-amber-200/70 text-[8px] uppercase tracking-[0.2em]">Genesis ID · Orden Global Ecosystem</p>
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
