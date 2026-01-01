import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
  const { prisma } = await import("../../../lib/prisma");
  return prisma;
}

export async function GET() {
  try {
    const prisma = await getPrisma();

    const categories = await prisma.category.findMany({
      include: {
        subCategories: {
          include: {
            products: true,
          },
        },
        products: true,
      },
      orderBy: [
        { displayOrder: "asc" },
        { name: "asc" }
      ],
    });

    // Transform categories to match the expected format
    const transformedCategories = categories.map((category: any) => ({
      id: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
      name: category.name.toUpperCase(),
      count: category.products.length,
      subcategories: category.subCategories.map((sub: any) => ({
        id: sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-'),
        name: sub.name,
        count: sub.products.length,
      })),
    }));

    return NextResponse.json(transformedCategories, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
