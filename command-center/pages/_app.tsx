import { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { SocketProvider } from '../hooks/useSocket';
import '../styles/globals.css';

function CommandCenterApp({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-gray-900 text-white">
        <Component {...pageProps} />
      </div>
    </SocketProvider>
  );
}

export default CommandCenterApp;
