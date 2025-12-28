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
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    </div>
  );
}

