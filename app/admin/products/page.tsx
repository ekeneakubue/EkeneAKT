"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Image as ImageIcon,
  Check,
  X,
  Save,
  Upload,
  DollarSign,
  Tag,
  Box,
  Star,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
// Categories will be fetched from the database

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  profit: number;
  minQuantity: number;
  category: string;
  subCategory: string | null;
  image: string | null;
  images: string[] | null; // Array of additional product images
  socketType: string | null; // Optional socket/bulb base type
  availableColors: string | null; // Optional available colors
  rating: number | null;
  reviews: number;
  featured: boolean;
  inStock: boolean;
  stockCount: number | null;
  createdAt: string;
  updatedAt: string;
}

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [subImagePreviews, setSubImagePreviews] = useState<string[]>([]);
  const [socketTypes, setSocketTypes] = useState<string[]>([]);
  const [socketTypeInput, setSocketTypeInput] = useState("");
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    profit: "",
    minQuantity: "1",
    category: "",
    subCategory: "",
    image: "",
    images: [] as string[],
    socketType: "",
    availableColors: "",
    rating: "0",
    reviews: "0",
    featured: false,
    inStock: true,
    stockCount: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        // Refetch products to ensure we have the latest data
        await fetchProducts();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("An error occurred while deleting the product");
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      // Edit mode
      setEditingProduct(product);
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        profit: product.profit?.toString() || "",
        minQuantity: product.minQuantity?.toString() || "1",
        category: product.category || "",
        subCategory: product.subCategory || "",
        image: product.image || "",
        images: product.images || [],
        socketType: product.socketType || "",
        availableColors: product.availableColors || "",
        rating: product.rating?.toString() || "0",
        reviews: product.reviews?.toString() || "0",
        featured: product.featured ?? false,
        inStock: product.inStock ?? true,
        stockCount: product.stockCount?.toString() || "",
      });
      setImagePreview(product.image);
      setSubImagePreviews(product.images || []);
      setSocketTypes(product.socketType ? product.socketType.split(", ").filter(Boolean) : []);
      setSocketTypeInput("");
      setAvailableColors(product.availableColors ? product.availableColors.split(", ").filter(Boolean) : []);
      setColorInput("");
    } else {
      // Add mode
      setEditingProduct(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        profit: "",
        minQuantity: "1",
        category: "",
        subCategory: "",
        image: "",
        images: [],
        socketType: "",
        availableColors: "",
        rating: "0",
        reviews: "0",
        featured: false,
        inStock: true,
        stockCount: "",
      });
      setImagePreview(null);
      setSubImagePreviews([]);
      setSocketTypes([]);
      setSocketTypeInput("");
      setAvailableColors([]);
      setColorInput("");
    }
    setIsModalOpen(true);
    setError("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setError("");
    setFormData({
      name: "",
      description: "",
      price: "",
      profit: "",
      minQuantity: "1",
      category: "",
      subCategory: "",
      image: "",
      images: [],
      socketType: "",
      availableColors: "",
      rating: "0",
      reviews: "0",
      featured: false,
      inStock: true,
      stockCount: "",
    });
    setImagePreview(null);
    setSubImagePreviews([]);
    setSocketTypes([]);
    setSocketTypeInput("");
    setAvailableColors([]);
    setColorInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // If category changes, reset subcategory
    if (name === "category") {
      setFormData((prev) => ({
        ...prev,
        category: value,
        subCategory: "", // Reset subcategory when category changes
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
    }
    setError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  const handleSubImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreview = reader.result as string;
        const newPreviews = [...subImagePreviews];
        const newImages = [...formData.images];

        if (newPreviews[index]) {
          // Replace existing image
          newPreviews[index] = newPreview;
          newImages[index] = newPreview;
        } else {
          // Add new image
          newPreviews[index] = newPreview;
          newImages[index] = newPreview;
        }

        setSubImagePreviews(newPreviews);
        setFormData((prev) => ({ ...prev, images: newImages }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSubImage = (index: number) => {
    const newPreviews = subImagePreviews.filter((_, i) => i !== index);
    const newImages = formData.images.filter((_, i) => i !== index);
    setSubImagePreviews(newPreviews);
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const handleAddSocketType = () => {
    const trimmedInput = socketTypeInput.trim();
    if (trimmedInput && !socketTypes.includes(trimmedInput)) {
      const newSocketTypes = [...socketTypes, trimmedInput];
      setSocketTypes(newSocketTypes);
      setSocketTypeInput("");
      // Update formData with comma-separated socket types
      setFormData((prev) => ({ ...prev, socketType: newSocketTypes.join(", ") }));
    }
  };

  const handleRemoveSocketType = (typeToRemove: string) => {
    const newSocketTypes = socketTypes.filter((type) => type !== typeToRemove);
    setSocketTypes(newSocketTypes);
    // Update formData with comma-separated socket types
    setFormData((prev) => ({ ...prev, socketType: newSocketTypes.join(", ") }));
  };

  const handleSocketTypeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSocketType();
    }
  };

  const handleAddColor = () => {
    const trimmedInput = colorInput.trim();
    if (trimmedInput && !availableColors.includes(trimmedInput)) {
      const newColors = [...availableColors, trimmedInput];
      setAvailableColors(newColors);
      setColorInput("");
      // Update formData with comma-separated colors
      setFormData((prev) => ({ ...prev, availableColors: newColors.join(", ") }));
    }
  };

  const handleRemoveColor = (colorToRemove: string) => {
    const newColors = availableColors.filter((color) => color !== colorToRemove);
    setAvailableColors(newColors);
    // Update formData with comma-separated colors
    setFormData((prev) => ({ ...prev, availableColors: newColors.join(", ") }));
  };

  const handleColorKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddColor();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Validation
    if (!formData.name.trim() || !formData.price.trim() || !formData.category.trim() || !formData.subCategory.trim()) {
      setError("Please fill in all required fields (Name, Price, Category, Sub-Category)");
      setIsSubmitting(false);
      return;
    }

    if (parseFloat(formData.price) < 0) {
      setError("Price must be greater than or equal to 0");
      setIsSubmitting(false);
      return;
    }

    try {
      // Validate editingProduct has an ID if in edit mode
      if (editingProduct && !editingProduct.id) {
        setError("Invalid product data. Please refresh and try again.");
        setIsSubmitting(false);
        return;
      }

      // Prepare data with images array
      const submitData = {
        ...formData,
        images: formData.images.length > 0 ? formData.images : undefined,
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setError("Server error: Invalid response format");
        setIsSubmitting(false);
        return;
      }

      if (response.ok) {
        handleCloseModal();
        // Refetch products to ensure we have the latest data
        await fetchProducts();
      } else {
        try {
          const data = await response.json();
          console.error("Server error response:", data, "Status:", response.status);

          // Handle empty error object
          if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
            setError(`Server error: HTTP ${response.status}. Please check the server console for details.`);
          } else {
            const errorMessage = data.error || data.message || (editingProduct ? "Failed to update product" : "Failed to create product");
            const errorDetails = data.details ? ` (${JSON.stringify(data.details)})` : "";
            setError(errorMessage + errorDetails);
          }
        } catch (parseError) {
          const errorText = await response.text();
          console.error("Failed to parse error response:", parseError, "Response:", errorText, "Status:", response.status);
          setError(`Server error: HTTP ${response.status}. ${errorText || "Please check the server console for details."}`);
        }
      }
    } catch (error) {
      console.error("Error creating product:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (amount: number) => {
    return `₦${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
    const matchesStock =
      filterStock === "all" ||
      (filterStock === "inStock" && product.inStock) ||
      (filterStock === "outOfStock" && !product.inStock);

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Get category names for dropdown
  const categoryNames = categories.map((cat) => cat.name);

  // Get available subcategories for the selected category
  const selectedCategoryData = categories.find((cat) => cat.name === formData.category);
  const availableSubcategories = selectedCategoryData?.subcategories.map((sub) => sub.name) || [];

  // If category has no subcategories, add a "General" option since subcategory is required
  const subcategoryOptions = availableSubcategories.length === 0 && formData.category
    ? ["General"]
    : availableSubcategories;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleOpenModal();
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-900 transition shadow-md hover:shadow-lg"
        >
          <Plus size={20} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categoryNames.map((categoryName) => (
              <option key={categoryName} value={categoryName}>
                {categoryName}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Stock Status</option>
            <option value="inStock">In Stock</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <ImageIcon className="text-gray-400" size={20} />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.featured && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{product.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {product.stockCount ?? "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.inStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          <Check size={12} />
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          <X size={12} />
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenModal(product);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition"
                          title="Edit product"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(product.id);
                          }}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition"
                          title="Delete product"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500">No products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold">{filteredProducts.length}</span> of{" "}
          <span className="font-semibold">{products.length}</span> products
        </p>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="text-blue-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingProduct ? "Edit Product" : "Add New Product"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {editingProduct ? "Update product details" : "Create a new product in your catalog"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Main Image Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Product Image
                </label>
                <div className="flex items-center gap-4">
                  {/* Image Preview */}
                  <div className="relative">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        <ImageIcon className="text-gray-400" size={24} />
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                      <Upload size={18} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {imagePreview ? "Change Image" : "Upload Main Image"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500">JPG, PNG or GIF (max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Sub Images Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Images (Optional - up to 3)
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="space-y-2">
                      <div className="relative">
                        {subImagePreviews[index] ? (
                          <div className="relative">
                            <img
                              src={subImagePreviews[index]}
                              alt={`Sub image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSubImage(index)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                            <ImageIcon className="text-gray-400" size={20} />
                          </div>
                        )}
                      </div>
                      <label className="flex items-center justify-center gap-1 px-3 py-1.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition text-xs">
                        <Upload size={14} className="text-gray-600" />
                        <span className="text-gray-700 font-medium">
                          {subImagePreviews[index] ? "Change" : "Upload"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSubImageChange(index, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">Upload up to 3 additional product images (max 5MB each)</p>
              </div>

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                />
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              {/* Price, Profit and Min Quantity Row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₦) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign
                      size={20}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profit" className="block text-sm font-medium text-gray-700 mb-2">
                    Profit (₦)
                  </label>
                  <div className="relative">
                    <TrendingUp
                      size={20}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="profit"
                      name="profit"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.profit}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="minQuantity" className="block text-sm font-medium text-gray-700 mb-2">
                    Min Quantity (per carton)
                  </label>
                  <div className="relative">
                    <Box
                      size={20}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="minQuantity"
                      name="minQuantity"
                      type="number"
                      min="1"
                      value={formData.minQuantity}
                      onChange={handleInputChange}
                      placeholder="1"
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Category Field */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Tag
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                  />
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none bg-white"
                    required
                  >
                    <option value="">Select a category</option>
                    {categoryNames.map((categoryName) => (
                      <option key={categoryName} value={categoryName}>
                        {categoryName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sub-Category Field */}
              <div>
                <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Tag
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"
                  />
                  <select
                    id="subCategory"
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={!formData.category}
                  >
                    <option value="">
                      {!formData.category
                        ? "Please select a category first"
                        : "Select a sub-category"}
                    </option>
                    {subcategoryOptions.map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Socket Type Field */}
              <div>
                <label htmlFor="socketTypeInput" className="block text-sm font-medium text-gray-700 mb-2">
                  Socket Type (Optional)
                </label>

                {/* Display added socket types as tags */}
                {socketTypes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {socketTypes.map((type, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => handleRemoveSocketType(type)}
                          className="hover:bg-blue-200 rounded-full p-0.5 transition"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Input field and add button */}
                <div className="flex items-center gap-2">
                  <input
                    id="socketTypeInput"
                    type="text"
                    value={socketTypeInput}
                    onChange={(e) => setSocketTypeInput(e.target.value)}
                    onKeyPress={handleSocketTypeKeyPress}
                    placeholder="e.g., E27, E14, B22, GU10"
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={handleAddSocketType}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter socket types one at a time and click Add. Press Enter to add quickly.
                </p>
              </div>

              {/* Available Colors Field */}
              <div>
                <label htmlFor="colorInput" className="block text-sm font-medium text-gray-700 mb-2">
                  Available Colors (Optional)
                </label>

                {/* Display added colors as tags */}
                {availableColors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {availableColors.map((color, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                      >
                        {color}
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(color)}
                          className="hover:bg-green-200 rounded-full p-0.5 transition"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Input field and add button */}
                <div className="flex items-center gap-2">
                  <input
                    id="colorInput"
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyPress={handleColorKeyPress}
                    placeholder="e.g., White, Warm White, Cool White, RGB"
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus size={18} />
                    Add
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter available colors one at a time and click Add. Press Enter to add quickly.
                </p>
              </div>

              {/* Stock Count and Rating Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="stockCount" className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Count
                  </label>
                  <input
                    id="stockCount"
                    name="stockCount"
                    type="number"
                    min="0"
                    value={formData.stockCount}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="relative">
                    <Star
                      size={20}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="rating"
                      name="rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating}
                      onChange={handleInputChange}
                      placeholder="0.0"
                      className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Reviews Field */}
              <div>
                <label htmlFor="reviews" className="block text-sm font-medium text-gray-700 mb-2">
                  Reviews Count
                </label>
                <input
                  id="reviews"
                  name="reviews"
                  type="number"
                  min="0"
                  value={formData.reviews}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              {/* Checkboxes Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    id="featured"
                    name="featured"
                    type="checkbox"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="featured" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <TrendingUp size={16} className="text-gray-400" />
                    Featured Product
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="inStock"
                    name="inStock"
                    type="checkbox"
                    checked={formData.inStock}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="inStock" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Check size={16} className="text-gray-400" />
                    In Stock
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-900 transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{editingProduct ? "Updating..." : "Creating..."}</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>{editingProduct ? "Update Product" : "Create Product"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


