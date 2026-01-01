import { Metadata } from "next";
import ProductDetailsClient from "./ProductDetailsClient";

// Helper function to fetch product data for metadata
async function getProduct(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ekeneakt.com";
  // We call the API internal route or fetch from DB directly. 
  // Since this is a server component, we should ideally fetch from DB directly if possible, 
  // but calling our own API is also fine if configured.
  // For simplicity and to reuse existing logic, let's use the DB directly if we can import prisma.
  try {
    const { prisma } = await import("../../../lib/prisma");
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        name: true,
        description: true,
        image: true,
      }
    });
    return product;
  } catch (error) {
    console.error("Error fetching product for metadata:", error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found - AKT Lighting",
    };
  }

  const title = `${product.name} - AKT Lighting`;
  const description = product.description || `Buy ${product.name} at AKT Lighting. Premium lighting solutions.`;
  const imageUrl = product.image || "/og-image.jpg";
  const url = `https://ekeneakt.com/products/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "AKT Lighting",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      locale: "en_US",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function ProductPage() {
  return <ProductDetailsClient />;
}
