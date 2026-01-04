import { NextResponse } from "next/server";


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
  const { prisma } = await import("../../../../../lib/prisma");
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

    const { name, slug, description, displayOrder, subCategories } = body;

    // Update category
    // 1. Update scalar fields
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(slug !== undefined && { slug: slug?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) || 0 }),
      },
    });

    // 2. Handle subcategories if provided
    if (subCategories !== undefined) {
      const newSubCategories = subCategories.map((s: string) => s.trim());

      // Delete subcategories not in the new list
      await prisma.subCategory.deleteMany({
        where: {
          categoryId: id,
          name: { notIn: newSubCategories }
        }
      });

      // Create new subcategories if they don't exist
      for (const subName of newSubCategories) {
        // Check if exists
        const existing = await prisma.subCategory.findFirst({
          where: {
            categoryId: id,
            name: subName
          }
        });

        if (!existing) {
          await prisma.subCategory.create({
            data: {
              name: subName,
              slug: generateSlug(subName),
              categoryId: id
            }
          });
        }
      }
    }

    // 3. Fetch final state to return
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        subCategories: true,
        products: true,
      },
    });

    // Transform response
    const cat = category as any;
    const transformedCategory = {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      displayOrder: cat.displayOrder || 0,
      productCount: cat.products?.length || 0,
      subCategories: cat.subCategories?.map((subCat: any) => subCat.name) || [],
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
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

    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot remove subcategories that are currently linked to products" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json(
      { error: "Failed to update category: " + (error.message || "Unknown error") },
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

    const cat = category as any;
    if (cat.products?.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete category because it has ${cat.products.length} product(s)` },
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

