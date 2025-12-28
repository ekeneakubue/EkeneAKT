import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
  const { prisma } = await import("../../../../lib/prisma");
  return prisma;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prisma = await getPrisma();

    // Try to fetch with images field, fallback to without if field doesn't exist
    let product;
    try {
      product = await prisma.product.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          profit: true,
          minQuantity: true,
          category: true,
          image: true,
          images: true,
          rating: true,
          reviews: true,
          featured: true,
          inStock: true,
          stockCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error: any) {
      // If images field doesn't exist yet, fetch without it
      if (error?.message?.includes('images') || error?.code === 'P2009') {
        product = await prisma.product.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            profit: true,
            minQuantity: true,
            category: true,
            image: true,
            rating: true,
            reviews: true,
            featured: true,
            inStock: true,
            stockCount: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        // Add null images field for compatibility
        if (product) {
          (product as any).images = null;
        }
      } else {
        throw error;
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json(product, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

