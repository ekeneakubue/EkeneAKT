"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, Menu, Phone, Mail, MapPin, Star, Truck, Shield, Award, Zap, Home as HomeIcon, Building2, Lightbulb, Lamp, Sparkles, ChevronLeft, ChevronRight, X, LogIn, LogOut, User, Grid3x3, ShieldCheck, Facebook, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

// Helper function to format numbers with commas
const formatPrice = (amount: number | string | undefined): string => {
  if (amount === undefined) return "0";
  const num = typeof amount === "string" ? parseFloat(amount.replace("₦", "").replace(/,/g, "")) : amount;
  if (isNaN(num)) return "0";
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/\.00$/, "");
};

export default function Home() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { addToCart, getTotalItems } = useCart();
  const { isAuthenticated, user, signOut } = useAuth();

  type StoreProduct = {
    id: string;
    name: string;
    price: number;
    minQuantity: number;
    rating: number | null;
    reviews: number;
    featured: boolean;
    image?: string | null;
    profit?: number;
  };

  const [featuredProducts, setFeaturedProducts] = useState<StoreProduct[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  type Category = {
    id: string;
    name: string;
    count: number;
    subcategories: {
      id: string;
      name: string;
      count: number;
    }[];
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setFeaturedLoading(true);
        const res = await fetch("/api/products?featured=true&take=8&includeImage=true", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
        const data = (await res.json()) as StoreProduct[];
        if (!cancelled) setFeaturedProducts(data);
      } catch (e) {
        console.error("Error loading featured products:", e);
        if (!cancelled) setFeaturedProducts([]);
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCategoriesLoading(true);
        const res = await fetch("/api/categories", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);
        const data = (await res.json()) as Category[];
        if (!cancelled) setCategories(data);
      } catch (e) {
        console.error("Error loading categories:", e);
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const heroSlides = [
    {
      id: 1,
      image: "/images/hero1.webp",
      alt: "Premium Lighting Collection"
    },
    {
      id: 2,
      image: "/images/hero2.webp",
      alt: "Modern LED Solutions"
    },
    {
      id: 3,
      image: "/images/hero3.png",
      alt: "Elegant Chandeliers"
    },
    {
      id: 4,
      image: "/images/hero4.webp",
      alt: "Smart Home Lighting"
    }
  ];

  // Auto-play slider
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const handleAddToCart = (product: StoreProduct) => {
    // Check if user is authenticated
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

  const handleViewDetails = (product: StoreProduct) => {
    router.push(`/products/${product.id}`);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-lg">
        {/* Top Bar */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-2.5 px-4 md:px-8 lg:px-12">
          <div className="container mx-auto px-4 flex justify-between items-center text-sm">
            <div className="flex items-center gap-6">
              <a href="tel:+1234567890" className="flex items-center gap-2 hover:text-amber-300 transition">
                <Phone size={14} className="text-amber-400" />
                <span>+234 8032744865</span>
              </a>
              <a href="mailto:info@aktlighting.com" className="hidden md:flex items-center gap-2 hover:text-amber-300 transition">
                <Mail size={14} className="text-amber-400" />
                <span>ekeneakubue@gmail.com</span>
              </a>
            </div>
            <div className="text-xs md:text-sm flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400" />
              <span className="font-medium">We Offer Fast and Reliable Shipping!</span>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="container mx-auto px-4 md:px-8 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-amber-500 p-1 md:p-1.5 rounded-full">
                <img src="/images/logo.jpg" alt="logo" className="w-10 h-10 md:w-15 md:h-15 rounded-full" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent leading-none">EKENE-AKT</h1>
                <p className="text-[10px] md:text-xs font-semibold text-amber-600 tracking-wider">LIGHTING</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search for lighting products..."
                  className="w-full px-4 py-2.5 pr-10 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition">
                  <Search size={20} />
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden lg:flex items-center gap-6">
              <a href="/products" className="text-gray-700 hover:text-amber-600 font-semibold transition relative group">
                Products
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#categories" className="text-gray-700 hover:text-amber-600 font-semibold transition relative group">
                Categories
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#about" className="text-gray-700 hover:text-amber-600 font-semibold transition relative group">
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#contact" className="text-gray-700 hover:text-amber-600 font-semibold transition relative group">
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>

            {/* Cart & Auth & Menu */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link href="/cart" className="relative p-2 hover:bg-amber-50 rounded-lg transition group">
                  <ShoppingCart size={24} className="text-gray-700 group-hover:text-amber-600 transition" />
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold shadow-lg px-1">
                    {getTotalItems()}
                  </span>
                </Link>
              ) : (
                <Link href="/signin" className="relative p-2 hover:bg-amber-50 rounded-lg transition group" title="Sign in to access cart">
                  <ShoppingCart size={24} className="text-gray-700 group-hover:text-amber-600 transition" />
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold shadow-lg px-1">
                    {getTotalItems()}
                  </span>
                </Link>
              )}

              {isAuthenticated ? (
                <div className="hidden lg:flex items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 font-semibold transition hover:bg-blue-50 rounded-lg"
                    title="Go to Dashboard"
                  >
                    <Grid3x3 size={18} />
                    <span>Dashboard</span>
                  </Link>
                  <div
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 font-semibold hover:bg-blue-50 rounded-lg cursor-default"
                  >
                    <User size={18} />
                    <span>{user?.name}</span>
                  </div>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 font-semibold transition hover:bg-red-50 rounded-lg"
                    title="Sign out"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/signin"
                  className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </Link>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-amber-50 rounded-lg transition"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X size={24} className="text-gray-700" />
                ) : (
                  <Menu size={24} className="text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`lg:hidden mt-4 pb-4 border-t border-blue-100 overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}>
            <div className="flex flex-col gap-2 pt-4">
              <a
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-700 hover:text-amber-600 font-semibold transition py-3 px-4 rounded-lg hover:bg-amber-50 active:bg-amber-100"
              >
                Products
              </a>
              <a
                href="#categories"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-700 hover:text-amber-600 font-semibold transition py-3 px-4 rounded-lg hover:bg-amber-50 active:bg-amber-100"
              >
                Categories
              </a>
              <a
                href="#about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-700 hover:text-amber-600 font-semibold transition py-3 px-4 rounded-lg hover:bg-amber-50 active:bg-amber-100"
              >
                About
              </a>
              <a
                href="#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-700 hover:text-amber-600 font-semibold transition py-3 px-4 rounded-lg hover:bg-amber-50 active:bg-amber-100"
              >
                Contact
              </a>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 py-3 px-4 text-gray-700 hover:text-blue-600 font-semibold transition rounded-lg hover:bg-blue-50 active:bg-blue-100"
                  >
                    <User size={18} className="text-blue-600" />
                    <span>{user?.name}</span>
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 text-gray-700 hover:text-red-600 font-semibold transition py-3 px-4 rounded-lg hover:bg-red-50 active:bg-red-100 text-left"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/signin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-semibold transition py-3 px-4 rounded-lg hover:from-amber-500 hover:to-amber-600"
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-2.5 pr-10 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition">
                <Search size={20} />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 min-h-[70vh] md:h-[80vh] px-4 md:px-8 lg:px-12 overflow-hidden flex items-center">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center py-20">
            <div className="space-y-4 md:space-y-6 text-white text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight">
                Illuminate Your
                <span className="block bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                  Perfect Space
                </span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 leading-relaxed max-w-lg mx-auto md:mx-0">
                Discover premium lighting solutions that transform your home and business with elegance and efficiency.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4 pt-2 md:pt-4">
                <a href="/products" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 md:px-10 py-3.5 md:py-4 rounded-xl font-bold hover:from-amber-600 hover:to-amber-700 transition shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transform duration-300 inline-block text-sm md:text-base">
                  Shop Now
                </a>
                <a href="/products" className="border-2 border-amber-400 text-amber-300 px-8 md:px-10 py-3.5 md:py-4 rounded-xl font-bold hover:bg-amber-400/10 transition backdrop-blur-sm inline-block text-sm md:text-base">
                  View Catalog
                </a>
              </div>
              <div className="flex justify-center md:justify-start items-center gap-8 pt-4 md:pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 md:border-3 border-blue-900 shadow-lg" />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5 md:gap-1">
                      <Star size={14} className="fill-amber-400 text-amber-400 md:w-[18px] md:h-[18px]" />
                      <Star size={14} className="fill-amber-400 text-amber-400 md:w-[18px] md:h-[18px]" />
                      <Star size={14} className="fill-amber-400 text-amber-400 md:w-[18px] md:h-[18px]" />
                      <Star size={14} className="fill-amber-400 text-amber-400 md:w-[18px] md:h-[18px]" />
                      <Star size={14} className="fill-amber-400 text-amber-400 md:w-[18px] md:h-[18px]" />
                    </div>
                    <p className="text-[12px] md:text-sm text-blue-200 mt-1 font-semibold">5,000+ Happy Customers</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-[40vh] md:h-[70vh] mt-8 md:mt-0">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl transform rotate-6 opacity-20 blur-xl"></div>
              <div className="relative bg-gradient-to-br from-blue-800/40 to-blue-900/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-amber-400/20">
                <div className="aspect-square bg-gradient-to-br from-amber-50/10 to-blue-50/10 rounded-2xl relative overflow-hidden group">
                  {/* Slider Images */}
                  <div className="relative w-full h-full">
                    {heroSlides.map((slide: any, index: number) => (
                      <div
                        key={slide.id}
                        className={`absolute inset-0 transition-opacity duration-700 ${index === currentSlide ? "opacity-100" : "opacity-0"
                          }`}
                      >
                        <img
                          src={slide.image}
                          alt={slide.alt}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-blue-800 p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-blue-800 p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-10"
                    aria-label="Next slide"
                  >
                    <ChevronRight size={24} />
                  </button>

                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                    {heroSlides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`transition-all duration-300 rounded-full ${index === currentSlide
                          ? "bg-amber-500 w-8 h-3"
                          : "bg-white/60 hover:bg-white/90 w-3 h-3"
                          }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  {/* Play/Pause Button */}
                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="absolute top-4 right-4 bg-white/90 hover:bg-white text-blue-800 px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 text-sm font-bold z-10"
                  >
                    {isAutoPlaying ? "⏸" : "▶"}
                  </button>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-6 -right-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-amber-500/50 border-4 border-white z-20">
                <p className="text-3xl font-bold">15+</p>
                <p className="text-sm font-semibold">Years</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-6 md:py-10 lg:py-12 border-y-4 border-amber-400/20 px-4 md:px-8 lg:px-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 text-center md:text-left group">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl shadow-amber-500/30 group-hover:scale-110 transition duration-300">
                <Truck size={24} className="md:w-8 md:h-8 flex-shrink-0" />
              </div>
              <div>
                <p className="font-bold text-sm md:text-lg">Free Shipping</p>
                <p className="text-[10px] md:text-sm text-amber-200">Orders over ₦200</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 text-center md:text-left group">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl shadow-amber-500/30 group-hover:scale-110 transition duration-300">
                <Shield size={24} className="md:w-8 md:h-8 flex-shrink-0" />
              </div>
              <div>
                <p className="font-bold text-sm md:text-lg">2 Year Warranty</p>
                <p className="text-[10px] md:text-sm text-amber-200">On all products</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 text-center md:text-left group">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl shadow-amber-500/30 group-hover:scale-110 transition duration-300">
                <Award size={24} className="md:w-8 md:h-8 flex-shrink-0" />
              </div>
              <div>
                <p className="font-bold text-sm md:text-lg">Premium Quality</p>
                <p className="text-[10px] md:text-sm text-amber-200">Certified products</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 text-center md:text-left group">
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl shadow-amber-500/30 group-hover:scale-110 transition duration-300">
                <Phone size={24} className="md:w-8 md:h-8 flex-shrink-0" />
              </div>
              <div>
                <p className="font-bold text-sm md:text-lg">24/7 Support</p>
                <p className="text-[10px] md:text-sm text-amber-200">Expert assistance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-amber-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-3 md:mb-4 border-2 border-amber-200">
              <Sparkles size={14} className="text-amber-600 md:w-4 md:h-4" />
              <span className="text-[12px] md:text-sm font-bold text-amber-700">CATEGORIES</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4">Shop by Category</h2>
            <p className="text-lg md:text-xl text-gray-600">Find the perfect lighting for every space</p>
          </div>

          {categoriesLoading ? (
            <div className="text-center py-8 md:py-12">
              <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <p className="text-gray-600">No categories available.</p>
            </div>
          ) : (
            <div className="relative overflow-hidden -mx-4 md:mx-0">
              {/* Gradient overlays for smooth fade effect */}
              <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-r from-slate-50 via-blue-50 to-transparent z-10 pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-l from-slate-50 via-blue-50 to-transparent z-10 pointer-events-none"></div>

              {/* Marquee Container */}
              <div className="overflow-x-hidden py-4">
                <div className="flex animate-marquee space-x-4 md:space-x-6">
                  {/* First set of categories */}
                  {categories.map((category: any, index: number) => {
                    const colors = [
                      "from-blue-600 to-blue-800",
                      "from-blue-700 to-blue-900",
                      "from-amber-500 to-amber-700",
                      "from-blue-800 to-slate-900",
                      "from-purple-600 to-purple-800",
                      "from-green-600 to-green-800",
                      "from-red-600 to-red-800",
                      "from-indigo-600 to-indigo-800",
                    ];
                    const colorClass = colors[index % colors.length];

                    return (
                      <Link
                        key={`first-${category.id}`}
                        href={`/products?category=${encodeURIComponent(category.name)}`}
                        className="group relative bg-white rounded-2xl p-5 md:p-8 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-amber-400 flex-shrink-0 w-64 md:w-80"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition"></div>
                        <div className={`bg-gradient-to-br ${colorClass} text-white w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative`}>
                          <Lightbulb size={28} className="md:w-9 md:h-9" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-800 transition">{category.name.charAt(0).toUpperCase() + category.name.slice(1).toLowerCase()}</h3>
                        <p className="text-gray-600 font-medium text-sm md:text-base">{category.count} {category.count === 1 ? 'Product' : 'Products'}</p>
                        {category.subcategories.length > 0 && (
                          <p className="text-xs md:text-sm text-gray-500 mt-2">{category.subcategories.length} {category.subcategories.length === 1 ? 'Subcategory' : 'Subcategories'}</p>
                        )}
                        <div className="mt-4 md:mt-6 text-transparent bg-gradient-to-r from-blue-600 to-amber-600 bg-clip-text font-bold group-hover:translate-x-2 transition inline-flex items-center gap-2">
                          Explore <span className="text-amber-500">→</span>
                        </div>
                      </Link>
                    );
                  })}
                  {/* Duplicate set for seamless loop */}
                  {categories.map((category: any, index: number) => {
                    const colors = [
                      "from-blue-600 to-blue-800",
                      "from-blue-700 to-blue-900",
                      "from-amber-500 to-amber-700",
                      "from-blue-800 to-slate-900",
                      "from-purple-600 to-purple-800",
                      "from-green-600 to-green-800",
                      "from-red-600 to-red-800",
                      "from-indigo-600 to-indigo-800",
                    ];
                    const colorClass = colors[index % colors.length];

                    return (
                      <Link
                        key={`second-${category.id}`}
                        href={`/products?category=${encodeURIComponent(category.name)}`}
                        className="group relative bg-white rounded-2xl p-5 md:p-8 shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-amber-400 flex-shrink-0 w-64 md:w-80"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition"></div>
                        <div className={`bg-gradient-to-br ${colorClass} text-white w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative`}>
                          <Lightbulb size={28} className="md:w-9 md:h-9" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-800 transition">{category.name.charAt(0).toUpperCase() + category.name.slice(1).toLowerCase()}</h3>
                        <p className="text-gray-600 font-medium text-sm md:text-base">{category.count} {category.count === 1 ? 'Product' : 'Products'}</p>
                        {category.subcategories.length > 0 && (
                          <p className="text-xs md:text-sm text-gray-500 mt-2">{category.subcategories.length} {category.subcategories.length === 1 ? 'Subcategory' : 'Subcategories'}</p>
                        )}
                        <div className="mt-4 md:mt-6 text-transparent bg-gradient-to-r from-blue-600 to-amber-600 bg-clip-text font-bold group-hover:translate-x-2 transition inline-flex items-center gap-2">
                          Explore <span className="text-amber-500">→</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section id="products" className="py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12 bg-white">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-blue-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-3 md:mb-4 border-2 border-blue-200">
              <Star size={14} className="text-blue-600 fill-blue-600" />
              <span className="text-[12px] md:text-sm font-bold text-blue-700">FEATURED</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4">Featured Products</h2>
            <p className="text-lg md:text-xl text-gray-600">Our most popular lighting solutions</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredLoading ? (
              <div className="col-span-full text-center text-gray-600 font-medium">
                Loading products...
              </div>
            ) : featuredProducts.length === 0 ? (
              <div className="col-span-full text-center text-gray-600">
                No products yet. Add some in the admin panel to see them here.
              </div>
            ) : (
              featuredProducts.map((product: any) => (
                <div key={product.id} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-amber-300">
                  <div className="relative bg-gradient-to-br from-blue-50 via-slate-50 to-amber-50 aspect-square flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-amber-400/10 group-hover:scale-110 transition-transform duration-500"></div>
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-cover relative z-10"
                      />
                    ) : (
                      <Lightbulb
                        size={120}
                        className="text-blue-400 group-hover:text-amber-500 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_30px_rgba(251,191,36,0.5)] relative z-10"
                        strokeWidth={1.5}
                      />
                    )}
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-amber-500/50">
                      NEW
                    </div>
                  </div>
                  <div className="p-4 md:p-6 bg-gradient-to-br from-white to-blue-50/30">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 md:mb-3 group-hover:text-blue-800 transition line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-3 md:mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < Math.floor(product.rating ?? 0) ? "fill-amber-400 text-amber-400 md:w-4 md:h-4" : "text-gray-300 md:w-4 md:h-4"}
                          />
                        ))}
                      </div>
                      <span className="text-xs md:text-sm text-gray-600 font-medium">({product.reviews})</span>
                    </div>
                    <div className="space-y-3 md:space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">₦{formatPrice(product.price + (product.profit || 0))}</div>
                          <div className="text-[10px] md:text-xs text-gray-600 font-medium">per unit</div>
                        </div>
                        <button
                          onClick={() => handleViewDetails(product)}
                          className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl hover:from-amber-500 hover:to-amber-600 transition-all duration-300 text-xs md:text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transform active:scale-95 whitespace-nowrap"
                        >
                          View Details
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] md:text-xs text-amber-700 bg-amber-50 px-2 md:px-3 py-1.5 rounded-lg border border-amber-200">
                        <span className="font-semibold">Min:</span>
                        <span>{product.minQuantity} pieces/carton</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="text-center mt-10 md:mt-16">
            <a href="/products" className="inline-block border-2 md:border-3 border-blue-600 text-blue-700 px-8 md:px-10 py-3 md:py-4 rounded-xl font-bold hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-800 hover:text-white hover:border-transparent transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform text-sm md:text-base">
              View All Products →
            </a>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-16 md:py-20 lg:py-24 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-amber-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full mb-3 md:mb-4 border-2 border-amber-400/30">
              <Award size={14} className="text-amber-400 md:w-4 md:h-4" />
              <span className="text-[12px] md:text-sm font-bold text-amber-300">WHY CHOOSE US</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">Why Choose AKT Lighting?</h2>
            <p className="text-lg md:text-xl text-blue-200">Your trusted partner in premium lighting solutions</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {[
              {
                title: "15+ Years Experience",
                description: "Industry-leading expertise in lighting design and installation solutions.",
                icon: Award,
              },
              {
                title: "5,000+ Happy Clients",
                description: "Trusted by homeowners and businesses across the country.",
                icon: Star,
              },
              {
                title: "Eco-Friendly Products",
                description: "Energy-efficient solutions that save money and protect the environment.",
                icon: Zap,
              },
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-2xl shadow-amber-500/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border-2 md:border-4 border-amber-300/20">
                  <item.icon size={28} className="text-white md:w-11 md:h-11" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 text-amber-100">{item.title}</h3>
                <p className="text-blue-100 md:text-blue-200 leading-relaxed text-sm md:text-lg">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-white to-blue-50/50 rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-10 lg:p-12 text-center border-2 border-amber-200/50 relative overflow-hidden">
            {/* Decorative elements */}
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
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-2xl mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-5 md:px-6 py-3 md:py-4 border-2 border-blue-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition shadow-sm text-sm"
                />
                <button className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 md:px-10 py-3 md:py-4 rounded-lg md:rounded-xl font-bold hover:from-amber-500 hover:to-amber-600 transition-all duration-300 whitespace-nowrap shadow-xl hover:shadow-2xl hover:scale-105 transform text-sm md:text-base">
                  Subscribe Now
                </button>
              </div>
              <p className="text-xs md:text-sm text-gray-500 mt-4 md:mt-6">
                We respect your privacy. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-gray-300 py-12 md:py-14 lg:py-16 px-4 md:px-8 lg:px-12 relative overflow-hidden">
        {/* Decorative golden line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-6">
                <div className="bg-amber-500 p-1 md:p-1.5 rounded-full">
                  <img src="/images/logo.jpg" alt="logo" className="w-10 h-10 md:w-15 md:h-15 rounded-full" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">EKENE-AKT</h3>
                  <p className="text-[10px] md:text-xs font-semibold text-amber-500 tracking-wider">LIGHTING</p>
                </div>
              </div>
              <p className="text-sm md:text-base text-gray-400 leading-relaxed mb-6">
                Illuminate your world with premium lighting solutions designed for modern living.
              </p>
              <div className="flex justify-center md:justify-start gap-3">
                {[
                  { id: 'facebook', icon: Facebook, color: 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-500/20', href: 'https://facebook.com' },
                  { id: 'whatsapp', icon: MessageCircle, color: 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/20', href: 'https://wa.me/2348032744865' },
                  { id: 'instagram', icon: Instagram, color: 'bg-gradient-to-br from-pink-500 via-purple-500 to-amber-500 shadow-purple-500/20', href: 'https://instagram.com' },
                  { id: 'linkedin', icon: Linkedin, color: 'bg-gradient-to-br from-blue-700 to-blue-800 shadow-blue-800/20', href: 'https://linkedin.com' }
                ].map((social) => (
                  <a
                    key={social.id}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-11 h-11 ${social.color} rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:brightness-110 hover:scale-110 transform text-white border border-white/10`}
                  >
                    <span className="sr-only">{social.id}</span>
                    <social.icon size={20} />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h4 className="text-amber-400 font-bold mb-4 md:mb-6 text-base md:text-lg">Quick Links</h4>
              <ul className="space-y-3">
                {['About Us', 'Our Products', 'Contact', 'Blog', 'FAQs', 'Careers'].map((link) => (
                  <li key={link}>
                    <a href="#" className="hover:text-amber-400 transition-colors duration-200 inline-block hover:translate-x-1 transform text-sm md:text-base">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div className="text-center md:text-left">
              <h4 className="text-amber-400 font-bold mb-4 md:mb-6 text-base md:text-lg">Categories</h4>
              <ul className="space-y-3">
                {['Home Lighting', 'Commercial', 'LED Solutions', 'Decorative', 'Outdoor', 'Smart Lighting'].map((category) => (
                  <li key={category}>
                    <a href="#" className="hover:text-amber-400 transition-colors duration-200 inline-block hover:translate-x-1 transform text-sm md:text-base">{category}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="text-center md:text-left">
              <h4 className="text-amber-400 font-bold mb-4 md:mb-6 text-base md:text-lg">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-start justify-center md:justify-start gap-3 group">
                  <MapPin size={18} className="text-amber-500 flex-shrink-0 mt-1 group-hover:scale-110 transition-transform md:w-5 md:h-5" />
                  <span className="group-hover:text-amber-100 transition text-sm md:text-base">Alaba International Market, Ojo, Lagos State, Nigeria</span>
                </li>
                <li className="flex items-start justify-center md:justify-start gap-3 group">
                  <MapPin size={18} className="text-amber-500 flex-shrink-0 mt-1 group-hover:scale-110 transition-transform md:w-5 md:h-5" />
                  <span className="group-hover:text-amber-100 transition text-sm md:text-base">Electrical Main Market, Obosi, Anambra State, Nigeria</span>
                </li>
                <li className="flex items-center justify-center md:justify-start gap-3 group">
                  <Phone size={18} className="text-amber-500 flex-shrink-0 group-hover:scale-110 transition-transform md:w-5 md:h-5" />
                  <span className="group-hover:text-amber-100 transition text-sm md:text-base">+234 803 274 4865</span>
                </li>
                <li className="flex items-center justify-center md:justify-start gap-3 group">
                  <Mail size={18} className="text-amber-500 flex-shrink-0 group-hover:scale-110 transition-transform md:w-5 md:h-5" />
                  <span className="group-hover:text-amber-100 transition text-sm md:text-base">ekeneakt@gmail.com</span>
                </li>
                <li className="pt-2 flex justify-center md:justify-start">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs md:text-sm font-medium rounded-lg text-gray-400 hover:text-white transition-all duration-300 border border-slate-700 hover:border-slate-600"
                  >
                    <ShieldCheck size={16} />
                    <span>Admin Access</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2025 <span className="text-amber-400 font-semibold">AKT Lighting</span>. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-amber-400 transition">Privacy Policy</a>
              <a href="#" className="hover:text-amber-400 transition">Terms of Service</a>
              <a href="#" className="hover:text-amber-400 transition">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/2348032744865"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center group"
        aria-label="Chat with us on WhatsApp"
      >
        {/* Pulsing ring effect */}
        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-40"></div>

        <div className="relative bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white p-4 md:p-5 rounded-full shadow-2xl hover:scale-110 hover:rotate-12 transition-all duration-300 flex items-center justify-center border-4 border-white z-10">
          <MessageCircle size={36} strokeWidth={2.5} className="drop-shadow-lg" />
        </div>

        <span className="absolute right-full mr-4 bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border-2 border-green-100 mb-2">
          Chat with us!
        </span>
      </a>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md">
            <div className="bg-white/20 rounded-full p-1.5">
              <ShoppingCart size={20} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{toastMessage}</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-white hover:text-amber-100 transition p-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
