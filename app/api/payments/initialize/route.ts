import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Lazy load Prisma to avoid Turbopack compilation issues
async function getPrisma() {
  const { prisma } = await import("../../../../lib/prisma");
  return prisma;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, email, cartItems, customerName, shippingAddress, contactNumber } = body;

    // Validation
    if (!amount || !email || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: "Amount, email, and cart items are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!shippingAddress || !shippingAddress.trim()) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!contactNumber || !contactNumber.trim()) {
      return NextResponse.json(
        { error: "Contact number is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const amountInKobo = Math.round(parseFloat(amount) * 100); // Convert to kobo (Paystack uses kobo)

    if (isNaN(amountInKobo) || amountInKobo < 100) {
      return NextResponse.json(
        { error: "Amount must be at least ₦1.00" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Paystack public key from environment
    const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!paystackPublicKey) {
      console.error("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not set");
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get Paystack secret key for server-side initialization
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY is not set");
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create order in database first
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

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!customer) {
      // Create customer if doesn't exist
      // Generate a random password for the customer (they can reset it later if needed)
      const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      customer = await prisma.customer.create({
        data: {
          email: email.trim().toLowerCase(),
          name: customerName || email.split("@")[0],
          password: tempPassword, // Temporary password - customer can reset via email if needed
          phone: contactNumber.trim(),
          address: shippingAddress.trim(),
        },
      });
    } else {
      // Update customer with shipping info if provided
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          phone: contactNumber.trim(),
          address: shippingAddress.trim(),
        },
      });
    }

    // Calculate order totals
    const subtotal = parseFloat(amount);
    const tax = subtotal * 0.075; // 7.5% tax
    const shipping = 0; // Free shipping for now
    const orderTotal = subtotal + tax + shipping;

    // Create order with pending status
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        status: "pending",
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: orderTotal,
        shippingAddress: shippingAddress.trim(),
        orderItems: {
          create: cartItems.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            minQuantity: item.minQuantity,
            total: item.price * item.minQuantity * item.quantity,
          })),
        },
      },
      include: {
        orderItems: true,
      },
    });

    // Initialize Paystack payment
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        amount: amountInKobo,
        reference: `ORDER_${order.id}_${Date.now()}`,
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/payment/callback?orderId=${order.id}`,
        metadata: {
          orderId: order.id,
          customerId: customer.id,
          cartItems: cartItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      }),
    });

    if (!paystackResponse.ok) {
      const errorData = await paystackResponse.json();
      console.error("Paystack initialization error:", errorData);
      
      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "cancelled" },
      });

      return NextResponse.json(
        { error: "Failed to initialize payment", details: errorData },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || !paystackData.data) {
      // Update order status to failed
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "cancelled" },
      });

      return NextResponse.json(
        { error: "Payment initialization failed" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return authorization URL and order ID
    return NextResponse.json(
      {
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
        orderId: order.id,
        publicKey: paystackPublicKey,
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error initializing payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      {
        error: "Failed to initialize payment",
        message: errorMessage,
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

