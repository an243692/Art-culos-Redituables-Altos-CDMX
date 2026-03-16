import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeListener } from "@/components/ThemeListener";


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
  title: "Altos Artículos | Catálogo Mayorista",
  description: "La mejor papelería y artículos a precio de mayoreo y caja. Pedidos por WhatsApp.",
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
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="icon" href="/logo.jpg" type="image/jpeg" />
      </head>
      <body className={`${montserrat.variable} ${dancingScript.variable} font-[family-name:var(--font-montserrat)] bg-[#f4f6f9] text-gray-900 antialiased`}>
        <AuthProvider>
          <CartProvider>
            <ThemeListener />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
