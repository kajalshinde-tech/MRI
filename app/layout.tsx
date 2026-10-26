import type { Metadata, Viewport } from 'next';
import './globals.css';
import './public.css';
import OfflineStatus from '@/components/offline-status';
import GoogleTranslate from '@/components/google-translate';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0d9488',
};

export const metadata: Metadata = {
  title: 'MahaCare Registry | Maharashtra Diagnostic Centre Monitoring Application',
  description: 'Official prototype demonstration for registration, QR verification, and compliance monitoring of diagnostic centres across Maharashtra.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-800">
        {/* Keep route updates inside a stable React-owned container. Google
            Translate adds its own elements directly to document.body. */}
        <div id="app-content">{children}</div>
        <GoogleTranslate />
        <OfflineStatus />
      </body>
    </html>
  );
}
