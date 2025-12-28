"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Search, Star, Filter, X, ChevronDown, ChevronRight, Home as HomeIcon, Building2, Lightbulb, Lamp, Zap, Grid3x3, List, SlidersHorizontal, LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";

// Helper function to format numbers with commas
const formatPrice = (amount: number): string => {
  if (isNaN(amount)) return "0";
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/\.00$/, "");
};

// Category structure type
type CategoryStructure = {
  id: string;
  name: string;
  count: number;
  subcategories: {
    id: string;
    name: string;
    count: number;
  }[];
};

const priceRanges = [
  { id: "all", label: "All Prices" },
  { id: "0-100", label: "Under ₦100" },
  { id: "100-300", label: "₦100 - ₦300" },
  { id: "300-500", label: "₦300 - ₦500" },
  { id: "500-plus", label: "₦500 & Above" },
];

type StoreProduct = {
  id: string;
  name: string;
  category: string;
  subCategory?: string | null;
  price: number;
  minQuantity: number;
  rating: number | null;
  reviews: number;
  featured: boolean;
  image?: string | null;
  description?: string | null;
  profit?: number;
  inStock?: boolean;
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categoryStructure, setCategoryStructure] = useState<CategoryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("featured");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const { addToCart, getTotalItems } = useCart();
  const { isAuthenticated, user, signOut } = useAuth();

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // "All Products" option for category filter
  const allProductsOption = { id: "all", name: "All Products", icon: Grid3x3, count: products.length };

  useEffect(() => {
    let cancelled = false;

    // Fetch categories
    (async () => {
      try {
        const res = await fetch("/api/categories", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);
        const data = (await res.json()) as CategoryStructure[];
        if (!cancelled) setCategoryStructure(data);
      } catch (e: any) {
        console.error("Error loading categories:", e);
      }
    })();

    // Fetch products
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetch("/api/products?includeImage=true", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
        const data = (await res.json()) as StoreProduct[];
        if (!cancelled) setProducts(data);
      } catch (e: any) {
        console.error("Error loading products:", e);
        if (!cancelled) setLoadError(e?.message ?? "Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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

  // Helper function to check if selected category/subcategory matches product
  const matchesCategory = (product: StoreProduct, selected: string): boolean => {
    if (!selected || selected === "all") return true;

    // Check if selected is a category name
    const category = categoryStructure.find((cat) => cat.name === selected);
    if (category) {
      // Match if product category matches
      return product.category === category.name;
    }

    // Check if selected is a subcategory name
    const subcategory = categoryStructure
      .flatMap((cat) => cat.subcategories)
      .find((sub) => sub.name === selected);
    if (subcategory) {
      // Match if product subCategory matches the selected subcategory name
      return product.subCategory === subcategory.name;
    }

    // Direct name match (fallback)
    return (product.category !== null && product.category !== undefined && product.category === selected) ||
      (product.subCategory !== null && product.subCategory !== undefined && product.subCategory === selected);
  };

  // Filter products based on selections
  const filteredProducts = products.filter((product) => {
    // Category filter
    if (selectedCategory !== "all") {
      if (!matchesCategory(product, selectedCategory)) {
        return false;
      }
    }

    // Price range filter
    if (selectedPriceRange !== "all") {
      const [min, max] = selectedPriceRange.split("-").map(Number);
      if (max) {
        if (product.price < min || product.price > max) return false;
      } else if (selectedPriceRange === "500-plus") {
        if (product.price < 500) return false;
      }
    }

    // Search filter
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return (b.rating ?? 0) - (a.rating ?? 0);
      case "popular":
        return b.reviews - a.reviews;
      default:
        return Number(b.featured) - Number(a.featured);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-lg">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-2.5 px-4 md:px-8 lg:px-12">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 flex justify-between items-center text-sm">
            <Link href="/" className="flex items-center gap-2 hover:text-amber-300 transition">
              <span>← Back to Home</span>
            </Link>
            <div className="text-xs md:text-sm font-medium">
              Fast Shipping on all Orders!
            </div>
          </div>
        </div>

        <nav className="container mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-amber-500 p-1.5 rounded-full">
                <img src="/images/logo.jpg" alt="logo" className="w-15 h-15 rounded-full" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">AKT</h1>
                <p className="text-xs font-semibold text-amber-600 tracking-wider">LIGHTING</p>
              </div>
            </Link>

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
                <div className="hidden md:flex items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 font-semibold transition hover:bg-blue-50 rounded-lg"
                    title="Go to Dashboard"
                  >
                    <Grid3x3 size={18} />
                    <span>Dashboard</span>
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-gray-700 cursor-default">
                    <User size={18} className="text-blue-600" />
                    <span className="font-semibold">{user?.name}</span>
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
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Page Header */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-8 md:py-10 lg:py-12 px-4 md:px-8 lg:px-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Products</h1>
          <p className="text-xl text-blue-200">Discover premium lighting solutions for every space</p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-32 space-y-6">
              {/* Search */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-5 lg:p-6 border-2 border-blue-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Search size={20} className="text-amber-600" />
                  Search Products
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-5 lg:p-6 border-2 border-blue-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter size={20} className="text-amber-600" />
                  Categories
                </h3>
                <div className="space-y-1">
                  {/* All Products */}
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedCategory === "all"
                      ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg"
                      : "hover:bg-blue-50 text-gray-700"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <allProductsOption.icon size={20} />
                      <span className="font-semibold">{allProductsOption.name}</span>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded-lg ${selectedCategory === "all"
                      ? "bg-white/20"
                      : "bg-amber-100 text-amber-700"
                      }`}>
                      {allProductsOption.count}
                    </span>
                  </button>

                  {/* Category Structure from Database */}
                  {categoryStructure.map((category) => (
                    <div key={category.id} className="border-b border-gray-100 last:border-b-0">
                      <button
                        onClick={() => {
                          if (category.subcategories.length > 0) {
                            toggleCategory(category.id);
                          } else {
                            setSelectedCategory(category.name);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedCategory === category.name
                          ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg"
                          : "hover:bg-blue-50 text-gray-700"
                          }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {category.subcategories.length > 0 && (
                            <ChevronRight
                              size={16}
                              className={`transition-transform ${expandedCategories.has(category.id) ? "rotate-90" : ""
                                }`}
                            />
                          )}
                          <span className="font-semibold text-sm">{category.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-lg ${selectedCategory === category.name
                          ? "bg-white/20"
                          : "bg-amber-100 text-amber-700"
                          }`}>
                          {category.count}
                        </span>
                      </button>

                      {/* Subcategories */}
                      {category.subcategories.length > 0 && expandedCategories.has(category.id) && (
                        <div className="ml-4 mt-1 space-y-1 pb-2">
                          {category.subcategories.map((subcategory) => (
                            <button
                              key={subcategory.id}
                              onClick={() => setSelectedCategory(subcategory.name)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-sm ${selectedCategory === subcategory.name
                                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md"
                                : "hover:bg-amber-50 text-gray-600"
                                }`}
                            >
                              <span className="font-medium">{subcategory.name}</span>
                              {subcategory.count > 0 && (
                                <span className={`text-xs px-2 py-0.5 rounded ${selectedCategory === subcategory.name
                                  ? "bg-white/20"
                                  : "bg-amber-100 text-amber-700"
                                  }`}>
                                  {subcategory.count}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-5 lg:p-6 border-2 border-blue-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-amber-600" />
                  Price Range
                </h3>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setSelectedPriceRange(range.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all ${selectedPriceRange === range.id
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg font-semibold"
                        : "hover:bg-amber-50 text-gray-700"
                        }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedCategory !== "all" || selectedPriceRange !== "all" || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedPriceRange("all");
                    setSearchQuery("");
                  }}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition shadow-lg"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </aside>

          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
            >
              <Filter size={20} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            {/* Mobile Filters Overlay */}
            {showFilters && (
              <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
                <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white overflow-y-auto">
                  <div className="p-5 md:p-6 space-y-5 md:space-y-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    {/* Mobile Search */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Search</h3>
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    {/* Mobile Categories */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
                      <div className="space-y-1">
                        {/* All Products */}
                        <button
                          onClick={() => setSelectedCategory("all")}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedCategory === "all"
                            ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white"
                            : "hover:bg-blue-50 text-gray-700"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <allProductsOption.icon size={20} />
                            <span className="font-semibold">{allProductsOption.name}</span>
                          </div>
                          <span className={`text-sm px-2 py-1 rounded-lg ${selectedCategory === "all" ? "bg-white/20" : "bg-amber-100 text-amber-700"
                            }`}>
                            {allProductsOption.count}
                          </span>
                        </button>

                        {/* Category Structure from Database */}
                        {categoryStructure.map((category) => (
                          <div key={category.id} className="border-b border-gray-100 last:border-b-0">
                            <button
                              onClick={() => {
                                if (category.subcategories.length > 0) {
                                  toggleCategory(category.id);
                                } else {
                                  setSelectedCategory(category.name);
                                }
                              }}
                              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedCategory === category.name
                                ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white"
                                : "hover:bg-blue-50 text-gray-700"
                                }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {category.subcategories.length > 0 && (
                                  <ChevronRight
                                    size={16}
                                    className={`transition-transform ${expandedCategories.has(category.id) ? "rotate-90" : ""
                                      }`}
                                  />
                                )}
                                <span className="font-semibold text-sm">{category.name}</span>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-lg ${selectedCategory === category.name
                                ? "bg-white/20"
                                : "bg-amber-100 text-amber-700"
                                }`}>
                                {category.count}
                              </span>
                            </button>

                            {/* Subcategories */}
                            {category.subcategories.length > 0 && expandedCategories.has(category.id) && (
                              <div className="ml-4 mt-1 space-y-1 pb-2">
                                {category.subcategories.map((subcategory) => (
                                  <button
                                    key={subcategory.id}
                                    onClick={() => setSelectedCategory(subcategory.name)}
                                    className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-all text-sm ${selectedCategory === subcategory.name
                                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md"
                                      : "hover:bg-amber-50 text-gray-600"
                                      }`}
                                  >
                                    <span className="font-medium">{subcategory.name}</span>
                                    {subcategory.count > 0 && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${selectedCategory === subcategory.name
                                        ? "bg-white/20"
                                        : "bg-amber-100 text-amber-700"
                                        }`}>
                                        {subcategory.count}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mobile Price Range */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Price Range</h3>
                      <div className="space-y-2">
                        {priceRanges.map((range) => (
                          <button
                            key={range.id}
                            onClick={() => setSelectedPriceRange(range.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all ${selectedPriceRange === range.id
                              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold"
                              : "hover:bg-amber-50 text-gray-700"
                              }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Apply Filters Button */}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 rounded-xl font-bold shadow-lg"
                    >
                      Apply Filters
                    </button>

                    {(selectedCategory !== "all" || selectedPriceRange !== "all" || searchQuery) && (
                      <button
                        onClick={() => {
                          setSelectedCategory("all");
                          setSelectedPriceRange("all");
                          setSearchQuery("");
                        }}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold"
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-4 mb-4 md:mb-6 border-2 border-blue-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-gray-700">
                  <span className="font-bold text-blue-800">{sortedProducts.length}</span> products found
                </div>

                <div className="flex items-center gap-4">
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition ${viewMode === "grid"
                        ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg"
                        : "text-gray-600 hover:text-blue-600"
                        }`}
                    >
                      <Grid3x3 size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition ${viewMode === "list"
                        ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg"
                        : "text-gray-600 hover:text-blue-600"
                        }`}
                    >
                      <List size={20} />
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold text-gray-700 cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="popular">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {loading ? (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-8 md:p-10 lg:p-12 text-center border-2 border-blue-100">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading products...</p>
              </div>
            ) : loadError ? (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-8 md:p-10 lg:p-12 text-center border-2 border-red-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Couldn&apos;t load products</h3>
                <p className="text-gray-600 mb-6">{loadError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition"
                >
                  Retry
                </button>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-8 md:p-10 lg:p-12 text-center border-2 border-blue-100">
                <div className="text-gray-400 mb-4">
                  <Filter size={64} className="mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedPriceRange("all");
                    setSearchQuery("");
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-8 py-3 rounded-xl font-bold hover:shadow-xl transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
                {sortedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-amber-300"
                  >
                    <div className="relative bg-gradient-to-br from-blue-50 via-slate-50 to-amber-50 aspect-square flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-amber-400/10 group-hover:scale-110 transition-transform duration-500"></div>
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover relative z-10"
                          loading="lazy"
                        />
                      ) : (
                        <Lightbulb
                          size={120}
                          className="text-blue-400 group-hover:text-amber-500 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_30px_rgba(251,191,36,0.5)] relative z-10"
                          strokeWidth={1.5}
                        />
                      )}
                    </div>
                    <div className="p-6 bg-gradient-to-br from-white to-blue-50/30">
                      <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-800 transition">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={
                                i < Math.floor(product.rating ?? 0)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              }
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 font-medium">({product.reviews})</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <div className="text-lg font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                              ₦{formatPrice(product.price + (product.profit || 0))}
                            </div>
                            <div className="text-xs text-gray-500">per unit</div>
                          </div>
                          <button
                            onClick={() => handleViewDetails(product)}
                            className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-3 py-1.5 rounded-lg hover:from-amber-500 hover:to-amber-600 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transform active:scale-95 whitespace-nowrap"
                          >
                            View Details
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          <span className="font-semibold">Min:</span>
                          <span>{product.minQuantity} pieces/carton</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-amber-300"
                  >
                    <div className="flex flex-col sm:flex-row">
                      <div className="relative bg-gradient-to-br from-blue-50 via-slate-50 to-amber-50 w-full sm:w-64 h-64 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-amber-400/10 group-hover:scale-110 transition-transform duration-500"></div>
                        {product.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt={product.name}
                            className="absolute inset-0 w-full h-full object-cover relative z-10"
                            loading="lazy"
                          />
                        ) : (
                          <Lightbulb
                            size={100}
                            className="text-blue-400 group-hover:text-amber-500 transition-all duration-300 group-hover:scale-110 relative z-10"
                            strokeWidth={1.5}
                          />
                        )}
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-800 transition">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={18}
                                  className={
                                    i < Math.floor(product.rating ?? 0)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-gray-300"
                                  }
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 font-medium">
                              {product.rating ?? 0} ({product.reviews} reviews)
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-end justify-between gap-3">
                            <div>
                              <div className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                                ₦{formatPrice(product.price + (product.profit || 0))}
                              </div>
                              <div className="text-xs text-gray-500">per unit</div>
                            </div>
                            <button
                              onClick={() => handleViewDetails(product)}
                              className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg hover:from-amber-500 hover:to-amber-600 transition-all duration-300 text-sm font-semibold shadow-md hover:shadow-lg hover:scale-105 transform active:scale-95 whitespace-nowrap"
                            >
                              View Details
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                            <span className="font-semibold">Min:</span>
                            <span>{product.minQuantity} pieces/carton</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
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

