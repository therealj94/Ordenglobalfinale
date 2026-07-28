import React, { useState } from 'react';
import { FiArrowRightCircle, FiSmartphone } from 'react-icons/fi';

interface EcosystemReturnProps {
  /** Deep link back into the app that started this flow (e.g. vetawallet://kyc-callback). */
  returnUrl: string;
  /** Human-readable name of that app, e.g. "Veta Wallet". */
  appLabel: string;
  status: 'approved' | 'pending' | 'rejected';
  verificationId?: string;
}

/**
 * The button that hands the user back to the app that sent them here.
 *
 * This is deliberately a button and not an automatic redirect. Browsers block
 * navigation to a custom app scheme (vetawallet://…) unless it's triggered by
 * a real user gesture, so an automatic `window.location.href = …` fired from a
 * polling callback is silently dropped — which is exactly why the flow used to
 * dead-end here instead of returning to the app.
 */
export default function EcosystemReturn({ returnUrl, appLabel, status, verificationId }: EcosystemReturnProps) {
  const [tried, setTried] = useState(false);

  const target = (() => {
    try {
      const url = new URL(returnUrl);
      url.searchParams.set('status', status);
      if (verificationId) url.searchParams.set('verificationId', verificationId);
      return url.toString();
    } catch {
      return returnUrl;
    }
  })();

  return (
    <div className="mt-6">
      {/* A plain anchor, so the tap itself is the navigation — no JS redirect
          that the browser could classify as automatic and block. */}
      <a
        href={target}
        onClick={() => setTried(true)}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:from-indigo-700 hover:to-blue-700 transition"
      >
        <FiArrowRightCircle size={22} />
        Volver a {appLabel}
      </a>

      <p className="text-center text-gray-500 text-xs mt-3 flex items-center justify-center gap-1.5">
        <FiSmartphone size={12} />
        {tried
          ? `Si ${appLabel} no se abrió, cierra esta ventana — tu identidad ya quedó guardada y la app la recibirá al volver.`
          : `Tu GENESIS ID ya está listo. Toca el botón para volver a ${appLabel}.`}
      </p>
    </div>
  );
}
