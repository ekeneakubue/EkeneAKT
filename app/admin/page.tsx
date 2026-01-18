"use client";

import { useState, useEffect } from "react";
import {
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
  AlertCircle,
  Banknote,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  totalProfit: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  recentOrders: any[];
  lowStockProducts: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Response is not JSON:", contentType, "Response:", text);
        setLoading(false);
        // Set empty stats to prevent UI errors
        setStats({
          totalProducts: 0,
          totalOrders: 0,
          totalCustomers: 0,
          totalRevenue: 0,
          totalProfit: 0,
          pendingOrders: 0,
          processingOrders: 0,
          shippedOrders: 0,
          deliveredOrders: 0,
          recentOrders: [],
          lowStockProducts: [],
        });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setStats(data);

        // Check if there's a connection error in the response
        if (data._error) {
          setConnectionError(data._error.hint || data._error.message || "Database connection issue");
          console.warn("Database connection warning:", data._error);
        } else {
          setConnectionError(null);
        }
      } else {
        try {
          const errorData = await response.json();
          console.error("Error fetching dashboard data:", errorData);
          console.error("Error details:", {
            error: errorData.error,
            message: errorData.message,
            code: errorData.code,
            details: errorData.details,
          });
          // Set empty stats to prevent UI errors
          setStats({
            totalProducts: 0,
            totalOrders: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            totalProfit: 0,
            pendingOrders: 0,
            processingOrders: 0,
            shippedOrders: 0,
            deliveredOrders: 0,
            recentOrders: [],
            lowStockProducts: [],
          });
        } catch (parseError: any) {
          console.error("Error parsing error response:", parseError);
          console.error("Parse error details:", {
            message: parseError?.message,
            name: parseError?.name,
            stack: parseError?.stack,
          });
          // Set empty stats to prevent UI errors
          setStats({
            totalProducts: 0,
            totalOrders: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            totalProfit: 0,
            pendingOrders: 0,
            processingOrders: 0,
            shippedOrders: 0,
            deliveredOrders: 0,
            recentOrders: [],
            lowStockProducts: [],
          });
        }
      }
    } catch (error: any) {
      // Extract error information safely
      const errorMessage = error?.message || String(error) || "Unknown error";
      const errorName = error?.name || "Error";

      console.error("Error fetching dashboard data:", error);
      console.error("Error details:", {
        name: errorName,
        message: errorMessage,
        stack: error?.stack,
        toString: error?.toString?.(),
      });

      // Set empty stats to prevent UI errors
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        totalProfit: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        recentOrders: [],
        lowStockProducts: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return `₦${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingBag,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    },
    {
      title: "Total Customers",
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
    },
    {
      title: "Total Revenue",
      value: formatPrice(stats?.totalRevenue || 0),
      icon: Banknote,
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
    },
    {
      title: "Total Profit",
      value: formatPrice(stats?.totalProfit || 0),
      icon: TrendingUp,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
  ];

  const orderStatusCards = [
    {
      title: "Pending",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Processing",
      value: stats?.processingOrders || 0,
      icon: AlertCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Shipped",
      value: stats?.shippedOrders || 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Delivered",
      value: stats?.deliveredOrders || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                <strong>Database Connection Issue:</strong> {connectionError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Welcome to Admin Dashboard</h1>
        <p className="text-blue-100 dark:text-blue-200">Manage your store, products, orders, and customers from here.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <card.icon className={`${card.color} text-white`} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Status Cards */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Status Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {orderStatusCards.map((card, index) => (
            <div
              key={index}
              className={`${card.bgColor} dark:bg-slate-900/50 rounded-lg p-4 border-2 border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition`}
            >
              <div className="flex items-center gap-3">
                <card.icon className={card.color} size={24} />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders and Low Stock Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-100 dark:border-slate-800">
          <div className="p-6 border-b border-gray-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
          </div>
          <div className="p-6">
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOrders.slice(0, 5).map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">{formatPrice(order.total)}</p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${order.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : order.status === "processing"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "shipped"
                              ? "bg-purple-100 text-purple-800"
                              : order.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent orders</p>
            )}
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-gray-100 dark:border-slate-800">
          <div className="p-6 border-b border-gray-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Low Stock Products</h2>
          </div>
          <div className="p-6">
            {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {stats.lowStockProducts.slice(0, 5).map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition"
                  >
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Stock: {product.stockCount || 0} units
                      </p>
                    </div>
                    <XCircle className="text-red-600" size={20} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">All products are well stocked</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

