import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json(
                { error: "Invalid email address" },
                { status: 400 }
            );
        }

        if (!process.env.RESEND_API_KEY) {
            console.error("CRITICAL: RESEND_API_KEY is not defined in environment variables.");
            return NextResponse.json(
                { error: "Newsletter service is not configured. Please add RESEND_API_KEY to .env" },
                { status: 500 }
            );
        }

        // 1. Send Welcome Email to Subscriber
        // Note: In Resend trial mode, 'to' must be your verified email address or account email
        const { data: welcomeData, error: welcomeError } = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: email,
            subject: "Welcome to EKENE-AKT Lighting Newsletter!",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h1 style="color: #1e40af;">Welcome to EKENE-AKT!</h1>
          <p>Thank you for subscribing to our newsletter. You'll now be the first to know about our latest lighting collections, exclusive deals, and interior design inspiration.</p>
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #92400e;">Your Exclusive Reward:</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #b45309;">15% OFF</p>
            <p style="margin: 5px 0 0 0;">Use code: <strong>WELCOME15</strong> at checkout</p>
          </div>
          <p>If you have any questions, feel free to reply to this email or chat with us on WhatsApp.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; 2025 EKENE-AKT Lighting. All rights reserved.</p>
        </div>
      `,
        });

        if (welcomeError) {
            console.warn("Resend Welcome Email Warning:", welcomeError);
            // In trial mode, this fails for non-verified emails. 
            // We don't want to stop the whole process, so we just log it.
        }

        // 2. Notify Admin
        const { data: adminData, error: adminError } = await resend.emails.send({
            from: "onboarding@resend.dev",
            to: "ekeneaktonline@gmail.com",
            subject: "New Newsletter Subscriber!",
            html: `
        <div style="font-family: sans-serif;">
          <h2>New Subscription Alert</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
        });

        if (adminError) {
            console.error("Resend Admin Error:", adminError);
        }

        return NextResponse.json({ success: true, message: "Subscription successful" });
    } catch (error: any) {
        console.error("Newsletter API Error Detailed:", {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error.message,
                hint: "Check if RESEND_API_KEY is set in .env"
            },
            { status: 500 }
        );
    }
}
