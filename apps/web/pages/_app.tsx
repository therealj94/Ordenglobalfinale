import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import { I18nProvider } from '@/lib/i18n';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <I18nProvider>
      <Head>
        {/* Without this the whole site renders at desktop width on a phone and
            every control comes out too small to use. */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <Component {...pageProps} />
      <Toaster position="top-center" />
    </I18nProvider>
  );
}
