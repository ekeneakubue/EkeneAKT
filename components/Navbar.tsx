"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, Menu, Phone, Mail, X, LogIn, LogOut, User, Grid3x3, Sun, Moon } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Navbar() {
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { getTotalItems } = useCart();
    const { isAuthenticated, user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch for theme toggle


    return (
        <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-blue-100 dark:border-slate-800 shadow-lg transition-colors duration-300">
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white py-2.5 px-4 md:px-8 lg:px-12">
                <div className="container mx-auto px-4 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-6">
                        <a href="tel:+2348032744865" className="flex items-center gap-2 hover:text-amber-300 transition">
                            <Phone size={14} className="text-amber-400" />
                            <span>+234 8032744865</span>
                        </a>
                    </div>
                    <div className="text-xs md:text-sm">
                        <a href="mailto:ekeneaktonline@gmail.com" className="flex items-center gap-2 hidden md:flex items-center gap-2 hover:text-amber-300 transition">
                            <Mail size={14} className="text-amber-400" />
                            <span>ekeneaktonline@gmail.com</span>
                        </a>
                    </div>
                </div>
            </div>

            <nav className="container mx-auto px-4 md:px-8 lg:px-12 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 md:gap-3">
                        <div className="bg-amber-500 p-1 md:p-1.5 rounded-full">
                            <img src="/images/logo.jpg" alt="logo" className="w-10 h-10 md:w-15 md:h-15 rounded-full" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent leading-none">EKENE-AKT</h1>
                            <p className="text-[10px] md:text-xs font-semibold text-amber-600 tracking-wider">LIGHTING</p>
                        </div>
                    </Link>

                    <div className="hidden md:flex flex-1 max-w-xl mx-8">
                        <div className="relative w-full">
                            <input type="text" placeholder="Search for lighting products..." className="w-full px-4 py-2.5 pr-10 border-2 border-blue-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition" />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-600 transition"><Search size={20} /></button>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-6">
                        <Link href="/products" className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition relative group">Products<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 group-hover:w-full transition-all duration-300"></span></Link>
                        <a href="/#categories" className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition relative group">Categories<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 group-hover:w-full transition-all duration-300"></span></a>
                        <a href="/#about" className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition relative group">About<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 group-hover:w-full transition-all duration-300"></span></a>
                        <a href="/#contact" className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition relative group">Contact<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 group-hover:w-full transition-all duration-300"></span></a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/cart" className="relative p-2 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition group">
                            <ShoppingCart size={24} className="text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition" />
                            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold shadow-lg px-1">{getTotalItems()}</span>
                        </Link>

                        {isAuthenticated ? (
                            <div className="hidden lg:flex items-center gap-3">
                                <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 font-semibold transition hover:bg-blue-50 rounded-lg"><Grid3x3 size={18} /><span>Dashboard</span></Link>
                                <div className="flex items-center gap-2 px-4 py-2 text-gray-700 font-semibold hover:bg-blue-50 rounded-lg cursor-default"><User size={18} /><span>{user?.name}</span></div>
                                <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 font-semibold transition hover:bg-red-50 rounded-lg"><LogOut size={18} /><span>Sign Out</span></button>
                            </div>
                        ) : (
                            <Link href="/signin" className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-amber-600 transition-all duration-300 shadow-lg">Sign In</Link>
                        )}
                        <button onClick={toggleTheme} className="p-2 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400" aria-label="Toggle theme">
                            {mounted && (theme === "dark" ? <Sun size={24} /> : <Moon size={24} />)}
                            {!mounted && <Sun size={24} className="opacity-0" />} {/* Placeholder to prevent layout shift */}
                        </button>
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition" aria-label="Toggle menu">{isMobileMenuOpen ? <X size={24} className="text-gray-700 dark:text-gray-300" /> : <Menu size={24} className="text-gray-700 dark:text-gray-300" />}</button>
                    </div>
                </div>
                {isMobileMenuOpen && (
                    <div className="lg:hidden mt-4 pb-4 border-t border-blue-100 dark:border-slate-800 flex flex-col gap-2 pt-4">
                        <Link href="/products" className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold py-3 px-4 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition">Products</Link>
                        <a href="/#categories" className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold py-3 px-4 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition">Categories</a>
                        <a href="/#about" className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold py-3 px-4 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition">About</a>
                        <a href="/#contact" className="text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 font-semibold py-3 px-4 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition">Contact</a>
                    </div>
                )}
            </nav>
        </header>
    );
}
