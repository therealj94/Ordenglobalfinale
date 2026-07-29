import React from 'react';
import { FiExternalLink } from 'react-icons/fi';

/**
 * Deep links from a finished GENESIS ID straight into the ecosystem apps.
 *
 * Shown next to the identity card so someone who already has an account — and
 * is looking at their passport and its details here — can jump into the app
 * and have it pick their verified identity up, rather than being left to find
 * their own way back.
 *
 * These are plain anchors on purpose: browsers only honour navigation to a
 * custom app scheme when a real tap triggers it.
 */
const APPS = [
  { label: 'Veta Wallet', scheme: 'vetawallet://genesis-linked', accent: 'from-emerald-600 to-teal-600' },
  { label: 'My Token Pay', scheme: 'mytokenpay://genesis-linked', accent: 'from-indigo-600 to-violet-600' }
];

export default function OpenInEcosystemApp({ gid }: { gid: string }) {
  return (
    <div className="mt-6 bg-white rounded-xl shadow p-6">
      <h3 className="font-bold text-gray-900 mb-1">Abrir en tus apps del ecosistema</h3>
      <p className="text-gray-600 text-sm mb-4">
        Tu identidad <span className="font-mono font-semibold text-indigo-700">{gid}</span> ya está verificada. Ábrela
        en cualquier app de Orden Global — no necesitas volver a verificarte.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {APPS.map((app) => (
          <a
            key={app.label}
            href={`${app.scheme}?gid=${encodeURIComponent(gid)}&status=approved`}
            className={`flex items-center justify-center gap-2 bg-gradient-to-r ${app.accent} text-white px-5 py-3 rounded-lg font-semibold shadow hover:opacity-90 transition`}
          >
            <FiExternalLink size={17} />
            Volver a {app.label}
          </a>
        ))}
      </div>

      <p className="text-gray-400 text-xs mt-3">
        Si la app no se abre, instálala primero e inicia sesión con este mismo correo — tu GENESIS ID se vincula solo.
      </p>
    </div>
  );
}
