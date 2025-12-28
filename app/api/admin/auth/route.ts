import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
    const { prisma } = await import("../../../../lib/prisma");
    return prisma;
}

// Lazy load bcryptjs - use require at runtime to avoid Turbopack bundling issues
function getBcrypt() {
    // Use require() which is resolved at runtime, not at build time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("bcryptjs");
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const prisma = await getPrisma();

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email: email.trim().toLowerCase() },
        });

        if (!user) {
            console.log("Admin Auth Failed: User not found for email:", email);
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Verify password using bcryptjs
        const bcrypt = getBcrypt();
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            console.log("Admin Auth Failed: Invalid password for user:", email);
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Return user data (without password)
        const { password: _, ...userData } = user;

        return NextResponse.json({
            user: userData,
            message: "Admin signed in successfully",
        });

    } catch (error) {
        console.error("Error in admin auth:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        return NextResponse.json(
            {
                error: "An error occurred during authentication",
                message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
            },
            { status: 500 }
        );
    }
}
