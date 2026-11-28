import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Carvexio",
  description: "Marketplace de repuestos",
  icons: {
    icon: "/logo2.png",
    shortcut: "/logo2.png",
    apple: "/logo2.png",
  },
};

import { Auth0Provider } from '@auth0/nextjs-auth0/client';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased">
        <Auth0Provider>
          {children}
        </Auth0Provider>
      </body>
    </html>
  );
}
