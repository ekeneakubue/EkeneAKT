import { NextResponse } from "next/server";


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
  const { prisma } = await import("../../../../../lib/prisma");
  return prisma;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch (jsonError: any) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { name, slug, description } = body;

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(slug !== undefined && { slug: slug?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
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
      subCategories: category.subCategories.map((subCat: { name: string }) => subCat.name),
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    return NextResponse.json(transformedCategory);
  } catch (error: any) {
    console.error("Error updating category:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name or slug already exists" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;

    // Check if category has products
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (category.products.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete category because it has ${category.products.length} product(s)` },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

