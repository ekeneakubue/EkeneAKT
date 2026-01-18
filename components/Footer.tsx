"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin, MessageCircle, MapPin, Phone, Mail, ShieldCheck } from "lucide-react";

export default function Footer() {
    return (
        <footer id="contact" className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-gray-300 py-12 md:py-14 lg:py-16 relative overflow-hidden dark:from-slate-950 dark:via-gray-950 dark:to-slate-950 transition-colors duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

            <div className="container mx-auto px-4 md:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-6">
                            <div className="bg-amber-500 p-1 md:p-1.5 rounded-full">
                                <img src="/images/logo.jpg" alt="logo" className="w-10 h-10 md:w-16 md:h-16 rounded-full" />
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
                                { id: 'facebook', icon: Facebook, color: 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-500/20', href: 'https://web.facebook.com/GigoPlanet' },
                                { id: 'whatsapp', icon: MessageCircle, color: 'bg-gradient-to-br from-green-500 to-green-600 shadow-green-500/20', href: 'https://wa.me/2348032744865' },
                                { id: 'instagram', icon: Instagram, color: 'bg-gradient-to-br from-pink-500 via-purple-500 to-amber-500 shadow-purple-500/20', href: 'https://www.instagram.com/ekeneakt' },
                                // { id: 'linkedin', icon: Linkedin, color: 'bg-gradient-to-br from-blue-700 to-blue-800 shadow-blue-800/20', href: 'https://linkedin.com' }
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
                                <span className="group-hover:text-amber-100 transition text-sm md:text-base">ekeneaktonline@gmail.com</span>
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

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm md:text-base">
                        © 2025 <span className="text-amber-400 font-semibold">AKT Lighting</span>. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm md:text-base">
                        <a href="#" className="hover:text-amber-400 transition">Privacy Policy</a>
                        <a href="#" className="hover:text-amber-400 transition">Terms of Service</a>
                        <a href="#" className="hover:text-amber-400 transition">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
