import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
  const { prisma } = await import("../../../../lib/prisma");
  return prisma;
}

// Lazy load bcryptjs - use require at runtime to avoid Turbopack bundling issues
// This works because bcryptjs is marked as serverExternalPackages in next.config.js
function getBcrypt() {
  // Use require() which is resolved at runtime, not at build time
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("bcryptjs");
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST for authentication." },
    { status: 405 }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, action } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();

    if (action === "signup") {
      // Sign up
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Name is required" },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // Check if customer already exists
      const existingCustomer = await prisma.customer.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (existingCustomer) {
        return NextResponse.json(
          { error: "Customer with this email already exists" },
          { status: 400 }
        );
      }

      // Hash password using bcryptjs
      const bcrypt = getBcrypt();
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create customer
      const customer = await prisma.customer.create({
        data: {
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          name: name.trim(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          country: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        customer,
        message: "Account created successfully",
      });
    } else {
      // Sign in
      const customer = await prisma.customer.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Verify password using bcryptjs
      const bcrypt = getBcrypt();
      const isValidPassword = await bcrypt.compare(password, customer.password);

      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Return customer data (without password)
      const { password: _, ...customerData } = customer;

      return NextResponse.json({
        customer: customerData,
        message: "Signed in successfully",
      });
    }
  } catch (error) {
    console.error("Error in customer auth:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: "An error occurred during authentication",
        message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

