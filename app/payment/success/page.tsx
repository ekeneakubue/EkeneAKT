"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ShoppingBag, ArrowLeft, Home } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    const orderIdParam = searchParams.get("orderId");
    const referenceParam = searchParams.get("reference");

    if (orderIdParam) setOrderId(orderIdParam);
    if (referenceParam) setReference(referenceParam);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center border-2 border-green-200">
          {/* Success Icon */}
          <div className="bg-gradient-to-br from-green-400 to-green-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <CheckCircle size={48} className="text-white" />
          </div>

          {/* Success Message */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>

          {/* Order Details */}
          {orderId && (
            <div className="bg-gradient-to-br from-blue-50 to-amber-50 rounded-xl p-6 mb-8 border-2 border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-4">
                <ShoppingBag size={24} className="text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              </div>
              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-gray-700 font-semibold">Order ID:</span>
                  <span className="text-gray-900 font-mono text-sm">{orderId}</span>
                </div>
                {reference && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-semibold">Reference:</span>
                    <span className="text-gray-900 font-mono text-sm">{reference}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Message */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-800">
              You will receive an email confirmation shortly with your order details and tracking information.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-4 rounded-xl font-bold hover:from-amber-500 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform inline-flex items-center justify-center gap-2"
            >
              <ShoppingBag size={20} />
              Continue Shopping
            </Link>
            <Link
              href="/"
              className="border-2 border-blue-600 text-blue-700 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition inline-flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

