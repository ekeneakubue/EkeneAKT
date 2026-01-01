import { Metadata } from "next";
import ProductListingClient from "./ProductListingClient";

export const metadata: Metadata = {
  title: "Shop All Products - AKT Lighting",
  description: "Browse our extensive collection of premium lighting solutions. From chandeliers to LED fixtures, find the perfect light for your space.",
  openGraph: {
    title: "Shop All Products - AKT Lighting",
    description: "Browse our extensive collection of premium lighting solutions. Find the perfect light for your space.",
    url: "https://ekeneakt.com/products",
    siteName: "AKT Lighting",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AKT Lighting Products Collection",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop All Products - AKT Lighting",
    description: "Browse our extensive collection of premium lighting solutions.",
    images: ["/og-image.jpg"],
  },
};

export default function ProductsPage() {
  return <ProductListingClient />;
}
