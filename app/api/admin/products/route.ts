import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
  const { prisma } = await import("../../../../lib/prisma");
  return prisma;
}

export async function GET() {
  try {
    let prisma;
    try {
      prisma = await getPrisma();
    } catch (prismaError) {
      console.error("Error initializing Prisma client:", prismaError);
      return NextResponse.json(
        { 
          error: "Database connection failed",
          message: prismaError instanceof Error ? prismaError.message : "Unknown Prisma error"
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const products = await prisma.product.findMany({
      include: {
        category: true,
        subCategory: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform products to include category and subCategory as strings for backward compatibility
    const transformedProducts = products.map((product) => ({
      ...product,
      category: product.category?.name || product.categoryOld || null,
      subCategory: product.subCategory?.name || product.subCategoryOld || null,
    }));

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
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

export async function POST(request: Request) {
  try {
    let prisma;
    try {
      prisma = await getPrisma();
    } catch (prismaError) {
      console.error("Error initializing Prisma client:", prismaError);
      return NextResponse.json(
        { 
          error: "Database connection failed",
          message: prismaError instanceof Error ? prismaError.message : "Unknown Prisma error"
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!prisma) {
      throw new Error("Prisma client not initialized");
    }

    let body;
    try {
      body = await request.json();
      console.log("Received product data:", body);
    } catch (jsonError: any) {
      console.error("Error parsing request body:", jsonError);
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
      stockCount
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
      // Create category if it doesn't exist
      categoryRecord = await prisma.category.create({
        data: {
          name: category.trim(),
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
      // Create subcategory if it doesn't exist
      subCategoryRecord = await prisma.subCategory.create({
        data: {
          name: subCategory.trim(),
          categoryId: categoryRecord.id,
        },
      });
    }

    // Prepare data object - only include optional fields if they have values
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
    };

    // Only add optional fields if they have values
    if (image?.trim()) {
      productData.image = image.trim();
    }

    // Handle images array
    if (images && Array.isArray(images) && images.length > 0) {
      // Filter out empty strings and validate
      const validImages = images.filter((img: string) => img && img.trim());
      if (validImages.length > 0) {
        productData.images = validImages;
      }
    }

    if (ratingNum !== undefined) {
      productData.rating = ratingNum;
    }

    if (stockCountNum !== undefined) {
      productData.stockCount = stockCountNum;
    }

    // Add socketType if provided
    if (socketType?.trim()) {
      productData.socketType = socketType.trim();
    }

    // Add availableColors if provided
    if (availableColors?.trim()) {
      productData.availableColors = availableColors.trim();
    }

    console.log("Creating product with data:", productData);

    // Create new product
    const product = await prisma.product.create({
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
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    console.error("Error details:", {
      name: error.name,
      code: error.code,
      message: error.message,
      stack: error.stack,
      meta: error.meta,
    });

    // Handle Prisma unique constraint error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Product with this name already exists" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle Prisma validation errors
    if (error.code === "P2003" || error.code === "P2011") {
      return NextResponse.json(
        { error: "Invalid data provided", details: error.meta },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create product",
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

