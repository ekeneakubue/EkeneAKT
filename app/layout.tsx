import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../contexts/CartContext";
import { AuthProvider } from "../contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ekeneakt.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "AKT Lighting - Premium Lighting Solutions",
    template: "%s | AKT Lighting",
  },
  description: "Discover premium lighting solutions for your home and business. Shop chandeliers, pendant lights, LED fixtures, and more.",
  openGraph: {
    title: "AKT Lighting - Premium Lighting Solutions",
    description: "Discover premium lighting solutions for your home and business. Shop chandeliers, pendant lights, LED fixtures, and more.",
    url: baseUrl,
    siteName: "AKT Lighting",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AKT Lighting Premium Solutions",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AKT Lighting - Premium Lighting Solutions",
    description: "Discover premium lighting solutions for your home and business. Shop chandeliers, pendant lights, LED fixtures, and more.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
