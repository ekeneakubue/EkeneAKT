import { NextResponse } from "next/server";

// Ensure this route always returns JSON
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
  try {
    console.log("Importing Prisma client...");
    const { prisma } = await import("../../../../lib/prisma");
    console.log("Prisma client imported successfully");

    if (!prisma) {
      console.error("Prisma client is undefined after import");
      throw new Error("Prisma client is undefined");
    }

    return prisma;
  } catch (importError: any) {
    console.error("Error importing Prisma:", {
      message: importError?.message,
      name: importError?.name,
      code: importError?.code,
      stack: importError?.stack,
    });
    throw new Error(`Failed to import Prisma client: ${importError?.message || String(importError)}`);
  }
}

export async function GET() {
  try {
    console.log("Starting dashboard data fetch...");

    const prisma = await getPrisma();

    if (!prisma) {
      throw new Error("Prisma client not initialized");
    }

    console.log("Prisma client obtained, testing connection...");

    // Test database connection first with timeout
    try {
      const connectionTest = Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout after 5 seconds")), 5000)
        )
      ]);
      await connectionTest;
      console.log("Database connection successful");
    } catch (connectionError: any) {
      console.error("Database connection failed:", {
        message: connectionError?.message,
        code: connectionError?.code,
        name: connectionError?.name,
        meta: connectionError?.meta,
      });

      // Return empty data instead of error so dashboard can still render
      if (connectionError.code === "P1001" || connectionError.message?.includes("Can't reach database server") || connectionError.message?.includes("connection") || connectionError.message?.includes("timeout")) {
        console.warn("Database connection failed, returning empty dashboard data");
        return NextResponse.json(
          {
            totalProducts: 0,
            totalOrders: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            pendingOrders: 0,
            processingOrders: 0,
            shippedOrders: 0,
            deliveredOrders: 0,
            recentOrders: [],
            lowStockProducts: [],
            _error: process.env.NODE_ENV === "development" ? {
              message: connectionError.message,
              code: connectionError.code,
              hint: "If using Neon, the database might be paused. Try accessing it in the Neon dashboard to wake it up."
            } : undefined
          },
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Database connection failed: ${connectionError?.message || String(connectionError)}`);
    }

    // Get all stats in parallel with error handling
    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      orders,
      products,
    ] = await Promise.all([
      prisma.product.count().catch((err) => {
        console.error("Error counting products:", err);
        return 0;
      }),
      prisma.order.count().catch((err) => {
        console.error("Error counting orders:", err);
        return 0;
      }),
      prisma.customer.count().catch((err) => {
        console.error("Error counting customers:", err);
        return 0;
      }),
      prisma.order.findMany({
        include: {
          customer: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }).catch((err) => {
        console.error("Error fetching orders:", err);
        return [];
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { stockCount: { lte: 10 } },
            { inStock: false },
          ],
        },
        take: 10,
      }).catch((err) => {
        console.error("Error fetching low stock products:", err);
        return [];
      }),
    ]);

    // Calculate revenue with error handling
    const totalRevenue = await prisma.order.aggregate({
      _sum: {
        total: true,
        tax: true,
      },
    }).catch((err) => {
      console.error("Error aggregating revenue:", err);
      return { _sum: { total: 0, tax: 0 } };
    });

    // Calculate total profit based on tax (Tax = 7.5% of Profit => Profit = Tax / 0.075)
    // Avoid division by zero
    const totalTax = totalRevenue._sum.tax || 0;
    const totalProfit = totalTax / 0.075;

    // Count orders by status with error handling
    const pendingOrders = await prisma.order.count({
      where: { status: "pending" },
    }).catch((err) => {
      console.error("Error counting pending orders:", err);
      return 0;
    });
    const processingOrders = await prisma.order.count({
      where: { status: "processing" },
    }).catch((err) => {
      console.error("Error counting processing orders:", err);
      return 0;
    });
    const shippedOrders = await prisma.order.count({
      where: { status: "shipped" },
    }).catch((err) => {
      console.error("Error counting shipped orders:", err);
      return 0;
    });
    const deliveredOrders = await prisma.order.count({
      where: { status: "delivered" },
    }).catch((err) => {
      console.error("Error counting delivered orders:", err);
      return 0;
    });

    const dashboardData = {
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue: totalRevenue._sum.total || 0,
      totalProfit: totalProfit,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      recentOrders: orders,
      lowStockProducts: products,
    };

    console.log("Dashboard data fetched successfully:", {
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue: dashboardData.totalRevenue,
    });

    return NextResponse.json(dashboardData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    // Ensure we always return JSON, even if error handling fails
    try {
      console.error("Error fetching dashboard data:", error);

      // Extract error information safely
      const errorMessage = error?.message || String(error) || "Unknown error";
      const errorCode = error?.code || "UNKNOWN";
      const errorName = error?.name || "Error";

      console.error("Error details:", {
        name: errorName,
        code: errorCode,
        message: errorMessage,
        stack: error?.stack,
        meta: error?.meta,
      });

      // Handle Prisma Client initialization errors and import errors
      if (
        error.message?.includes("PrismaClient") ||
        error.message?.includes("DATABASE_URL") ||
        error.message?.includes("Failed to import Prisma")
      ) {
        // Return empty data instead of error so dashboard can still render
        console.warn("Prisma client initialization/import failed, returning empty dashboard data");
        return NextResponse.json(
          {
            totalProducts: 0,
            totalOrders: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            pendingOrders: 0,
            processingOrders: 0,
            shippedOrders: 0,
            deliveredOrders: 0,
            recentOrders: [],
            lowStockProducts: [],
            _error: process.env.NODE_ENV === "development" ? {
              message: error.message,
              code: error.code,
              hint: "Please ensure DATABASE_URL is set in your .env file and the database is accessible."
            } : undefined
          },
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      // Handle database connection errors (P1001)
      if (error.code === "P1001" || error.message?.includes("Can't reach database server") || error.message?.includes("connection") || error.message?.includes("timeout")) {
        // Return empty data instead of error so dashboard can still render
        console.warn("Database connection failed, returning empty dashboard data");
        return NextResponse.json(
          {
            totalProducts: 0,
            totalOrders: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            pendingOrders: 0,
            processingOrders: 0,
            shippedOrders: 0,
            deliveredOrders: 0,
            recentOrders: [],
            lowStockProducts: [],
            _error: process.env.NODE_ENV === "development" ? {
              message: error.message,
              code: error.code,
              hint: "If using Neon, the database might be paused. Try accessing it in the Neon dashboard to wake it up."
            } : undefined
          },
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to fetch dashboard data",
          message: errorMessage,
          code: errorCode,
          details: process.env.NODE_ENV === "development" ? {
            message: errorMessage,
            code: errorCode,
            name: errorName,
            stack: error?.stack,
          } : undefined
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    } catch (jsonError) {
      // Fallback if JSON serialization fails
      console.error("Failed to serialize error response:", jsonError);
      return new Response(
        JSON.stringify({ error: "Internal server error", message: "Failed to process error response" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
}

