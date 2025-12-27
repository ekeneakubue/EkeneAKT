"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Tag, Search, X, Save } from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    productCount: number;
    subCategories: string[];
    createdAt?: string;
    updatedAt?: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryName, setCategoryName] = useState("");
    const [categorySlug, setCategorySlug] = useState("");
    const [categoryDescription, setCategoryDescription] = useState("");
    const [subCategoriesList, setSubCategoriesList] = useState<string[]>([]);
    const [subCategoryInput, setSubCategoryInput] = useState("");

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/admin/categories");
            if (response.ok) {
                const categoriesData = await response.json();
                setCategories(categoriesData.sort((a: Category, b: Category) => a.name.localeCompare(b.name)));
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setCategoryName(category.name);
            setCategorySlug(category.slug || "");
            setCategoryDescription(category.description || "");
            setSubCategoriesList(category.subCategories || []);
            setSubCategoryInput("");
        } else {
            setEditingCategory(null);
            setCategoryName("");
            setCategorySlug("");
            setCategoryDescription("");
            setSubCategoriesList([]);
            setSubCategoryInput("");
        }
        setIsModalOpen(true);
        setError("");
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setCategoryName("");
        setCategorySlug("");
        setCategoryDescription("");
        setSubCategoriesList([]);
        setSubCategoryInput("");
        setError("");
    };

    // Generate slug from name
    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleNameChange = (value: string) => {
        setCategoryName(value);
        // Auto-generate slug if slug field is empty or matches the previous name's slug
        if (!categorySlug || categorySlug === generateSlug(categoryName)) {
            setCategorySlug(generateSlug(value));
        }
    };

    const handleAddSubCategory = () => {
        const trimmed = subCategoryInput.trim();
        if (trimmed && !subCategoriesList.includes(trimmed)) {
            setSubCategoriesList([...subCategoriesList, trimmed]);
            setSubCategoryInput("");
        }
    };

    const handleRemoveSubCategory = (subToRemove: string) => {
        setSubCategoriesList(subCategoriesList.filter(s => s !== subToRemove));
    };

    const handleSubCategoryKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddSubCategory();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        if (!categoryName.trim()) {
            setError("Category name is required");
            setIsSubmitting(false);
            return;
        }

        try {
            const categoryData = {
                name: categoryName.trim(),
                slug: categorySlug.trim() || undefined,
                description: categoryDescription.trim() || undefined,
                subCategories: subCategoriesList,
            };

            if (editingCategory) {
                // Update existing category
                const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(categoryData),
                });

                if (response.ok) {
                    handleCloseModal();
                    // Refetch categories to ensure we have the latest data
                    await fetchCategories();
                } else {
                    const errorData = await response.json();
                    setError(errorData.error || "Failed to update category");
                }
            } else {
                // Create new category
                const response = await fetch("/api/admin/categories", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(categoryData),
                });

                if (response.ok) {
                    handleCloseModal();
                    // Refetch categories to ensure we have the latest data
                    await fetchCategories();
                } else {
                    const errorData = await response.json();
                    setError(errorData.error || "Failed to create category");
                }
            }
        } catch (error) {
            console.error("Error saving category:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (category: Category) => {
        if (category.productCount > 0) {
            alert(`Cannot delete "${category.name}" because it has ${category.productCount} product(s). Please reassign or delete those products first.`);
            return;
        }

        if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

        try {
            const response = await fetch(`/api/admin/categories/${category.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                // Refetch categories to ensure we have the latest data
                await fetchCategories();
            } else {
                const errorData = await response.json();
                alert(errorData.error || "Failed to delete category");
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            alert("An error occurred while deleting the category");
        }
    };

    const filteredCategories = categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
                    <p className="text-gray-600 mt-1">Manage product categories</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-900 transition shadow-md hover:shadow-lg"
                >
                    <Plus size={20} />
                    <span>Add Category</span>
                </button>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Slug
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subcategories
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Products
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredCategories.length > 0 ? (
                                filteredCategories.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <Tag className="text-blue-600" size={20} />
                                                </div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {category.name}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {category.slug || "-"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                                                {category.description || "-"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {category.subCategories && category.subCategories.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {category.subCategories.slice(0, 3).map((sub, idx) => (
                                                        <span key={idx} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                            {sub}
                                                        </span>
                                                    ))}
                                                    {category.subCategories.length > 3 && (
                                                        <span className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                                                            +{category.subCategories.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">
                                                {category.productCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleOpenModal(category);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition"
                                                    title="Edit category"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDelete(category);
                                                    }}
                                                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={category.productCount > 0}
                                                    title={category.productCount > 0 ? "Cannot delete category with products" : "Delete category"}
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
                                        <Tag className="mx-auto text-gray-400 mb-4" size={48} />
                                        <p className="text-gray-500">No categories found</p>
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
                    Showing <span className="font-semibold">{filteredCategories.length}</span> of{" "}
                    <span className="font-semibold">{categories.length}</span> categories
                </p>
            </div>

            {/* Add/Edit Category Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Tag className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {editingCategory ? "Edit Category" : "Add New Category"}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        {editingCategory ? "Update category details" : "Create a new product category"}
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

                            {/* Category Name Field */}
                            <div>
                                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Category Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="categoryName"
                                    type="text"
                                    value={categoryName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="e.g., LED Lights, Outdoor Lighting"
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    required
                                />
                            </div>

                            {/* Slug Field */}
                            <div>
                                <label htmlFor="categorySlug" className="block text-sm font-medium text-gray-700 mb-2">
                                    Slug (Optional)
                                </label>
                                <input
                                    id="categorySlug"
                                    type="text"
                                    value={categorySlug}
                                    onChange={(e) => setCategorySlug(e.target.value)}
                                    placeholder="e.g., led-lights, outdoor-lighting"
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                                <p className="mt-1 text-xs text-gray-500">URL-friendly identifier. Auto-generated from name if left empty.</p>
                            </div>

                            {/* Description Field */}
                            <div>
                                <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="categoryDescription"
                                    value={categoryDescription}
                                    onChange={(e) => setCategoryDescription(e.target.value)}
                                    placeholder="Enter category description..."
                                    rows={3}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                />
                            </div>

                            {/* Sub-Category Field */}
                            <div>
                                <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 mb-2">
                                    Sub-Categories (Optional)
                                </label>

                                <div className="space-y-3">
                                    {/* Added Subcategories Tags */}
                                    {subCategoriesList.length > 0 && (
                                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            {subCategoriesList.map((sub, idx) => (
                                                <span key={idx} className="inline-flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-2 py-1 rounded-md text-sm">
                                                    {sub}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSubCategory(sub)}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Input Group */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            id="subCategory"
                                            type="text"
                                            value={subCategoryInput}
                                            onChange={(e) => setSubCategoryInput(e.target.value)}
                                            onKeyPress={handleSubCategoryKeyPress}
                                            placeholder="e.g., Ceiling Lights"
                                            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSubCategory}
                                            className="flex items-center justify-center p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                                            title="Add sub-category"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500">Type a sub-category and press Enter or click the plus icon.</p>
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
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            <span>{editingCategory ? "Update" : "Create"} Category</span>
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
