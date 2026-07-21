import React, { useEffect, useRef } from 'react';
import Script from 'next/script';

interface VeriffSDKProps {
  verificationUrl: string;
  onComplete?: (data: any) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    Veriff?: any;
  }
}

export default function VeriffSDK({ verificationUrl, onComplete, onError }: VeriffSDKProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.Veriff || !containerRef.current) return;

    // Initialize Veriff SDK
    const veriff = new window.Veriff({
      url: verificationUrl,
      onSession: () => {
        console.log('Veriff session started');
      },
      onEvent: (data: any) => {
        console.log('Veriff event:', data);
      },
      onError: (error: any) => {
        console.error('Veriff error:', error);
        onError?.(error);
      }
    });

    veriff.mount(containerRef.current);

    return () => {
      veriff.unmount();
    };
  }, [verificationUrl, onComplete, onError]);

  return (
    <>
      <Script
        src="https://cdn.veriff.com/js/sdk/latest"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('Veriff SDK loaded');
        }}
      />
      <div ref={containerRef} className="w-full h-screen" />
    </>
  );
}
