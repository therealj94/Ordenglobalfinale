import React from 'react';

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';
export const BUILD_SHA = process.env.NEXT_PUBLIC_BUILD_SHA || 'local';

/**
 * Says which build is actually being served, on every page.
 *
 * The version alone isn't enough to answer "did my deploy land?" — it only
 * changes when someone remembers to change it. The commit hash comes from the
 * host at build time, so it always matches the code that's really running and
 * can be compared against what was pushed.
 */
export default function BuildStamp({ className = '' }: { className?: string }) {
  const time = process.env.NEXT_PUBLIC_BUILD_TIME;
  const built = time ? new Date(time).toLocaleString() : null;

  return (
    <p
      className={`text-[11px] text-center opacity-60 select-text ${className}`}
      title={built ? `Build: ${built}` : undefined}
    >
      GENESIS ID v{APP_VERSION} · build {BUILD_SHA}
    </p>
  );
}
