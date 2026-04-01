import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import Providers from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SHADE — Word Game",
  description: "Multiplayer söz oyunu — imposter-i tap!",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D0D0C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="az" className="dark" suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('shade_theme');if(t){document.documentElement.className=t}}catch(e){}})()`,
            }}
          />
          <meta name="color-scheme" content="dark light" />
        </head>
      <body
        className={`${nunito.variable} font-nunito bg-dark text-cream min-h-screen antialiased`}
      >
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
