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
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();

    if (!prisma) {
      throw new Error("Prisma client not initialized");
    }

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

    const {
      name,
      description,
      price,
      minQuantity,
      category,
      subCategory,
      image,
      images,
      socketType,
      availableColors,
      rating,
      reviews,
      featured,
      inStock,
      stockCount,
      profit,
      displayOrder
    } = body;

    // Validation
    if (!name || !price || !category || !subCategory) {
      return NextResponse.json(
        { error: "Name, price, category, and subCategory are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { error: "Price must be a valid number greater than or equal to 0" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Profit validation
    let profitNum: number | undefined = undefined;
    if (profit !== undefined && profit !== "") {
      const parsed = parseFloat(profit);
      if (!isNaN(parsed)) {
        profitNum = parsed;
      }
    }

    const minQuantityNum = minQuantity ? parseInt(minQuantity) : 1;
    if (isNaN(minQuantityNum) || minQuantityNum < 1) {
      return NextResponse.json(
        { error: "Minimum quantity must be at least 1" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse optional fields safely
    let ratingNum: number | undefined = undefined;
    if (rating && rating !== "" && rating !== "0") {
      const parsed = parseFloat(rating);
      if (!isNaN(parsed)) {
        ratingNum = parsed;
      }
    }

    let reviewsNum = 0;
    if (reviews && reviews !== "") {
      const parsed = parseInt(reviews);
      if (!isNaN(parsed)) {
        reviewsNum = parsed;
      }
    }

    let stockCountNum: number | undefined = undefined;
    if (stockCount && stockCount !== "") {
      const parsed = parseInt(stockCount);
      if (!isNaN(parsed)) {
        stockCountNum = parsed;
      }
    }

    // Validate rating if provided
    if (ratingNum !== undefined && (ratingNum < 0 || ratingNum > 5)) {
      return NextResponse.json(
        { error: "Rating must be a number between 0 and 5" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate stock count if provided
    if (stockCountNum !== undefined && stockCountNum < 0) {
      return NextResponse.json(
        { error: "Stock count must be a valid number greater than or equal to 0" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find or create Category
    let categoryRecord = await prisma.category.findUnique({
      where: { name: category.trim() },
    });

    if (!categoryRecord) {
      categoryRecord = await prisma.category.create({
        data: {
          name: category.trim(),
          slug: generateSlug(category.trim()),
        },
      });
    }

    // Find or create SubCategory
    let subCategoryRecord = await prisma.subCategory.findFirst({
      where: {
        categoryId: categoryRecord.id,
        name: subCategory.trim(),
      },
    });

    if (!subCategoryRecord) {
      subCategoryRecord = await prisma.subCategory.create({
        data: {
          name: subCategory.trim(),
          slug: generateSlug(subCategory.trim()),
          categoryId: categoryRecord.id,
        },
      });
    }

    // Prepare data object
    const productData: any = {
      name: name.trim(),
      description: description?.trim() || null,
      price: priceNum,
      minQuantity: minQuantityNum,
      categoryId: categoryRecord.id,
      subCategoryId: subCategoryRecord.id,
      featured: featured === true || featured === "true",
      inStock: inStock !== false && inStock !== "false",
      reviews: reviewsNum,
      displayOrder: parseInt(displayOrder) || 0,
    };

    if (profitNum !== undefined) {
      productData.profit = profitNum;
    }

    // Only add optional fields if they have values
    if (image?.trim()) {
      productData.image = image.trim();
    } else {
      productData.image = null;
    }

    // Handle images array
    if (images && Array.isArray(images) && images.length > 0) {
      const validImages = images.filter((img: string) => img && img.trim());
      if (validImages.length > 0) {
        productData.images = validImages;
      } else {
        productData.images = null;
      }
    } else {
      productData.images = null;
    }

    if (ratingNum !== undefined) {
      productData.rating = ratingNum;
    } else {
      productData.rating = null;
    }

    if (stockCountNum !== undefined) {
      productData.stockCount = stockCountNum;
    } else {
      productData.stockCount = null;
    }

    // Add socketType if provided
    if (socketType?.trim()) {
      productData.socketType = socketType.trim();
    } else {
      productData.socketType = null;
    }

    // Add availableColors if provided
    if (availableColors?.trim()) {
      productData.availableColors = availableColors.trim();
    } else {
      productData.availableColors = null;
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: productData,
      include: {
        category: true,
        subCategory: true,
      },
    });

    // Transform product to include category and subCategory as strings for backward compatibility
    const transformedProduct = {
      ...product,
      category: product.category?.name || null,
      subCategory: product.subCategory?.name || null,
    };

    return NextResponse.json(transformedProduct, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error updating product:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Product with this name already exists" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log full error details for debugging
    console.error("Full error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: "Failed to update product",
        message: error.message || "Unknown error occurred",
        details: process.env.NODE_ENV === "development" ? {
          message: error.message,
          code: error.code,
          meta: error.meta,
        } : undefined
      },
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

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

