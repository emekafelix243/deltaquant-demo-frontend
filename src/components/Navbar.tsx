// src/components/Navbar.tsx
"use client";

import { useRouter } from "next/navigation";
import { removeToken, removeUser } from "@/lib/auth";

interface NavbarProps {
  username?: string;
  role?: string;
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export default function Navbar({ username, role, onMenuToggle, sidebarOpen }: NavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    removeUser();
    router.push("/login");
  };

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between h-16 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {/* Hamburger — only visible on small screens */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            className="lg:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 shrink-0"
          >
            <span className={`block h-0.5 w-5 bg-gray-300 transition-all duration-200 ${sidebarOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 w-5 bg-gray-300 transition-all duration-200 ${sidebarOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-gray-300 transition-all duration-200 ${sidebarOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="DeltaQuant" className="h-10 w-10 object-contain" />
          <h1 className="text-lg font-bold text-white tracking-tight">
            DeltaQuant
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {username && (
          <span className="hidden sm:block text-gray-400 text-sm">
            {username} · <span className="capitalize">{role}</span>
          </span>
        )}
        <button
          onClick={handleLogout}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-sm transition"
        >
          Logout
        </button>
      </div>
    </header>
  );
}