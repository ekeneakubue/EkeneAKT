import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
  const { prisma } = await import("../../../../../lib/prisma");
  return prisma;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();
    const { shippingAddress, customerId } = body;

    if (!shippingAddress || !shippingAddress.trim()) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();

    // Check if order exists and belongs to customer
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customerId: customerId,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or access denied" },
        { status: 404 }
      );
    }

    // Only allow updating shipping address for pending or processing orders
    if (order.status !== "pending" && order.status !== "processing") {
      return NextResponse.json(
        { error: "Cannot update shipping address for orders that are already shipped or delivered" },
        { status: 400 }
      );
    }

    // Update order shipping address
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingAddress: shippingAddress.trim(),
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      order: updatedOrder,
      message: "Shipping address updated successfully",
    });
  } catch (error) {
    console.error("Error updating order shipping address:", error);
    return NextResponse.json(
      { error: "Failed to update shipping address" },
      { status: 500 }
    );
  }
}

