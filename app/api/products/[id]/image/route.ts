import { NextResponse } from "next/server";

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
    const { prisma } = await import("../../../../../lib/prisma");
    return prisma;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const prisma = await getPrisma();

        const product = await prisma.product.findUnique({
            where: { id },
            select: { image: true, images: true },
        });

        let imageToServe = product?.image;

        if (!imageToServe && product?.images) {
            const imgs = product.images as any;
            if (Array.isArray(imgs) && imgs.length > 0) {
                imageToServe = imgs[0];
            } else if (typeof imgs === 'string') {
                // specific handling if prisma returns string for Json type
                try {
                    const parsed = JSON.parse(imgs);
                    if (Array.isArray(parsed) && parsed.length > 0) imageToServe = parsed[0];
                } catch { }
            }
        }

        if (!imageToServe) {
            return new NextResponse("Image Not Found", { status: 404 });
        }

        // Check if it's already a URL
        if (imageToServe.startsWith('http')) {
            return NextResponse.redirect(imageToServe);
        }

        let contentType = "image/jpeg";
        let base64Data = imageToServe;

        // Handle data URL format (data:image/png;base64,...)
        if (imageToServe.startsWith("data:")) {
            const parts = imageToServe.split(",");
            if (parts.length > 1) {
                const mimeMatch = parts[0].match(/data:(.*?);/);
                if (mimeMatch) {
                    contentType = mimeMatch[1];
                }
                base64Data = parts[1];
            }
        }

        try {
            const buffer = Buffer.from(base64Data, "base64");

            // Basic validation: if buffer is too small, it might not be a valid image
            if (buffer.length < 10) {
                throw new Error("Invalid image data");
            }

            return new NextResponse(buffer, {
                headers: {
                    "Content-Type": contentType,
                    "Cache-Control": "public, max-age=86400, s-maxage=86400", // Cache for 24 hours
                },
            });
        } catch (e) {
            console.error("Error decoding base64 image:", e);
            return new NextResponse("Invalid Image Data", { status: 400 });
        }
    } catch (error) {
        console.error("Image proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
