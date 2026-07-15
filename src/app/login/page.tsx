// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/api";
import { saveToken, saveUser } from "@/lib/auth";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await loginUser(username, password);
      const token = response.data.access_token;
      saveToken(token);

      const payload = JSON.parse(atob(token.split(".")[1]));
      saveUser({ username, role: payload.role });

      if (payload.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/sales");
      }
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* DeltaQuant Logo */}
        <div className="text-center mb-8">
  <div className="flex flex-col items-center justify-center gap-3 mb-3">
    <Image
      src="/logo.png"
      alt="DeltaQuant"
      width={128}
      height={128}
      priority
      className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
    />

    <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
      DeltaQuant
    </h1>
  </div>
     <p className="text-gray-400 text-sm">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-300 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
              autoFocus
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-200 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          DeltaQuant · Point of Sale System
        </p>
      </div>
    </div>
  );
}