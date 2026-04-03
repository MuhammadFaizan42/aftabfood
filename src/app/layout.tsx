import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import ChunkLoadRecovery from "@/components/ChunkLoadRecovery";
import Footer from "@/components/common/Footer";
import OfflineProvider from "@/components/offline/OfflineProvider";
import PWAInstallPrompt from "@/components/offline/PWAInstallPrompt";
import { SyncStatusProvider } from "@/lib/offline/SyncStatusContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Three Lines - Dashboard",
  description: "Three Lines Sales App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var K='aftab-chunk-reload-once';function ssGet(k){try{return sessionStorage.getItem(k);}catch(e){return null;}}function ssSet(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}function go(){if(ssGet(K))return;ssSet(K,'1');var u=new URL(location.href);u.searchParams.set('_cb',String(Date.now()));location.replace(u.toString());}function isChunk(r){if(!r)return false;var m=String(r.message||r||'');return/ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(m);}window.addEventListener('unhandledrejection',function(e){if(isChunk(e.reason)){try{e.preventDefault();}catch(x){}go();}});window.addEventListener('error',function(e){var t=e.target;if(!t)return;var u=t.src||t.href||'';if(u.indexOf('/_next/')===-1)return;if((t.tagName==='SCRIPT'||t.tagName==='LINK')&&!ssGet(K))go();},true);})();`,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Majestic Three Line" />
        <link rel="apple-touch-icon" href="/icons/mjlogo1.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <ChunkLoadRecovery />
        <OfflineProvider>
          <SyncStatusProvider>
            <main className="min-h-screen">{children}</main>
            <PWAInstallPrompt />
          </SyncStatusProvider>
        </OfflineProvider>
        <Footer />
      </body>
    </html>
  );
}

