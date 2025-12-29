import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
  const { prisma } = await import("../../../../lib/prisma");
  return prisma;
}

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export async function GET() {
  try {
    const prisma = await getPrisma();
    const categories = await prisma.category.findMany({
      include: {
        subCategories: true,
        products: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform categories to include product count and subcategory names
    const transformedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      productCount: category.products.length,
      subCategories: category.subCategories.map((sub: { name: string }) => sub.name),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    return NextResponse.json(transformedCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const prisma = await getPrisma();

    if (!prisma) {
      throw new Error("Prisma client not initialized");
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError: any) {
      console.error("Error parsing request body:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { name, slug, description, subCategories } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if category with this name already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name: name.trim() },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate slug if not provided
    const categorySlug = slug?.trim() || generateSlug(name.trim());

    // Check if category with this slug already exists (if slug is provided)
    if (slug?.trim()) {
      const existingSlug = await prisma.category.findUnique({
        where: { slug: categorySlug },
      });

      if (existingSlug) {
        return NextResponse.json(
          { error: "A category with this slug already exists" },
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Create category with subcategories
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: categorySlug,
        description: description?.trim() || null,
        subCategories: {
          create: (subCategories || []).map((subName: string) => ({
            name: subName.trim(),
            slug: generateSlug(subName.trim()),
          })),
        },
      },
      include: {
        subCategories: true,
        products: true,
      },
    });

    // Transform response
    const transformedCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      productCount: category.products.length,
      subCategories: category.subCategories.map((sub: { name: string }) => sub.name),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    return NextResponse.json(transformedCategory, {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error creating category:", error);

    // Handle Prisma unique constraint error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name or slug already exists" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create category",
        details: process.env.NODE_ENV === "development" ? {
          message: error.message,
          code: error.code,
        } : undefined
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

