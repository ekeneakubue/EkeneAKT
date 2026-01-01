"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingCart,
  ArrowLeft,
  Lightbulb,
  X,
  Package,
  Truck
} from "lucide-react";
import { useCart } from "../../../contexts/CartContext";
import { useAuth } from "../../../contexts/AuthContext";
import Link from "next/link";

// Helper function to format numbers with commas
const formatPrice = (amount: number): string => {
  if (isNaN(amount)) return "0.00";
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

type ProductDetails = {
  id: string;
  name: string;
  description: string | null;
  profit?: number;
  price: number;
  minQuantity: number;
  category: string;
  image: string | null;
  images: string[] | null;
  rating: number | null;
  reviews: number;
  featured: boolean;
  inStock: boolean;
  stockCount: number | null;
  createdAt: string;
  updatedAt: string;
};

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!productId) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/products/${productId}`, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Product not found");
          }
          throw new Error(`Failed to load product (${res.status})`);
        }

        const data = (await res.json()) as ProductDetails;

        // Parse images if it's a JSON string
        if (data.images && typeof data.images === 'string') {
          try {
            data.images = JSON.parse(data.images);
          } catch {
            data.images = null;
          }
        }

        if (!cancelled) {
          setProduct(data);
          const allImages = [data.image, ...(data.images || [])].filter(Boolean);
          if (allImages.length > 0) {
            setSelectedImageIndex(0);
          }
        }
      } catch (e: any) {
        console.error("Error loading product:", e);
        if (!cancelled) {
          setError(e?.message ?? "Failed to load product");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleAddToCart = () => {
    if (!product) return;

    if (!isAuthenticated) {
      setToastMessage("Please sign in to add items to cart");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      router.push("/signin");
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      profit: product.profit || 0,
      minQuantity: product.minQuantity,
      image: product.image ?? undefined,
    });

    setToastMessage(`${product.name} added to cart!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Get all available images (main image + additional images)
  const getAllImages = (): string[] => {
    if (!product) return [];
    const images: string[] = [];
    if (product.image) images.push(product.image);
    if (product.images && Array.isArray(product.images)) {
      images.push(...product.images.filter(Boolean));
    }
    return images;
  };

  const allImages = getAllImages();
  const mainImage = allImages[selectedImageIndex] || null;
  // Get up to 3 sub-images (excluding the currently selected one)
  const subImages = allImages
    .filter((_, idx) => idx !== selectedImageIndex)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-semibold text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white rounded-3xl shadow-2xl p-12 border-2 border-gray-100">
          <div className="bg-gradient-to-br from-red-100 to-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Product Not Found</h1>
          <p className="text-gray-600 mb-8 text-lg">{error || "The product you're looking for doesn't exist."}</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-4 rounded-xl font-bold hover:from-amber-500 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
          >
            <ArrowLeft size={20} />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md border-2 border-green-400">
            <div className="bg-white/20 rounded-full p-1.5">
              <ShoppingCart size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold">{toastMessage}</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-white hover:text-green-100 transition p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden aspect-square border-2 border-gray-100">
                {mainImage ? (
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-contain p-6"
                    unoptimized
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-amber-50">
                    <Lightbulb size={120} className="text-blue-400" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              {/* Sub Images (3 max) */}
              {subImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {subImages.map((img: any, idx: number) => {
                    // Find the original index in allImages
                    const originalIdx = allImages.findIndex((i) => i === img);
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(originalIdx)}
                        className="relative aspect-square bg-white rounded-xl shadow-md overflow-hidden border-2 border-gray-200 hover:border-amber-400 transition-all"
                      >
                        <Image
                          src={img}
                          alt={`${product.name} view ${idx + 1}`}
                          fill
                          className="object-contain p-3"
                          unoptimized
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Product Title */}
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight flex-1">
                  {product.name}
                </h1>
                {product.inStock ? (
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-green-500/50 whitespace-nowrap">
                    IN STOCK
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-red-500/50 whitespace-nowrap">
                    OUT OF STOCK
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                ₦{formatPrice(product.price * 1.075 + (product.profit || 0))}
                <span className="text-lg text-gray-600 font-normal ml-2">per unit</span>
              </div>

              {/* Description */}
              {product.description && (
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Shipping Terms */}
              <div className="bg-gradient-to-br from-blue-50 to-amber-50 p-6 rounded-2xl shadow-md border-2 border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                    <Truck className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Shipping Terms</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Shipping fee is based on the location & weight of the product.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Standard delivery: 1-5 business days</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Minimum order: {product.minQuantity}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4 pt-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-4 rounded-xl hover:from-amber-500 hover:to-amber-600 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={24} />
                  <span>Add to Cart</span>
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <Link
                    href="/products"
                    className="w-full bg-white border-2 border-blue-600 text-blue-700 px-6 py-4 rounded-xl hover:bg-blue-50 transition-all duration-300 font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={20} />
                    <span>Continue Shopping</span>
                  </Link>

                  <Link
                    href="/cart"
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4 rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={20} />
                    <span>View Cart</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
