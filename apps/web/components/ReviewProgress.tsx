import React, { useEffect, useState } from 'react';
import { FiCheck, FiX, FiLoader, FiClock } from 'react-icons/fi';
import { useT } from '@/lib/i18n';

export type ReviewOutcome = 'working' | 'passed' | 'failed';

interface ReviewProgressProps {
  /** Set once the backend has answered; drives the final state of every row. */
  outcome?: ReviewOutcome;
  /** Shown under the list when the wait turns out to be a long one. */
  longWait?: boolean;
}

const STEP_KEYS = [
  'kyc.review.received',
  'kyc.review.quality',
  'kyc.review.face',
  'kyc.review.document',
  'kyc.review.identity'
];

// Roughly how long the engine takes to settle. The point isn't to predict it
// precisely — it's that the person waiting can see something happening and
// knows which part is underway, instead of staring at a spinner that never
// explains itself.
const STEP_INTERVAL_MS = 9000;

export default function ReviewProgress({ outcome = 'working', longWait = false }: ReviewProgressProps) {
  const t = useT();
  const [reached, setReached] = useState(0);

  useEffect(() => {
    if (outcome !== 'working') return;
    const timer = setInterval(() => {
      // Hold on the last row rather than claiming everything is done — the
      // engine, not this timer, decides when it's finished.
      setReached((n) => Math.min(n + 1, STEP_KEYS.length - 1));
    }, STEP_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [outcome]);

  const stateOf = (index: number): ReviewOutcome | 'waiting' => {
    if (outcome === 'passed') return 'passed';
    if (outcome === 'failed') {
      // Everything before the point it got to still succeeded; the step it
      // stopped on is the one that failed.
      if (index < reached) return 'passed';
      if (index === reached) return 'failed';
      return 'waiting';
    }
    if (index < reached) return 'passed';
    if (index === reached) return 'working';
    return 'waiting';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <ul className="space-y-3">
        {STEP_KEYS.map((key, index) => {
          const state = stateOf(index);
          return (
            <li
              key={key}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                state === 'passed'
                  ? 'border-emerald-200 bg-emerald-50'
                  : state === 'failed'
                  ? 'border-red-200 bg-red-50'
                  : state === 'working'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <span
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white ${
                  state === 'passed'
                    ? 'bg-emerald-500'
                    : state === 'failed'
                    ? 'bg-red-500'
                    : state === 'working'
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}
              >
                {state === 'passed' && <FiCheck size={15} />}
                {state === 'failed' && <FiX size={15} />}
                {state === 'working' && <FiLoader size={14} className="animate-spin" />}
                {state === 'waiting' && <FiClock size={13} />}
              </span>

              <span
                className={`text-sm ${
                  state === 'waiting' ? 'text-gray-400' : 'text-gray-800 font-medium'
                }`}
              >
                {t(key)}
              </span>
            </li>
          );
        })}
      </ul>

      {longWait && outcome === 'working' && (
        <p className="text-gray-500 text-xs text-center mt-5 leading-relaxed">{t('kyc.review.waitNote')}</p>
      )}
    </div>
  );
}
