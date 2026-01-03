import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";

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
    console.log("Starting users fetch...");

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

      // Return empty array instead of error so UI can still render
      if (connectionError.code === "P1001" || connectionError.message?.includes("Can't reach database server") || connectionError.message?.includes("connection")) {
        console.warn("Database connection failed, returning empty users array");
        return NextResponse.json(
          [],
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Database connection failed: ${connectionError?.message || String(connectionError)}`);
    }

    console.log("Fetching users from database...");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Successfully fetched ${users.length} users`);
    return NextResponse.json(users, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    console.error("Error details:", {
      name: error.name,
      code: error.code,
      message: error.message,
      stack: error.stack,
    });

    // Handle Prisma Client initialization errors
    if (error.message?.includes("PrismaClient") || error.message?.includes("DATABASE_URL")) {
      return NextResponse.json(
        {
          error: "Database configuration error. Please ensure DATABASE_URL is set in your .env file.",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle database connection errors (P1001)
    if (error.code === "P1001" || error.message?.includes("Can't reach database server") || error.message?.includes("connection")) {
      // Return empty array instead of error so UI can still render
      console.warn("Database connection failed, returning empty users array");
      return NextResponse.json(
        [],
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle Prisma errors
    if (error.code === "P2025" || error.message?.includes("Record to find does not exist")) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle table not found errors (when database table name doesn't match)
    // P2021 = Table does not exist
    // Common PostgreSQL error: relation "users" does not exist
    if (
      error.code === "P2021" ||
      error.message?.includes("does not exist") ||
      error.message?.includes("Unknown table") ||
      error.message?.includes("relation") && error.message?.includes("does not exist") ||
      error.message?.includes("Table") && error.message?.includes("doesn't exist")
    ) {
      return NextResponse.json(
        {
          error: "Database schema mismatch. The 'users' table does not exist. Please run: npx prisma db push",
          details: process.env.NODE_ENV === "development" ? {
            message: error.message,
            code: error.code,
            hint: "The database table is still named 'admins' but the schema expects 'users'. Run 'npx prisma db push' to sync the schema."
          } : undefined
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: process.env.NODE_ENV === "development" ? {
          message: error.message,
          code: error.code,
          name: error.name
        } : undefined
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
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
      console.log("Received user data:", body);
    } catch (jsonError: any) {
      console.error("Error parsing request body:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const { name, email, password, avatar, role } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare data object - only include avatar if it's provided and not empty
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData: any = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || "admin",
    };

    // Only add avatar if it exists and is a valid string
    if (avatar && typeof avatar === "string" && avatar.trim().length > 0) {
      userData.avatar = avatar.trim();
    }

    // Create new user
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user, {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    console.error("Error details:", {
      name: error.name,
      code: error.code,
      message: error.message,
      stack: error.stack,
      meta: error.meta,
    });

    // Handle Prisma Client initialization errors
    if (error.message?.includes("PrismaClient") || error.message?.includes("DATABASE_URL")) {
      return NextResponse.json(
        {
          error: "Database configuration error. Please ensure DATABASE_URL is set in your .env file.",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle Prisma unique constraint error
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "User with this email already exists" },
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

    // Handle unknown field errors (like if avatar field doesn't exist in DB)
    if (error.message?.includes("Unknown argument") || error.message?.includes("Unknown field")) {
      return NextResponse.json(
        {
          error: "Database schema mismatch. Please run: npx prisma generate && npx prisma migrate dev",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create user",
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

