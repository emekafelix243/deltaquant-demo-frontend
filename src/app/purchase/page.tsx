// src/app/purchase/page.tsx
"use client";

import { useState } from "react";
import { initializePayment } from "@/lib/api";

export default function PurchasePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBuy = async () => {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await initializePayment(email);
      window.location.href = response.data.authorization_url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBuy();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center gap-3 mb-3">
            <img
              src="/logo.png"
              alt="DeltaQuant"
              className="w-24 h-24 object-contain"
            />
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              DeltaQuant POS
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Get the full desktop app — one-time payment, no subscription.
          </p>
        </div>

        <div className="bg-gray-700 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-gray-300">DeltaQuant POS — Lifetime License</span>
            <span className="text-2xl font-bold text-green-400">₦50,000</span>
          </div>
          <ul className="text-gray-400 text-sm space-y-1 mt-3">
            <li>✓ Full offline desktop app</li>
            <li>✓ Sales, inventory, products, users, reports</li>
            <li>✓ One-time payment, yours forever</li>
            <li>✓ Free updates</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              autoFocus
            />
          </div>

          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-200 disabled:opacity-50"
          >
            {loading ? "Redirecting to payment..." : "Buy Now — ₦50,000"}
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Secured by Paystack · DeltaQuant Solutions
        </p>
      </div>
    </div>
  );
}