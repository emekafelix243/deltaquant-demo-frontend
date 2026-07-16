// frontend/src/app/sales/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getProducts, createSale } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Product } from "@/types";
import AppShell from "@/components/AppShell";

interface CartItem {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
}

interface SaleSuccess {
  saleId: number;
  total: string;
}

export default function SalesPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SaleSuccess | null>(null);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [barcode, setBarcode] = useState("");
  const [barcodeError, setBarcodeError] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showDemoLimitModal, setShowDemoLimitModal] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(() => {
    getProducts().then((res) => setProducts(res.data));
  }, []);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) { router.push("/login"); return; }
    setUser(currentUser);
    loadProducts();
  }, [router, loadProducts]);

  useEffect(() => {
    if (barcodeRef.current) barcodeRef.current.focus();
  }, [products]);

  const addToCart = (product: Product) => {
    const existing = cart.find((i) => i.product_id === product.id);
    if (existing) {
      setCart(cart.map((i) =>
        i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, {
        product_id: product.id, name: product.name,
        quantity: 1, unit_price: product.price,
      }]);
    }
  };

  const removeFromCart = (product_id: number) => {
    setCart(cart.filter((i) => i.product_id !== product_id));
  };

  const updateCartQuantity = (product_id: number, quantity: number) => {
    if (quantity <= 0) { removeFromCart(product_id); return; }
    setCart(cart.map((i) => i.product_id === product_id ? { ...i, quantity } : i));
  };

  const handleBarcodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const scanned = barcode.trim();
    if (!scanned) return;
    const product = products.find((p) => p.barcode === scanned);
    if (!product) {
      setBarcodeError(`No product found for barcode: ${scanned}`);
      setTimeout(() => setBarcodeError(""), 3000);
      setBarcode("");
      return;
    }
    if (product.quantity === 0) {
      setBarcodeError(`${product.name} is out of stock.`);
      setTimeout(() => setBarcodeError(""), 3000);
      setBarcode("");
      return;
    }
    addToCart(product);
    setBarcode("");
    setBarcodeError("");
  };

  const total = cart.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const grandTotal = Math.max(0, total - discount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const saleData = {
        payment_method: paymentMethod, discount,
        items: cart.map((i) => ({
          product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price,
        })),
      };
      const res = await createSale(saleData);
      setSuccess({ saleId: res.data.id, total: grandTotal.toLocaleString() });
      setCart([]);
      setDiscount(0);
      setShowCart(false);
      loadProducts();
      setTimeout(() => setSuccess(null), 10000);
      setTimeout(() => barcodeRef.current?.focus(), 100);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      const status = axiosErr?.response?.status;
      const detail = axiosErr?.response?.data?.detail ?? "";
      if (status === 403 && detail.toLowerCase().includes("demo")) {
        setShowDemoLimitModal(true);
      } else {
        alert("Sale failed. Check stock levels.");
      }
    } finally {
      setLoading(false);
    }
  };

  const cartPanel = (
    <div className="bg-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-xl font-bold">Cart</h2>
        <button
          className="lg:hidden text-gray-400 hover:text-white text-sm"
          onClick={() => setShowCart(false)}
        >
          ✕ Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cart.length === 0 && (
          <p className="text-gray-400 text-center mt-8 text-sm">No items in cart</p>
        )}
        {cart.map((item) => (
          <div key={item.product_id} className="bg-gray-700 p-3 rounded-lg">
            <div className="flex justify-between">
              <p className="font-semibold text-sm">{item.name}</p>
              <button onClick={() => removeFromCart(item.product_id)}
                className="text-red-400 hover:text-red-300 text-xs transition">✕</button>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-400 mt-1">
              <div className="flex items-center gap-1">
                <button onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                  className="bg-gray-600 hover:bg-gray-500 text-white w-6 h-6 rounded text-center leading-6 transition">−</button>
                <span className="text-white w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                  className="bg-gray-600 hover:bg-gray-500 text-white w-6 h-6 rounded text-center leading-6 transition">+</button>
              </div>
              <span className="text-white">₦{(item.quantity * item.unit_price).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-700 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Subtotal</span>
          <span>₦{total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Discount (₦)</span>
          <input
            type="number" min={0} value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="w-24 bg-gray-700 text-white px-2 py-1 rounded text-right"
          />
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-green-400">₦{grandTotal.toLocaleString()}</span>
        </div>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg"
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="transfer">Transfer</option>
        </select>
        <button
          onClick={handleCheckout}
          disabled={loading || cart.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-bold disabled:opacity-50 transition"
        >
          {loading ? "Processing..." : "Checkout"}
        </button>
      </div>
    </div>
  );

  return (
    <AppShell active="sales" username={user?.username} role={user?.role}>
      <div className="flex h-[calc(100vh-64px)]">

        <div className="flex-1 min-w-0 p-4 sm:p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Products</h2>
            <button
              className="lg:hidden relative bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm font-medium transition"
              onClick={() => setShowCart(true)}
            >
              🛒 Cart
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          <div className="mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative flex-1 min-w-0 max-w-sm">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">⌗</span>
                <input
                  ref={barcodeRef}
                  type="text" value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={handleBarcodeSubmit}
                  placeholder="Scan barcode, press Enter..."
                  className="w-full bg-gray-700 text-white pl-9 pr-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <span className="text-gray-500 text-xs hidden sm:block">or click a product below</span>
            </div>
            {barcodeError && <p className="text-red-400 text-sm mt-1">{barcodeError}</p>}
          </div>

          {success !== null && (
            <div className="bg-green-600 text-white p-3 rounded-lg mb-4 flex flex-wrap gap-2 justify-between items-center">
              <span className="text-sm">Sale #{success.saleId} completed! Total: ₦{success.total}</span>
              <button
                onClick={() => router.push("/receipts/" + success!.saleId)}
                className="bg-white text-green-700 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-green-50 transition shrink-0"
              >
                View Receipt
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.quantity === 0}
                className="bg-gray-800 hover:bg-gray-700 p-3 sm:p-4 rounded-xl text-left transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <p className="font-semibold text-sm sm:text-base leading-tight">{product.name}</p>
                <p className="text-green-400 text-base sm:text-lg mt-1">₦{product.price.toLocaleString()}</p>
                <p className="text-gray-400 text-xs mt-0.5">{product.barcode || "No barcode"}</p>
                <p className="text-gray-400 text-xs sm:text-sm">Stock: {product.quantity}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="hidden lg:flex flex-col w-80 border-l border-gray-700 shrink-0">
          {cartPanel}
        </div>

        {showCart && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/60" onClick={() => setShowCart(false)} />
            <div className="w-80 max-w-full h-full flex flex-col">
              {cartPanel}
            </div>
          </div>
        )}
      </div>

      {showDemoLimitModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] px-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-gray-700">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Daily Limit Reached</h3>
            <p className="text-gray-400 text-sm mb-6">
              You&apos;ve used all 10 free demo transactions for today. Get the full desktop app for unlimited sales — no daily limits, fully offline.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => router.push("/purchase")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
              >
                Get Full Version
              </button>
              <button
                onClick={() => setShowDemoLimitModal(false)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-2.5 rounded-lg text-sm transition"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}