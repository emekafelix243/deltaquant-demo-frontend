// src/components/AppShell.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { getDemoStatus } from "@/lib/api";

type ActivePage = "dashboard" | "products" | "inventory" | "sales" | "reports" | "users";

interface AppShellProps {
  active: ActivePage;
  username?: string;
  role?: string;
  children: React.ReactNode;
}

interface DemoStatus {
  enabled: boolean;
  used: number;
  limit: number;
  remaining: number | null;
}

export default function AppShell({ active, username, role, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null);

  useEffect(() => {
    getDemoStatus()
      .then((res) => setDemoStatus(res.data))
      .catch(() => setDemoStatus(null));
  }, []);

  const limitReached = demoStatus?.enabled && demoStatus.remaining === 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar
        username={username}
        role={role}
        onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex">
        <Sidebar
          active={active}
          role={role}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 min-w-0">
          {demoStatus?.enabled && (
            <div className={`px-4 sm:px-6 py-3 border-b ${limitReached ? "bg-red-900/40 border-red-700" : "bg-gray-800 border-gray-700"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 text-sm">
                    <span>🛒</span>
                    <span className="text-gray-300">
                      Demo Transactions{" "}
                      <span className="font-semibold text-white">
                        {demoStatus.used} / {demoStatus.limit} used
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full ${limitReached ? "bg-red-500" : "bg-blue-500"}`}
                      style={{ width: `${Math.min(100, (demoStatus.used / demoStatus.limit) * 100)}%` }}
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    {limitReached
                      ? "Daily demo limit reached — resets at midnight"
                      : `${demoStatus.remaining} transaction${demoStatus.remaining === 1 ? "" : "s"} remaining today · Resets at midnight`}
                  </p>
                </div>
                <Link
                  href="/purchase"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shrink-0"
                >
                  Get Full Version
                </Link>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}