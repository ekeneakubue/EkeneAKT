"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { ShoppingCart, Plus, Minus, X, Trash2, ArrowLeft, Lightbulb, Zap, Loader2, MapPin, Phone, Mail, Facebook, Instagram, Linkedin, MessageCircle, ShieldCheck } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import Footer from "../../components/Footer";

// Helper function to format numbers with commas
const formatPrice = (amount: number): string => {
  if (isNaN(amount)) return "0.00";
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

export default function CartPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart, getTotalItems, getTotalPrice, getTaxAmount } = useCart();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [productImages, setProductImages] = useState<Record<string, string>>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const router = useRouter();

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      setToastMessage("Please enter a valid email address");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setIsSubmittingNewsletter(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      if (res.ok) {
        setToastMessage("Successfully subscribed! Check your email.");
        setNewsletterEmail("");
      } else {
        const data = await res.json();
        setToastMessage(data.error || "Subscription failed. Please try again.");
      }
    } catch (error) {
      setToastMessage("Network error. Please try again.");
    } finally {
      setIsSubmittingNewsletter(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Fetch product images for items that don't have them
  useEffect(() => {
    const fetchMissingImages = async () => {
      const itemsNeedingImages = cart.filter(item => !item.image);
      if (itemsNeedingImages.length === 0) return;

      const imagePromises = itemsNeedingImages.map(async (item) => {
        try {
          const res = await fetch(`/api/products/${item.id}`, {
            headers: { Accept: "application/json" },
          });
          if (res.ok) {
            const product = await res.json();
            if (product.image) {
              return { id: item.id, image: product.image };
            }
          }
        } catch (error) {
          console.error(`Error fetching image for product ${item.id}:`, error);
        }
        return null;
      });

      const results = await Promise.all(imagePromises);
      const imagesMap: Record<string, string> = {};
      results.forEach((result) => {
        if (result) {
          imagesMap[result.id] = result.image;
        }
      });

      if (Object.keys(imagesMap).length > 0) {
        setProductImages((prev) => ({ ...prev, ...imagesMap }));
      }
    };

    if (cart.length > 0) {
      fetchMissingImages();
    }
  }, [cart]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render cart if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const subtotal = getTotalPrice();
  const tax = getTaxAmount(); // Tax based on profit
  const total = subtotal + tax;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setPaymentError("Your cart is empty");
      return;
    }

    if (!user?.email) {
      setPaymentError("Please sign in to proceed with checkout");
      router.push("/signin");
      return;
    }

    // Validate shipping information
    if (!shippingAddress.trim()) {
      setPaymentError("Please enter your shipping address");
      return;
    }

    if (!contactNumber.trim()) {
      setPaymentError("Please enter your contact number");
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      const subtotal = getTotalPrice();
      const tax = getTaxAmount();
      const total = subtotal + tax;

      // Initialize payment
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: total,
          email: user.email,
          customerName: user.name,
          shippingAddress: shippingAddress.trim(),
          contactNumber: contactNumber.trim(),
          subtotal: subtotal,
          tax: tax,
          cartItems: cart.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price + item.profit,
            minQuantity: item.minQuantity,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Failed to initialize payment");
      }

      const paymentData = await response.json();

      if (!paymentData.authorization_url || !paymentData.publicKey) {
        throw new Error("Invalid payment response");
      }

      // Wait a bit for Paystack script to be fully ready
      if (typeof window !== "undefined" && window.PaystackPop && typeof window.PaystackPop.setup === "function") {
        // Define callback function before setup - must be a regular function, not arrow function
        function paymentCallback(response: { reference: string }) {
          // Handle payment verification asynchronously
          (async () => {
            try {
              setIsProcessingPayment(true);

              // Verify payment
              const verifyResponse = await fetch(
                `/api/payments/verify?reference=${response.reference}`
              );

              if (!verifyResponse.ok) {
                throw new Error("Payment verification failed");
              }

              const verifyData = await verifyResponse.json();

              if (verifyData.success) {
                // Clear cart and redirect to success page
                clearCart();
                setIsProcessingPayment(false);
                router.push(`/payment/success?orderId=${verifyData.orderId}&reference=${response.reference}`);
              } else {
                setPaymentError(verifyData.message || "Payment verification failed");
                setIsProcessingPayment(false);
              }
            } catch (error) {
              console.error("Payment verification error:", error);
              setPaymentError("Payment verification failed. Please contact support.");
              setIsProcessingPayment(false);
            }
          })();
        }

        function paymentOnClose() {
          setIsProcessingPayment(false);
          setPaymentError("Payment was cancelled");
        }

        try {
          const handler = window.PaystackPop.setup({
            key: paymentData.publicKey,
            email: user.email,
            amount: Math.round(total * 100), // Convert to kobo
            ref: paymentData.reference,
            onClose: paymentOnClose,
            callback: paymentCallback,
          });

          if (handler && typeof handler.openIframe === "function") {
            handler.openIframe();
          } else {
            throw new Error("Failed to initialize Paystack handler");
          }
        } catch (paystackError) {
          console.error("Paystack setup error:", paystackError);
          // Fallback to redirect
          window.location.href = paymentData.authorization_url;
        }
      } else {
        // Fallback: redirect to Paystack payment page if script not loaded
        console.warn("Paystack script not loaded, redirecting to payment page");
        window.location.href = paymentData.authorization_url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setPaymentError(error instanceof Error ? error.message : "An error occurred during checkout");
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-x-hidden w-full">
      {/* Load Paystack Script */}
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="lazyOnload"
        onLoad={() => setPaystackLoaded(true)}
        onError={() => {
          setPaymentError("Failed to load payment service. Please refresh the page.");
        }}
      />
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-lg">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-2.5">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 hover:text-amber-300 transition text-sm w-fit">
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        <nav className="container mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 md:gap-3">
              <div className="bg-amber-500 p-1 md:p-1.5 rounded-full">
                <img src="/images/logo.jpg" alt="logo" className="w-10 h-10 md:w-16 md:h-16 rounded-full" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">AKT</h1>
                <p className="text-[10px] md:text-xs font-semibold text-amber-600 tracking-wider">LIGHTING</p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/cart" className="relative p-2 hover:bg-amber-50 rounded-lg transition group">
                <ShoppingCart size={24} className="text-gray-700 group-hover:text-amber-600 transition" />
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold shadow-lg px-1">
                  {getTotalItems()}
                </span>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Page Header */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-8 md:py-10 lg:py-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-xl">
              <ShoppingCart size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-bold">Shopping Cart</h1>
              <p className="text-xl text-blue-200 mt-2">
                {cart.length === 0
                  ? "Your cart is empty"
                  : `${getTotalItems()} ${getTotalItems() === 1 ? 'carton' : 'cartons'} in your cart`
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {cart.length === 0 ? (
          /* Empty Cart State */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-16 text-center border-2 border-blue-100">
              <div className="bg-gradient-to-br from-blue-100 to-amber-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart size={64} className="text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Looks like you haven't added any items to your cart yet.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-4 rounded-xl font-bold hover:from-amber-500 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform inline-block"
                >
                  Browse Products
                </Link>
                <Link
                  href="/"
                  className="border-2 border-blue-600 text-blue-700 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition inline-block"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 w-full max-w-full">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Cart Header */}
              <div className="bg-white rounded-2xl shadow-lg p-4 border-2 border-blue-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Cart Items</h2>
                {cart.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-red-600 hover:text-red-700 font-semibold text-sm flex items-center gap-2 transition"
                  >
                    <Trash2 size={18} />
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-4">
                {cart.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-100 hover:border-amber-300 transition-all duration-300"
                  >
                    <div className="flex gap-2 md:gap-4">
                      {/* Product Image */}
                      <div className="relative bg-gradient-to-br from-blue-50 via-slate-50 to-amber-50 rounded-xl w-20 h-20 md:w-32 md:h-32 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-gray-200">
                        {(item.image || productImages[item.id]) ? (
                          <Image
                            src={item.image || productImages[item.id] || ''}
                            alt={item.name}
                            fill
                            className="object-contain p-2"
                            unoptimized
                          />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-amber-400/10"></div>
                            <Lightbulb
                              size={40}
                              className="text-blue-400 relative z-10 md:w-16 md:h-16"
                              strokeWidth={1.5}
                            />
                          </>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm md:text-xl font-bold text-gray-900 mb-0.5 line-clamp-2 h-10 md:h-auto leading-tight">{item.name}</h3>
                          <p className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                            ₦{formatPrice(item.price * 1.075 + item.profit)}
                          </p>
                          <p className="text-[10px] md:text-xs text-gray-600">per unit ({item.minQuantity} pcs)</p>
                          <p className="text-xs md:text-sm text-gray-600 mt-0.5 font-semibold">
                            ₦{formatPrice((item.price * 1.075 + item.profit) * item.minQuantity * item.quantity)} total
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between gap-2 mt-1 md:mt-0">
                          <div className="flex items-center gap-1 md:gap-2 bg-blue-50 rounded-xl p-0.5 border-2 border-blue-200">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="p-2 md:p-2 hover:bg-blue-100 rounded-lg transition text-blue-700 hover:text-blue-900 touch-manipulation"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <div className="w-8 md:w-16 text-center">
                              <span className="font-bold text-gray-900 text-sm md:text-lg block">
                                {item.quantity}
                              </span>
                              <span className="text-[10px] md:text-xs text-gray-600">
                                {item.quantity === 1 ? 'carton' : 'cartons'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="p-2 md:p-2 hover:bg-blue-100 rounded-lg transition text-blue-700 hover:text-blue-900 touch-manipulation"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition border-2 border-red-200 hover:border-red-300 md:ml-2 touch-manipulation"
                            aria-label="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping */}
              <Link
                href="/products"
                className="flex items-center justify-center gap-2 bg-white rounded-2xl shadow-lg p-4 border-2 border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition"
              >
                <ArrowLeft size={20} />
                Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <div className="bg-white rounded-2xl shadow-xl p-5 md:p-6 border-2 border-blue-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Zap size={24} className="text-amber-600" />
                    Order Summary
                  </h2>

                  {/* Shipping Information */}
                  <div className="space-y-4 mb-6 pb-6 border-b-2 border-blue-200">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <MapPin size={16} className="text-blue-600" />
                        Shipping Address
                      </label>
                      <textarea
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Enter your complete shipping address"
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition resize-none text-base"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Phone size={16} className="text-blue-600" />
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="Enter your phone number"
                        className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition text-base"
                        required
                      />
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span className="font-semibold">₦{formatPrice(total)}</span>
                    </div>

                    <div className="border-t-2 border-blue-200 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                          ₦{formatPrice(total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Error Message */}
                  {paymentError && (
                    <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm font-semibold">{paymentError}</p>
                      <button
                        onClick={() => setPaymentError(null)}
                        className="text-red-600 hover:text-red-800 text-xs mt-1 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Checkout Button */}
                  <button
                    onClick={handleCheckout}
                    disabled={isProcessingPayment || cart.length === 0}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-4 rounded-xl font-bold hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 transform mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>Proceed to Checkout</span>
                    )}
                  </button>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 pt-4 border-t border-gray-200">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>Secure Checkout</span>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="bg-gradient-to-br from-blue-50 to-amber-50 rounded-2xl shadow-lg p-5 md:p-6 mt-4 border-2 border-blue-200">
                  <h3 className="font-bold text-gray-900 mb-3">Have a promo code?</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="w-full sm:flex-1 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition text-base"
                    />
                    <button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-900 transition shadow-md active:scale-95">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Spacer for Sticky Bar */}
      {cart.length > 0 && <div className="h-24 lg:hidden"></div>}

      {/* Sticky Bottom Checkout Bar for Mobile */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 md:p-4 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)] z-40 lg:hidden safe-area-bottom">
          <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total</span>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                ₦{formatPrice(total)}
              </span>
            </div>
            <button
              onClick={() => {
                // Scroll to order summary if on mobile, or handle checkout if data is ready
                const summaryElement = document.querySelector('.lg\\:col-span-1');
                if (summaryElement && (!shippingAddress || !contactNumber)) {
                  summaryElement.scrollIntoView({ behavior: 'smooth' });
                  // Flash the inputs to draw attention?
                } else {
                  handleCheckout();
                }
              }}
              disabled={isProcessingPayment}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-600 hover:to-amber-700 transition shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              {isProcessingPayment ? <Loader2 size={20} className="animate-spin" /> : 'Checkout'}
            </button>
          </div>
        </div>
      )}

      {/* Clear Cart Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full border-2 border-red-200">
            <div className="text-center mb-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Clear Cart?</h3>
              <p className="text-gray-600">
                Are you sure you want to remove all items from your cart? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCart}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition shadow-lg"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Newsletter */}
      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-white to-blue-50/50 rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-10 lg:p-12 text-center border-2 border-amber-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-20"></div>

            <div className="relative z-10">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-amber-500/40">
                <Mail size={28} className="text-white md:w-9 md:h-9" />
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
                Get <span className="bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">15% Off</span> Your First Order!
              </h2>
              <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8">
                Subscribe to our newsletter for exclusive deals and lighting inspiration.
              </p>
              <form onSubmit={handleNewsletterSubscribe} className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-2xl mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  disabled={isSubmittingNewsletter}
                  className="flex-1 px-5 md:px-6 py-3 md:py-4 border-2 border-blue-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition shadow-sm text-sm disabled:opacity-50"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmittingNewsletter}
                  className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 md:px-10 py-3 md:py-4 rounded-lg md:rounded-xl font-bold hover:from-amber-500 hover:to-amber-600 transition-all duration-300 whitespace-nowrap shadow-xl hover:shadow-2xl hover:scale-105 transform text-sm md:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmittingNewsletter ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Subscribing...</span>
                    </>
                  ) : (
                    <span>Subscribe Now</span>
                  )}
                </button>
              </form>
              <p className="text-xs md:text-sm text-gray-500 mt-4 md:mt-6">
                We respect your privacy. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/2348032744865"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center group"
        aria-label="Chat with us on WhatsApp"
      >
        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40"></div>
        <div className="relative bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white p-2 md:p-3 rounded-full shadow-2xl hover:scale-110 hover:rotate-12 transition-all duration-300 flex items-center justify-center border-4 border-white z-10">
          <MessageCircle size={20} strokeWidth={3.5} className="drop-shadow-lg" />
        </div>
        <span className="absolute right-full mr-4 bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border-2 border-green-100 mb-2">
          Chat with us!
        </span>
      </a>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md border-2 border-blue-400">
            <div className="bg-white/20 rounded-full p-1.5">
              <ShoppingCart size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold">{toastMessage}</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-white hover:text-blue-100 transition p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

