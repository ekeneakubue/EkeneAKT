import { Metadata } from "next";
import ProductDetailsClient from "./ProductDetailsClient";
import { prisma } from "../../../lib/prisma";

// Helper function to fetch product data for metadata
async function getProduct(id: string) {
  try {
    return await prisma.product.findUnique({
      where: { id },
      select: {
        name: true,
        description: true,
        image: true,
      }
    });
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
      title: "Product Not Found",
    };
  }

  const title = product.name;
  const description = product.description || `Buy ${product.name} at AKT Lighting. Premium lighting solutions.`;

  // Determine the correct image URL for social media
  let imageUrl = "/og-image.jpg";
  if (product.image) {
    if (product.image.startsWith('http')) {
      imageUrl = product.image;
    } else if (product.image.startsWith('data:') || product.image.length > 512) {
      // If it's a data URL or a very long string (likely base64), use the image proxy
      imageUrl = `/api/products/${id}/image`;
    } else {
      // Treat as a relative path
      imageUrl = product.image.startsWith('/') ? product.image : `/${product.image}`;
    }
  }

  const url = `/products/${id}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} - AKT Lighting`,
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
      title: `${title} - AKT Lighting`,
      description,
      images: [imageUrl],
    },
  };
}

export default function ProductPage() {
  return <ProductDetailsClient />;
}
