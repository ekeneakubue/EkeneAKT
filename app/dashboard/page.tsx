"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Package,
  MapPin,
  Phone,
  Mail,
  Edit2,
  Save,
  X,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  ShoppingCart,
  LogOut,
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  minQuantity: number;
  total: number;
  product: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface Order {
  id: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: string | null;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
}

const formatPrice = (amount: number): string => {
  if (isNaN(amount)) return "0.00";
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "processing":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "shipped":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "delivered":
      return "bg-green-100 text-green-800 border-green-300";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return <Clock size={16} className="text-yellow-600" />;
    case "processing":
      return <Package size={16} className="text-blue-600" />;
    case "shipped":
      return <Truck size={16} className="text-purple-600" />;
    case "delivered":
      return <CheckCircle size={16} className="text-green-600" />;
    case "cancelled":
      return <XCircle size={16} className="text-red-600" />;
    default:
      return <AlertCircle size={16} className="text-gray-600" />;
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut, isAuthenticated, isLoading: authLoading } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

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

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Order shipping editing state
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderShippingAddress, setOrderShippingAddress] = useState("");
  const [savingShipping, setSavingShipping] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch customer data and orders
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get customer by email
        const email = user.email;

        const customerResponse = await fetch(
          `/api/customers/by-email?email=${encodeURIComponent(email)}`
        );

        let customerData: Customer | null = null;

        if (customerResponse.ok) {
          customerData = await customerResponse.json();
        }

        if (!customerData) {
          setError("Customer profile not found. Please complete an order first.");
          setLoading(false);
          return;
        }

        setCustomer(customerData);
        setProfileForm({
          name: customerData.name || "",
          phone: customerData.phone || "",
          address: customerData.address || "",
          city: customerData.city || "",
          state: customerData.state || "",
          country: customerData.country || "Nigeria",
        });

        // Fetch orders
        const ordersResponse = await fetch(
          `/api/customers/orders?customerId=${customerData.id}`
        );

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          setOrders(ordersData);
        } else {
          console.error("Failed to fetch orders");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user]);

  const handleSaveProfile = async () => {
    if (!customer) return;

    try {
      setSavingProfile(true);
      const response = await fetch("/api/customers/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          ...profileForm,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
        setIsEditingProfile(false);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateOrderShipping = async (orderId: string) => {
    if (!customer || !orderShippingAddress.trim()) {
      alert("Please enter a shipping address");
      return;
    }

    try {
      setSavingShipping(true);
      const response = await fetch(`/api/customers/orders/${orderId}/shipping`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          shippingAddress: orderShippingAddress,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(
          orders.map((order: any) => (order.id === orderId ? data.order : order))
        );
        setEditingOrderId(null);
        setOrderShippingAddress("");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to update shipping address");
      }
    } catch (err) {
      console.error("Error updating shipping address:", err);
      alert("Failed to update shipping address");
    } finally {
      setSavingShipping(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error && !customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/products"
            className="inline-block bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:from-amber-500 hover:to-amber-600 transition"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 md:px-8 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-amber-500 p-1.5 rounded-full">
                <img src="/images/logo.jpg" alt="logo" className="w-12 h-12 rounded-full" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                  EKENE-AKT
                </h1>
                <p className="text-xs font-semibold text-amber-600 tracking-wider">LIGHTING</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/products"
                className="flex items-center gap-2 text-gray-700 hover:text-amber-600 font-semibold transition"
              >
                <ShoppingCart size={20} />
                <span className="hidden md:inline">Shop</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-700 hover:text-amber-600 font-semibold transition"
              >
                <Home size={20} />
                <span className="hidden md:inline">Home</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-8 lg:px-12 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Manage your profile and track your orders</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="text-blue-600" size={24} />
                  Profile
                </h2>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Profile"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
              </div>

              {customer && (
                <div className="space-y-4">
                  {isEditingProfile ? (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, name: e.target.value })
                          }
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, phone: e.target.value })
                          }
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Address
                        </label>
                        <textarea
                          value={profileForm.address}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, address: e.target.value })
                          }
                          rows={3}
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={profileForm.city}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, city: e.target.value })
                            }
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            value={profileForm.state}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, state: e.target.value })
                            }
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={profileForm.country}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, country: e.target.value })
                          }
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSaveProfile}
                          disabled={savingProfile}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg font-semibold hover:from-amber-500 hover:to-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Save size={18} />
                          {savingProfile ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileForm({
                              name: customer.name || "",
                              phone: customer.phone || "",
                              address: customer.address || "",
                              city: customer.city || "",
                              state: customer.state || "",
                              country: customer.country || "Nigeria",
                            });
                          }}
                          className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center gap-2"
                        >
                          <X size={18} />
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-gray-700">
                        <Mail size={18} className="text-blue-600" />
                        <span className="font-medium">{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-3 text-gray-700">
                          <Phone size={18} className="text-blue-600" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-start gap-3 text-gray-700">
                          <MapPin size={18} className="text-blue-600 mt-1 flex-shrink-0" />
                          <div>
                            <p>{customer.address}</p>
                            {(customer.city || customer.state) && (
                              <p className="text-sm text-gray-600">
                                {[customer.city, customer.state, customer.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Orders Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package className="text-blue-600" size={24} />
                My Orders
              </h2>

              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={64} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-4">No orders yet</p>
                  <Link
                    href="/products"
                    className="inline-block bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:from-amber-500 hover:to-amber-600 transition"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-semibold text-gray-600">
                              Order #{order.id.slice(0, 8)}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border-2 flex items-center gap-1 ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {getStatusIcon(order.status)}
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Placed on{" "}
                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            ₦{formatPrice(order.total)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.orderItems.length} item
                            {order.orderItems.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-start gap-3 mb-2">
                          <MapPin size={18} className="text-gray-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-700 mb-1">
                              Shipping Address
                            </p>
                            {editingOrderId === order.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={orderShippingAddress}
                                  onChange={(e) =>
                                    setOrderShippingAddress(e.target.value)
                                  }
                                  rows={3}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  placeholder="Enter shipping address"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateOrderShipping(order.id)}
                                    disabled={savingShipping}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                                  >
                                    {savingShipping ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingOrderId(null);
                                      setOrderShippingAddress("");
                                    }}
                                    className="px-3 py-1.5 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between">
                                <p className="text-sm text-gray-600">
                                  {order.shippingAddress || "No address provided"}
                                </p>
                                {(order.status === "pending" ||
                                  order.status === "processing") && (
                                    <button
                                      onClick={() => {
                                        setEditingOrderId(order.id);
                                        setOrderShippingAddress(order.shippingAddress || "");
                                      }}
                                      className="ml-2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                      title="Edit Shipping Address"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Items</h4>
                        <div className="space-y-2">
                          {order.orderItems.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-3 bg-gray-50 rounded-lg p-3"
                            >
                              {item.product.image ? (
                                <Image
                                  src={item.product.image}
                                  alt={item.product.name}
                                  width={48}
                                  height={48}
                                  className="rounded-lg object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <Package size={24} className="text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 text-sm">
                                  {item.product.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {item.quantity} carton{item.quantity !== 1 ? "s" : ""} ×{" "}
                                  {item.minQuantity} pieces = {item.quantity * item.minQuantity}{" "}
                                  pieces
                                </p>
                              </div>
                              <p className="font-bold text-gray-900">
                                ₦{formatPrice(item.total)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Newsletter */}
      <section className="py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50">
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
      <footer id="contact" className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-gray-300 py-12 md:py-14 lg:py-16 px-4 md:px-8 lg:px-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>

        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
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

