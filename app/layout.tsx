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

export const metadata: Metadata = {
  title: "AKT Lighting - Premium Lighting Solutions",
  description: "Discover premium lighting solutions for your home and business. Shop chandeliers, pendant lights, LED fixtures, and more.",
  openGraph: {
    title: "AKT Lighting - Premium Lighting Solutions",
    description: "Discover premium lighting solutions for your home and business. Shop chandeliers, pendant lights, LED fixtures, and more.",
    url: "https://ekeneakt.com",
    siteName: "AKT Lighting",
    images: [
      {
        url: "/og-image.jpg", // Assuming an OG image exists or will be added
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
