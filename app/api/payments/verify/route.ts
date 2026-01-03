import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
  const { prisma } = await import("../../../../lib/prisma");
  return prisma;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const reference = url.searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json();
      console.error("Paystack verification error:", errorData);
      return NextResponse.json(
        { error: "Payment verification failed", details: errorData },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || !verifyData.data) {
      return NextResponse.json(
        { error: "Invalid payment response" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const paymentData = verifyData.data;
    const orderId = paymentData.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID not found in payment metadata" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update order status based on payment status
    let prisma;
    try {
      prisma = await getPrisma();
    } catch (prismaError) {
      console.error("Error initializing Prisma client:", prismaError);
      return NextResponse.json(
        {
          error: "Database connection failed",
          message: prismaError instanceof Error ? prismaError.message : "Unknown Prisma error",
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if payment was successful
    if (paymentData.status === "success") {
      // Update order status to processing
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "processing" },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Payment verified successfully",
          orderId: orderId,
          reference: reference,
        },
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Payment failed or pending
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "cancelled" },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Payment not successful",
          status: paymentData.status,
        },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to verify payment",
        message: errorMessage,
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


