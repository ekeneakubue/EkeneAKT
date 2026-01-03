"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  UserCog,
  Settings,
  Menu,
  X,
  LogOut,
  Home,
  User,
  ChevronRight,
  Tag
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: Tag },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Users", href: "/admin/users", icon: UserCog },
  { name: "Edit Profile", href: "/admin/profile", icon: User },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user, isLoading, isAuthenticated } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/admin/login");
  };
  // Protect admin routes
  useEffect(() => {
    // Skip check for login page
    if (pathname === "/admin/login") return;

    if (!isLoading && (!isAuthenticated || (user?.role !== "admin" && user?.role !== "manager"))) {
      router.push("/admin/login");
    }
  }, [isLoading, isAuthenticated, user, router, pathname]);

  // Handle admin login page specifically to avoid layout issues
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated || (user?.role !== "admin" && user?.role !== "manager")) {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading admin portal...</p>
          </div>
        </div>
      );
    }
    // Return null while redirecting
    return null;
  }

  // Filter navigation based on role
  const filteredNavigation = navigation.filter((item) => {
    if (user?.role === "admin") return true;
    if (user?.role === "manager") {
      return ["Products", "Categories", "Edit Profile"].includes(item.name);
    }
    return false;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-full">
                <img src="/images/logo.jpg" alt="logo" className="w-8 h-8 rounded-full" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                  AKT Admin
                </h1>
                <p className="text-xs font-semibold text-amber-600 tracking-wider">
                  {user?.role === "manager" ? "MANAGER" : "DASHBOARD"}
                </p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              // For Dashboard, only match exact path
              // For other items, match exact path or paths that start with the href + "/"
              const isActive = item.href === "/admin"
                ? pathname === item.href
                : pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                    ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                  {isActive && <ChevronRight size={16} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-gray-200">
            <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-900">{user?.name || "Admin"}</p>
              <p className="text-xs text-gray-500">{user?.email || "admin@akt.com"}</p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition mb-2"
            >
              <Home size={18} />
              <span className="text-sm font-medium">Back to Store</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
            <div className="flex-1 lg:flex-none">
              <h2 className="text-xl font-bold text-gray-900">
                {navigation.find((item) => pathname === item.href || pathname?.startsWith(item.href + "/"))?.name || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "User"}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || "A"}
                    </span>
                  </div>
                )}
                <span className="font-medium">{user?.name || "Admin"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

