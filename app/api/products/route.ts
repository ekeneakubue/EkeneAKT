import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
  const { prisma } = await import("../../../lib/prisma");
  return prisma;
}

export async function GET(request: Request) {
  try {
    let prisma;
    try {
      prisma = await getPrisma();
    } catch (prismaError: any) {
      console.error("Error initializing Prisma client:", prismaError);
      return NextResponse.json(
        {
          error: "Database connection failed",
          message: prismaError instanceof Error ? prismaError.message : "Unknown Prisma error"
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(request.url);
    const featuredParam = url.searchParams.get("featured");
    const takeParam = url.searchParams.get("take");
    const categoryParam = url.searchParams.get("category");
    const includeImageParam = url.searchParams.get("includeImage");

    const featured =
      featuredParam === null ? undefined : featuredParam === "true" || featuredParam === "1";

    const take = takeParam ? Number.parseInt(takeParam, 10) : undefined;
    // Default limit: prevents accidentally returning massive payloads (e.g. base64 images).
    const safeTake =
      take && Number.isFinite(take) ? Math.max(1, Math.min(take, 100)) : 50;

    const includeImage = includeImageParam === "true" || includeImageParam === "1";

    const products = await prisma.product.findMany({
      where: {
        ...(featured === undefined ? {} : { featured }),
        // Note: categoryParam filtering would need to be done on category relation
        // For now, we'll filter on the transformed data
      },
      orderBy: { createdAt: "desc" },
      take: safeTake,
      include: {
        category: true,
        subCategory: true,
      },
    });

    // Transform products to include category and subCategory as strings
    let transformedProducts = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      profit: product.profit,
      minQuantity: product.minQuantity,
      category: product.category?.name || product.categoryOld || null,
      subCategory: product.subCategory?.name || product.subCategoryOld || null,
      rating: product.rating,
      reviews: product.reviews,
      featured: product.featured,
      inStock: product.inStock,
      stockCount: product.stockCount,
      ...(includeImage && product.image ? { image: product.image } : {}),
    }));

    // Apply categoryParam filter after transformation
    if (categoryParam) {
      transformedProducts = transformedProducts.filter(
        (p: any) => p.category === categoryParam || p.subCategory === categoryParam
      );
    }

    return NextResponse.json(transformedProducts, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Error fetching public products:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: "Failed to fetch products",
        message: errorMessage,
        ...(process.env.NODE_ENV === "development" && { stack: errorStack })
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


