// src/components/Sidebar.tsx
"use client";

interface SidebarProps {
  active: "dashboard" | "products" | "inventory" | "sales" | "customers" | "reports" | "users";
  role?: string;
  open?: boolean;
  onClose?: () => void;
}

const links = [
  { href: "/dashboard", icon: "📊", label: "Dashboard", key: "dashboard" },
  { href: "/products", icon: "📦", label: "Products", key: "products" },
  { href: "/inventory", icon: "🗃️", label: "Inventory", key: "inventory" },
  { href: "/sales", icon: "🛒", label: "Sales", key: "sales" },
  { href: "/customers", icon: "🧾", label: "Customers", key: "customers" },
  { href: "/reports", icon: "📈", label: "Reports", key: "reports" },
];
export default function Sidebar({ active, role, open, onClose }: SidebarProps) {
  const navContent = (
    <nav className="space-y-1 p-4">
      {links.map((link) => (
        <a key={link.key} href={link.href} onClick={onClose} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm font-medium ${active === link.key ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}>
          <span className="text-xl leading-none">{link.icon}</span>
          <span>{link.label}</span>
        </a>
      ))}
      {role === "admin" && (
        <a href="/users" onClick={onClose} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm font-medium ${active === "users" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}>
          <span className="text-xl leading-none">👥</span>
          <span>Users</span>
        </a>
      )}
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-56 bg-gray-800 min-h-[calc(100vh-64px)] shrink-0 border-r border-gray-700">
        {navContent}
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`lg:hidden fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-gray-800 border-r border-gray-700 z-40 transform transition-transform duration-250 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {navContent}
      </aside>
    </>
  );
}