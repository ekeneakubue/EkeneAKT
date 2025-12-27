"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying payment...");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get("reference");
      const orderIdParam = searchParams.get("orderId");

      if (orderIdParam) {
        setOrderId(orderIdParam);
      }

      if (!reference) {
        setStatus("error");
        setMessage("Payment reference not found");
        return;
      }

      try {
        const response = await fetch(`/api/payments/verify?reference=${reference}`);

        if (!response.ok) {
          throw new Error("Payment verification failed");
        }

        const data = await response.json();

        if (data.success) {
          setStatus("success");
          setMessage("Payment verified successfully!");
          
          // Redirect to success page after 2 seconds
          setTimeout(() => {
            router.push(`/payment/success?orderId=${data.orderId}&reference=${reference}`);
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.message || "Payment verification failed");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("error");
        setMessage("An error occurred while verifying your payment");
      }
    };

    verifyPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center border-2 border-blue-200">
          {status === "loading" && (
            <>
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Loader2 size={40} className="text-white animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Verifying Payment</h1>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="bg-gradient-to-br from-green-400 to-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <CheckCircle size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Verified!</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to success page...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="bg-gradient-to-br from-red-400 to-red-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <XCircle size={40} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/cart"
                  className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-blue-900 transition"
                >
                  Back to Cart
                </Link>
                <Link
                  href="/"
                  className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition"
                >
                  Go Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

