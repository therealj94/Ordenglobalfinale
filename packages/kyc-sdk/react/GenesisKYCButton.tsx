import React, { useEffect, useRef } from 'react';

/**
 * React convenience wrapper around the genesis-kyc-sdk vanilla JS widget.
 * Copy this file into your React/Next.js app (Veta Wallet, My Token Pay, etc.)
 * alongside a <script src=".../sdk/genesis-kyc-sdk.js"> tag (e.g. in _document.tsx
 * or next/script), or bundle it however your app loads third-party scripts.
 */

export interface GenesisKYCResult {
  status: 'approved' | 'pending' | 'rejected';
  verificationId?: string;
}

interface GenesisKYCButtonProps {
  userId: string;
  appName: string;
  baseUrl?: string;
  className?: string;
  children?: React.ReactNode;
  onComplete: (result: GenesisKYCResult) => void;
  onError?: (error: Error) => void;
}

declare global {
  interface Window {
    GenesisKYC?: {
      configure: (opts: { baseUrl: string }) => void;
      verify: (opts: {
        userId: string;
        appName: string;
        baseUrl?: string;
        onComplete: (result: GenesisKYCResult) => void;
        onError: (error: Error) => void;
      }) => void;
      verifyRedirect: (opts: { userId: string; appName: string; returnUrl?: string; baseUrl?: string }) => void;
    };
  }
}

export default function GenesisKYCButton({
  userId,
  appName,
  baseUrl,
  className,
  children,
  onComplete,
  onError
}: GenesisKYCButtonProps) {
  const readyRef = useRef(false);

  useEffect(() => {
    readyRef.current = !!window.GenesisKYC;
  }, []);

  const handleClick = () => {
    if (!window.GenesisKYC) {
      onError?.(new Error('genesis-kyc-sdk script not loaded. Add the <script> tag first.'));
      return;
    }

    window.GenesisKYC.verify({
      userId,
      appName,
      baseUrl,
      onComplete,
      onError: (err) => onError?.(err)
    });
  };

  return (
    <button onClick={handleClick} className={className}>
      {children || 'Verify My Identity'}
    </button>
  );
}
