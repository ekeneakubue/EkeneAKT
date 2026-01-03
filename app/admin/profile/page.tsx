"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { User, Mail, Lock, Camera, Save, Loader2, Shield } from "lucide-react";

export default function ProfilePage() {
    const { user: currentUser, signInAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        avatar: "",
        password: "",
        confirmPassword: "",
    });
    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser?.id) {
            fetchUserProfile();
        }
    }, [currentUser]);

    const fetchUserProfile = async () => {
        try {
            const response = await fetch(`/api/admin/users/${currentUser!.id}`);
            if (response.ok) {
                const data = await response.json();
                setFormData((prev) => ({
                    ...prev,
                    name: data.name,
                    email: data.email,
                    avatar: data.avatar || "",
                }));
                setPreviewAvatar(data.avatar || null);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setMessage(null);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                setMessage({ type: "error", text: "Please select a valid image file" });
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: "error", text: "Image size must be less than 5MB" });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewAvatar(reader.result as string);
                setFormData((prev) => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        // Validation
        if (formData.password && formData.password !== formData.confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" });
            setSaving(false);
            return;
        }

        if (formData.password && formData.password.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters" });
            setSaving(false);
            return;
        }

        try {
            const updateData: any = {
                name: formData.name,
                email: formData.email,
                avatar: formData.avatar,
            };

            if (formData.password) {
                updateData.password = formData.password;
            }

            const response = await fetch(`/api/admin/users/${currentUser!.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                setMessage({ type: "success", text: "Profile updated successfully" });
                setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
                // Update local auth context if needed - calling signin again or simple reload might be needed to refresh top-bar avatar 
                // For now user has to refresh or we can try to update context state if exposed.
                window.location.reload(); // Simple way to refresh context
            } else {
                const errorData = await response.json();
                setMessage({ type: "error", text: errorData.error || "Failed to update profile" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "An error occurred while saving" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center space-y-4">
                        <div className="relative inline-block">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto bg-gray-100">
                                {previewAvatar ? (
                                    <img src={previewAvatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-md">
                                <Camera size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{formData.name}</h3>
                            <p className="text-gray-500 text-sm">{currentUser?.role?.toUpperCase()}</p>
                        </div>

                        <div className="pt-4 border-t border-gray-50 text-left space-y-3">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Mail size={16} className="text-blue-500" />
                                <span className="truncate">{formData.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <Shield size={16} className="text-emerald-500" />
                                <span className="capitalize">{currentUser?.role} Account</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Edit Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {message && (
                                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-sm font-medium">{message.text}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <User size={20} className="text-blue-500" />
                                    Personal Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 space-y-4">
                                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Lock size={20} className="text-purple-500" />
                                    Security
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">New Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Leave empty to keep current"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            placeholder="Confirm new password"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed font-medium"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
