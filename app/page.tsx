import { Metadata } from "next";
import HomeClient from "./HomeClient";

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
    description: "Discover premium lighting solutions for your home and business.",
    images: ["/og-image.jpg"],
  },
};

export default function Home() {
  return <HomeClient />;
}
