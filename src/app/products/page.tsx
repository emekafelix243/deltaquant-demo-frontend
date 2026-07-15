// frontend/src/app/products/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getProducts, createProduct, deleteProduct } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Product } from "@/types";
import AppShell from "@/components/AppShell";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", barcode: "",
    price: 0, cost_price: 0, is_active: true,
    initial_stock: 0, low_stock_threshold: 5,
  });

  const loadProducts = useCallback((searchTerm = "") => {
    getProducts(searchTerm).then((res) => setProducts(res.data));
  }, []);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) { router.push("/login"); return; }
    setUser(currentUser);
    loadProducts();
  }, [router, loadProducts]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    loadProducts(value);
  };

  const handleClearSearch = () => {
    setSearch("");
    loadProducts("");
  };

  const handleCreate = async () => {
    if (!form.name) { alert("Product name is required."); return; }
    setLoading(true);
    try {
      await createProduct(form);
      setShowForm(false);
      setForm({ name: "", description: "", barcode: "", price: 0, cost_price: 0, is_active: true, initial_stock: 0, low_stock_threshold: 5 });
      loadProducts(search);
    } catch {
      alert("Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      loadProducts(search);
    } catch {
      alert("Failed to delete product.");
    }
  };

  return (
    <AppShell active="products" username={user?.username} role={user?.role}>
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Products</h2>
          {user?.role === "admin" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
            >
              + Add Product
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-gray-800 p-4 sm:p-6 rounded-xl mb-6">
            <h3 className="text-lg font-semibold mb-4">New Product</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Product Name <span className="text-red-400">*</span></label>
                <input placeholder="e.g. Coca Cola" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-gray-700 px-3 py-2 rounded-lg text-white" />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Barcode</label>
                <input placeholder="e.g. 123456789" value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  className="w-full bg-gray-700 px-3 py-2 rounded-lg text-white" />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Selling Price (₦) <span className="text-red-400">*</span></label>
                <input placeholder="e.g. 500" type="number" value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full bg-gray-700 px-3 py-2 rounded-lg text-white" />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Cost Price (₦) <span className="text-red-400">*</span></label>
                <input placeholder="e.g. 350" type="number" value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
                  className="w-full bg-gray-700 px-3 py-2 rounded-lg text-white" />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Initial Stock</label>
                <input placeholder="e.g. 50" type="number" value={form.initial_stock}
                  onChange={(e) => setForm({ ...form, initial_stock: Number(e.target.value) })}
                  className="w-full bg-gray-700 px-3 py-2 rounded-lg text-white" />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Low Stock Alert At</label>
                <input placeholder="e.g. 5" type="number" value={form.low_stock_threshold}
                  onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })}
                  className="w-full bg-gray-700 px-3 py-2 rounded-lg text-white" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-gray-400 text-sm block mb-1">Description</label>
                <input placeholder="e.g. Chilled soft drink" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-700 px-3 py-2 rounded-lg text-white" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={handleCreate} disabled={loading}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg disabled:opacity-50 transition">
                {loading ? "Saving..." : "Save Product"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="relative mb-4">
          <input type="text" placeholder="Search products by name..." value={search}
            onChange={handleSearch}
            className="w-full bg-gray-800 border border-gray-700 px-4 py-2 pr-10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          {search && (
            <button onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg leading-none">
              ×
            </button>
          )}
        </div>

        <div className="bg-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-gray-700">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Barcode</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Cost</th>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Status</th>
                {user?.role === "admin" && <th className="text-left px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === "admin" ? 7 : 6} className="text-center px-4 py-8 text-gray-500">
                    {search ? `No products found for "${search}"` : "No products available"}
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 text-gray-400">{p.barcode || "—"}</td>
                    <td className="px-4 py-3 text-green-400">₦{p.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-yellow-400">₦{p.cost_price.toLocaleString()}</td>
                    <td className="px-4 py-3">{p.quantity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${p.is_active ? "bg-green-900 text-green-400" : "bg-red-900 text-red-400"}`}>
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {user?.role === "admin" && (
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(p.id)}
                          className="text-red-400 hover:text-red-300 text-sm transition">
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}