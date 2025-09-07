import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kino Alert - Spersonalizowane Powiadomienia Kinowe",
  description: "Otrzymuj spersonalizowane powiadomienia o filmach w Twoich ulubionych kinach. Nie przegap żadnego seansu!",
  keywords: "kino, filmy, powiadomienia, alert, personalizacja",
  authors: [{ name: "Kino Alert Team" }],
  creator: "Kino Alert",
  publisher: "Kino Alert",
  openGraph: {
    title: "Kino Alert - Spersonalizowane Powiadomienia Kinowe",
    description: "Otrzymuj spersonalizowane powiadomienia o filmach w Twoich ulubionych kinach.",
    type: "website",
    locale: "pl_PL",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="scroll-smooth dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="antialiased bg-black text-white overflow-x-hidden">
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
          {children}
        </div>
      </body>
    </html>
  );
}
