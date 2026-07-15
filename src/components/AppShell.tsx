// src/components/AppShell.tsx
"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

type ActivePage = "dashboard" | "products" | "inventory" | "sales" | "reports" | "users";

interface AppShellProps {
  active: ActivePage;
  username?: string;
  role?: string;
  children: React.ReactNode;
}

export default function AppShell({ active, username, role, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          {children}
        </main>
      </div>
    </div>
  );
}