"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Mail, Star, Truck, Shield, Award, Lightbulb, ChevronLeft, ChevronRight, X, MessageCircle } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

// Helper function to format numbers with commas
const formatPrice = (amount: number | string | undefined): string => {
    if (amount === undefined) return "0";
    const num = typeof amount === "string" ? parseFloat(amount.replace("₦", "").replace(/,/g, "")) : amount;
    if (isNaN(num)) return "0";
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",").replace(/\.00$/, "");
};

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

export default function HomeClient() {
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const { addToCart, getTotalItems } = useCart();
    const { isAuthenticated } = useAuth();
    const [featuredProducts, setFeaturedProducts] = useState<StoreProduct[]>([]);
    const [featuredLoading, setFeaturedLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

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
        { id: 1, image: "/images/hero1.webp", alt: "Premium Lighting Collection" },
        { id: 2, image: "/images/hero4.jpg", alt: "AKT Electric Bikes" },
        { id: 3, image: "/images/hero2.webp", alt: "Modern LED Solutions" },
        { id: 4, image: "/images/hero3.png", alt: "Elegant Chandeliers" },
        { id: 5, image: "/images/hero4.webp", alt: "Smart Home Lighting" }
    ];

    useEffect(() => {
        if (!isAutoPlaying) return;
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, heroSlides.length]);

    const nextSlide = () => { setCurrentSlide((prev) => (prev + 1) % heroSlides.length); setIsAutoPlaying(false); };
    const prevSlide = () => { setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length); setIsAutoPlaying(false); };
    const goToSlide = (index: number) => { setCurrentSlide(index); setIsAutoPlaying(false); };

    const handleAddToCart = (product: StoreProduct) => {
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
            <Navbar />

            <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 min-h-[70vh] md:h-[80vh] px-4 md:px-8 lg:px-12 overflow-hidden flex items-center">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
                </div>
                <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-4 md:space-y-6 text-white text-center md:text-left">
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight">Illuminate Your <span className="block bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">Perfect Space</span></h1>
                        <p className="text-lg md:text-xl text-blue-100 leading-relaxed max-w-lg mx-auto md:mx-0">Discover premium lighting solutions that transform your home and business with elegance and efficiency.</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <Link href="/products" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 md:px-10 py-4 rounded-xl font-bold hover:scale-105 transition shadow-xl shadow-amber-500/30">Shop Now</Link>
                            <Link href="/products" className="border-2 border-amber-400 text-amber-300 px-8 md:px-10 py-4 rounded-xl font-bold hover:bg-amber-400/10 transition backdrop-blur-sm">View Catalog</Link>
                        </div>
                    </div>
                    <div className="relative h-[40vh] md:h-[70vh] mt-8 md:mt-0">
                        <div className="relative bg-gradient-to-br from-blue-800/40 to-blue-900/40 backdrop-blur-xl rounded-3xl p-4 md:p-8 shadow-2xl border border-amber-400/20 w-full h-full group overflow-hidden">
                            {heroSlides.map((slide, index) => (
                                <div key={slide.id} className={`absolute inset-0 transition-opacity duration-700 ${index === currentSlide ? "opacity-100" : "opacity-0"}`}>
                                    <img src={slide.image} alt={slide.alt} className="w-full h-full object-cover rounded-2xl" />
                                </div>
                            ))}
                            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition duration-300 z-10"><ChevronLeft size={24} /></button>
                            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition duration-300 z-10"><ChevronRight size={24} /></button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-white py-12 px-4 md:px-8 lg:px-12">
                <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left"><div className="bg-amber-500 p-4 rounded-2xl"><Truck size={24} /></div><div><p className="font-bold">Free Shipping</p><p className="text-amber-200 text-sm">On all orders</p></div></div>
                    <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left"><div className="bg-amber-500 p-4 rounded-2xl"><Shield size={24} /></div><div><p className="font-bold">Warranty</p><p className="text-amber-200 text-sm">2 Years coverage</p></div></div>
                    <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left"><div className="bg-amber-500 p-4 rounded-2xl"><Award size={24} /></div><div><p className="font-bold">Quality</p><p className="text-amber-200 text-sm">Premium certified</p></div></div>
                    <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left"><div className="bg-amber-500 p-4 rounded-2xl"><Phone size={24} /></div><div><p className="font-bold">Support</p><p className="text-amber-200 text-sm">24/7 assistance</p></div></div>
                </div>
            </section>

            <section id="categories" className="py-20 px-4 md:px-8 lg:px-12 bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
                <div className="container mx-auto px-4 text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 dark:text-white">Shop by Category</h2>
                    <p className="text-gray-600 dark:text-gray-300">Find the perfect lighting for every space</p>
                </div>
                <div className="relative overflow-hidden group min-h-[200px] flex items-center justify-center">
                    {categoriesLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative w-12 h-12">
                                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="mt-4 text-gray-500 font-medium italic">Discovering collections...</p>create manage dashboard with the permission to see Dashboard, Products, Categories, and Edit Profile in Sidebar
                        </div>
                    ) : (
                        <div className="flex animate-marquee gap-6 whitespace-nowrap">
                            {/* First set of categories */}
                            {categories.map((category) => (
                                <Link key={`${category.id}-1`} href={`/products?category=${encodeURIComponent(category.name)}`} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all w-80 shrink-0 border-2 border-transparent hover:border-amber-400 dark:border-slate-700">
                                    <div className="bg-blue-600 dark:bg-blue-700 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl"><Lightbulb size={28} /></div>
                                    <h3 className="text-xl font-bold mb-2 dark:text-white">{category.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-300">{category.count} Products</p>
                                </Link>
                            ))}
                            {/* Duplicate set for seamless looping */}
                            {categories.map((category) => (
                                <Link key={`${category.id}-2`} href={`/products?category=${encodeURIComponent(category.name)}`} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all w-80 shrink-0 border-2 border-transparent hover:border-amber-400 dark:border-slate-700">
                                    <div className="bg-blue-600 dark:bg-blue-700 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl"><Lightbulb size={28} /></div>
                                    <h3 className="text-xl font-bold mb-2 dark:text-white">{category.name}</h3>
                                    <p className="text-gray-600 dark:text-gray-300">{category.count} Products</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section id="products" className="py-20 px-4 md:px-8 lg:px-12 bg-white dark:bg-slate-950 transition-colors duration-300">
                <div className="container mx-auto">
                    <div className="text-center mb-16"><h2 className="text-3xl md:text-5xl font-bold mb-4 dark:text-white">Featured Products</h2><p className="text-gray-600 dark:text-gray-300">Our most popular lighting solutions</p></div>
                    {featuredLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="mt-6 text-gray-500 font-medium text-lg italic animate-pulse">Illuminating premium choices...</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {featuredProducts.map((product) => (
                                <div key={product.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition border-2 border-gray-100 hover:border-amber-300 dark:border-slate-700 overflow-hidden group">
                                    <div className="aspect-square relative bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                                        {product.image ? <img src={product.image} alt={product.name} className="object-cover w-full h-full" /> : <Lightbulb size={80} className="text-blue-200" />}
                                    </div>
                                    <div className="p-6">
                                        <h3 className="font-bold text-lg mb-2 truncate dark:text-white">{product.name}</h3>
                                        <div className="flex items-center gap-1 mb-4">
                                            {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < (product.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"} />)}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xl font-bold text-blue-900 dark:text-blue-400">₦{formatPrice(product.price * 1.075 + (product.profit || 0))}</span>
                                            <button onClick={() => handleViewDetails(product)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-500 transition">View</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="text-center mt-12"><Link href="/products" className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold hover:scale-105 transition shadow-lg">View All Products →</Link></div>
                </div>
            </section>

            {/* Newsletter */}
            <section className="py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
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

                                    className="flex-1 px-5 md:px-6 py-3 md:py-4 border-2 border-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition shadow-sm text-sm md:text-base disabled:opacity-50"
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

            {showToast && (
                <div className="fixed bottom-10 right-10 bg-blue-600 text-white px-8 py-4 rounded-xl shadow-2xl z-50 animate-bounce">
                    <p className="font-bold">{toastMessage}</p>
                </div>
            )}
        </div>
    );
}
