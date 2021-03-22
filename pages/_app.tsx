import { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="style-src 'self' 'unsafe-inline'; object-src 'none'; default-src 'self';"
        />
        <meta name="referrer" content="strict-origin" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
