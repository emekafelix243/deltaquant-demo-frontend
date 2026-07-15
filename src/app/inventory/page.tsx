// frontend/src/app/inventory/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getProducts, adjustStock, getInventory } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Product } from "@/types";
import AppShell from "@/components/AppShell";

interface InventoryMovement {
  id: number;
  product_id: number;
  product_name: string;
  type: "restock" | "deduction" | "adjustment" | "sale";
  quantity: number;
  note: string;
  created_at: string;
  created_by: string;
}

interface AdjustForm {
  product_id: number;
  type: "restock" | "deduction" | "adjustment";
  quantity: number;
  note: string;
}

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"stock" | "movements">("stock");
  const [search, setSearch] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<AdjustForm>({
    product_id: 0, type: "restock", quantity: 0, note: "",
  });

  const loadProducts = useCallback(() => {
    getProducts().then((res) => setProducts(res.data));
  }, []);

  const loadMovements = useCallback(() => {
    getInventory().then((res) => setMovements(res.data));
  }, []);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) { router.push("/login"); return; }
    setUser(currentUser);
    loadProducts();
    loadMovements();
  }, [router, loadProducts, loadMovements]);

  const handleAdjust = async () => {
    if (!form.product_id || form.quantity <= 0) {
      alert("Please select a product and enter a valid quantity.");
      return;
    }
    setLoading(true);
    try {
      await adjustStock(form);
      setSuccess("Inventory updated successfully.");
      setShowForm(false);
      setForm({ product_id: 0, type: "restock", quantity: 0, note: "" });
      loadProducts();
      loadMovements();
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      alert("Failed to adjust inventory.");
    } finally {
      setLoading(false);
    }
  };

  const lowStockProducts = products.filter((p) => (p.quantity ?? 0) <= (p.low_stock_threshold ?? 5));

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchLow = filterLowStock ? (p.quantity ?? 0) <= (p.low_stock_threshold ?? 5) : true;
    return matchSearch && matchLow;
  });

  const getStockStatus = (p: Product) => {
    const threshold = p.low_stock_threshold ?? 5;
    const qty = p.quantity ?? 0;
    if (qty === 0) return { label: "Out of Stock", cls: "bg-red-900 text-red-400" };
    if (qty <= threshold) return { label: "Low Stock", cls: "bg-yellow-900 text-yellow-400" };
    return { label: "In Stock", cls: "bg-green-900 text-green-400" };
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case "restock": return "text-green-400";
      case "deduction": return "text-red-400";
      case "sale": return "text-blue-400";
      default: return "text-yellow-400";
    }
  };

  const getMovementSign = (type: string) => {
    if (type === "restock") return "+";
    if (type === "adjustment") return "±";
    return "−";
  };

  return (
    <AppShell active="inventory" username={user?.username} role={user?.role}>
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Inventory</h2>
          {user?.role === "admin" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
            >
              + Adjust Stock
            </button>
          )}
        </div>

        {success && (
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg mb-4">{success}</div>
        )}

        {lowStockProducts.length > 0 && (
          <div className="bg-yellow-900 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
            <span className="text-yellow-400 text-lg shrink-0">⚠</span>
            <div>
              <p className="font-semibold">Low Stock Alert</p>
              <p className="text-sm text-yellow-400">
                {lowStockProducts.map((p) => p.name).join(", ")} —{" "}
                {lowStockProducts.length === 1 ? "this product is" : "these products are"} running low.
              </p>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-gray-800 p-4 sm:p-6 rounded-xl mb-6">
            <h3 className="text-lg font-semibold mb-4">Stock Adjustment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-gray-400 text-sm block mb-1">Product</label>
                <select
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: Number(e.target.value) })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
                >
                  <option value={0}>Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current: {p.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Adjustment Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as AdjustForm["type"] })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
                >
                  <option value="restock">Restock (Add)</option>
                  <option value="deduction">Deduction (Remove)</option>
                  <option value="adjustment">Manual Adjustment</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-1">Quantity</label>
                <input
                  type="number" min={1} placeholder="Enter quantity"
                  value={form.quantity || ""}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-gray-400 text-sm block mb-1">Note (optional)</label>
                <input
                  type="text" placeholder="e.g. Supplier delivery, Damaged goods..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={handleAdjust} disabled={loading}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg disabled:opacity-50 transition">
                {loading ? "Saving..." : "Apply Adjustment"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-700">
          {(["stock", "movements"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                activeTab === tab
                  ? "bg-gray-800 text-white border border-b-0 border-gray-700"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "stock" ? "Current Stock" : "Movement History"}
            </button>
          ))}
        </div>

        {/* Current Stock Tab */}
        {activeTab === "stock" && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 flex flex-wrap gap-3 items-center">
              <input
                type="text" placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm w-full sm:w-56"
              />
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox" checked={filterLowStock}
                  onChange={(e) => setFilterLowStock(e.target.checked)}
                  className="accent-yellow-400"
                />
                Low stock only
              </label>
              <span className="sm:ml-auto text-gray-500 text-sm">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left px-4 py-3">Product</th>
                    <th className="text-left px-4 py-3">Barcode</th>
                    <th className="text-left px-4 py-3">In Stock</th>
                    <th className="text-left px-4 py-3">Low At</th>
                    <th className="text-left px-4 py-3">Status</th>
                    {user?.role === "admin" && <th className="text-left px-4 py-3">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-500 py-8">No products found.</td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const status = getStockStatus(p);
                      return (
                        <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3 text-gray-400">{p.barcode || "—"}</td>
                          <td className="px-4 py-3 font-bold text-white">{p.quantity}</td>
                          <td className="px-4 py-3 text-gray-400">{p.low_stock_threshold ?? 5}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${status.cls}`}>{status.label}</span>
                          </td>
                          {user?.role === "admin" && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => {
                                  setForm({ product_id: p.id, type: "restock", quantity: 0, note: "" });
                                  setShowForm(true);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="text-blue-400 hover:text-blue-300 text-sm transition"
                              >
                                Adjust
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Movement History Tab */}
        {activeTab === "movements" && (
          <div className="bg-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-700">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Qty</th>
                  <th className="text-left px-4 py-3">Note</th>
                  <th className="text-left px-4 py-3">By</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-8">No movements recorded yet.</td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                      <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString("en-NG", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">{m.product_name}</td>
                      <td className="px-4 py-3">
                        <span className={`capitalize text-sm font-medium ${getMovementColor(m.type)}`}>{m.type}</span>
                      </td>
                      <td className={`px-4 py-3 font-bold ${getMovementColor(m.type)}`}>
                        {getMovementSign(m.type)}{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{m.note || "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{m.created_by}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}