import { Metadata } from "next";
import HomeClient from "./HomeClient";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ekeneakt.com";

export const metadata: Metadata = {
  title: "AKT Lighting - Premium Lighting Solutions",
  description: "Discover premium lighting solutions for your home and business. Shop chandeliers, pendant lights, LED fixtures, and more.",
  openGraph: {
    title: "AKT Lighting - Premium Lighting Solutions",
    description: "Discover premium lighting solutions for your home and business. Shop chandeliers, pendant lights, LED fixtures, and more.",
    url: baseUrl,
    siteName: "AKT Lighting",
    images: [
      {
        url: `${baseUrl}/og-image.jpg`,
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
    description: "Discover premium lighting solutions for your home and business.",
    images: [`${baseUrl}/og-image.jpg`],
  },
};

export default function Home() {
  return <HomeClient />;
}
