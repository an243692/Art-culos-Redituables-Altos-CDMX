import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeListener } from "@/components/ThemeListener";
import Script from "next/script";


const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

import { Dancing_Script } from 'next/font/google';
const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-cursive',
});

export const metadata: Metadata = {
  title: {
    default: "Altos Artículos Redituables | Papelería y Artículos de Oficina en CDMX",
    template: "%s | Altos Artículos",
  },
  description: "La mejor papelería mayorista en CDMX. Encuentra artículos de oficina, material escolar, libretas Van Gogh y más a precio de mayoreo y caja. ¡Incrementa tus ganancias en la Ciudad de México!",
  keywords: [
    "Altos Artículos",
    "Altos Artículos Redituable",
    "Papelería CDMX",
    "Artículos de oficina CDMX",
    "Útiles escolares CDMX",
    "Libretas Van Gogh",
    "Papelería por mayoreo CDMX",
    "Artículos redituables",
    "Mayoreo y menudeo",
    "Material de oficina Ciudad de México",
    "Distribuidor de papelería",
    "Mayorista de artículos escolares",
    "CDMX"
  ],
  authors: [{ name: "Altos Artículos" }],
  creator: "Altos Artículos Redituables",
  publisher: "Altos Artículos",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Altos Artículos Redituables | Papelería y Artículos de Oficina CDMX",
    description: "Distribuidor mayorista de papelería en la CDMX. Tenemos artículos de oficina, libretas Van Gogh y mucho más a excelentes precios.",
    siteName: "Altos Artículos Redituables",
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Altos Artículos Redituables | Papelería en CDMX",
    description: "La mejor papelería mayorista en CDMX. Encuentra artículos de oficina y escolares a precios de mayoreo.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "IrM9WcjUljRMuAMSczY0FgfwfYfxCOex431oL3oDAjU",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Lato:wght@400;700;900&family=Nunito:wght@400;600;800&family=Open+Sans:wght@400;600;800&family=Oswald:wght@400;600;700&family=Playfair+Display:wght@400;600;800&family=Poppins:wght@400;600;800&family=Quicksand:wght@400;600;700&family=Raleway:wght@400;600;800&family=Roboto:wght@400;500;700;900&family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="icon" href="/logo.jpg" type="image/jpeg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Altos Artículos Redituables",
              "image": "https://altosarticulosredituables.com.mx/logo.jpg",
              "@id": "https://altosarticulosredituables.com.mx",
              "url": "https://altosarticulosredituables.com.mx",
              "description": "Distribuidor mayorista de papelería en la CDMX. Libretas Van Gogh, artículos escolares y de oficina a precio de caja.",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Ciudad de México",
                "addressRegion": "CDMX",
                "addressCountry": "MX"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 19.432608,
                "longitude": -99.133209
              },
              "priceRange": "$",
              "keywords": "papelería cdmx, artículos de oficina, libretas van gogh, mayoreo"
            })
          }}
        />
      </head>
      <body className={`${montserrat.variable} ${dancingScript.variable} font-[family-name:var(--font-montserrat)] bg-[#f4f6f9] text-gray-900 antialiased`}>
        <AuthProvider>
          <CartProvider>
            <ThemeListener />
            {children}
          </CartProvider>
        </AuthProvider>
        <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
