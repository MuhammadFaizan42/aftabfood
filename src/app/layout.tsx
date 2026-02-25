import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Three Lines" />\n        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
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

