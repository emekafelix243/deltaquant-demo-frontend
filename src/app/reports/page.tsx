// frontend/src/app/reports/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getReports, getSales } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Report } from "@/types";
import AppShell from "@/components/AppShell";

interface Sale {
  id: number;
  total_amount: number;
  discount: number;
  payment_method: string;
  created_at: string;
  created_by: string;
  items_count: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "sales">("overview");

  const loadData = useCallback(() => {
    Promise.all([
      getReports().then((res) => setReport(res.data)),
      getSales().then((res) => setSales(res.data)),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) { router.push("/login"); return; }
    setUser(currentUser);
    loadData();
  }, [router, loadData]);

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case "cash": return "bg-green-900 text-green-400";
      case "card": return "bg-blue-900 text-blue-400";
      case "transfer": return "bg-purple-900 text-purple-400";
      default: return "bg-gray-700 text-gray-400";
    }
  };

  const exportSalesCSV = () => {
    const headers = ["Sale #", "Date", "Amount", "Discount", "Payment", "Cashier"];
    const rows = sales.map((s) => [
      `#${s.id}`,
      new Date(s.created_at).toLocaleDateString("en-NG"),
      s.total_amount, s.discount, s.payment_method, s.created_by,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `briskpos-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportProductsCSV = () => {
    const headers = ["#", "Product", "Units Sold", "Revenue"];
    const rows = (report?.top_products ?? []).map((p, i) => [i + 1, p.name, p.total_sold, p.total_revenue]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `briskpos-top-products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white text-xl">Loading...</p>
    </div>
  );

  return (
    <AppShell active="reports" username={user?.username} role={user?.role}>
      <div className="p-4 sm:p-6">
        <h2 className="text-2xl font-bold mb-6">Reports</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-xl">
            <p className="text-gray-400 text-xs sm:text-sm">Today&apos;s Sales</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-400">{report?.daily.sales_count}</p>
            <p className="text-gray-500 text-xs mt-1">transactions</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl">
            <p className="text-gray-400 text-xs sm:text-sm">Today&apos;s Revenue</p>
            <p className="text-xl sm:text-3xl font-bold text-green-400 break-all">₦{report?.daily.revenue.toLocaleString()}</p>
            <p className="text-gray-500 text-xs mt-1">today</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl">
            <p className="text-gray-400 text-xs sm:text-sm">Monthly Revenue</p>
            <p className="text-xl sm:text-3xl font-bold text-yellow-400 break-all">₦{report?.monthly.revenue.toLocaleString()}</p>
            <p className="text-gray-500 text-xs mt-1">this month</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl">
            <p className="text-gray-400 text-xs sm:text-sm">All-Time Sales</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-400">{report?.all_time.total_sales}</p>
            <p className="text-gray-500 text-xs mt-1">total transactions</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 border-b border-gray-700">
          {(["overview", "sales"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                activeTab === tab
                  ? "bg-gray-800 text-white border border-b-0 border-gray-700"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab === "overview" ? "Top Products" : "Sales History"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 flex flex-wrap gap-3 justify-between items-center">
              <p className="text-sm text-gray-400">Best performing products by units sold and revenue</p>
              <button onClick={exportProductsCSV}
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg text-sm transition">
                ⬇ Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left px-4 py-3">#</th>
                    <th className="text-left px-4 py-3">Product</th>
                    <th className="text-left px-4 py-3">Units Sold</th>
                    <th className="text-left px-4 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {!report?.top_products.length ? (
                    <tr><td colSpan={4} className="text-center text-gray-500 py-8">No data yet.</td></tr>
                  ) : (
                    report.top_products.map((p, i) => (
                      <tr key={i} className="border-b border-gray-700 hover:bg-gray-700 transition">
                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                        <td className="px-4 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-blue-400">{p.total_sold}</td>
                        <td className="px-4 py-3 text-green-400">₦{p.total_revenue.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-700 flex flex-wrap gap-3 justify-between items-center">
              <p className="text-sm text-gray-400">{sales.length} total transaction{sales.length !== 1 ? "s" : ""}</p>
              <button onClick={exportSalesCSV}
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg text-sm transition">
                ⬇ Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-700">
                    <th className="text-left px-4 py-3">Sale #</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Amount</th>
                    <th className="text-left px-4 py-3">Discount</th>
                    <th className="text-left px-4 py-3">Payment</th>
                    <th className="text-left px-4 py-3">By</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-gray-500 py-8">No sales recorded yet.</td></tr>
                  ) : (
                    sales.map((s) => (
                      <tr key={s.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                        <td className="px-4 py-3 text-gray-400">#{s.id}</td>
                        <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString("en-NG", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 text-green-400 font-bold">₦{s.total_amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-yellow-400">
                          {s.discount > 0 ? `₦${s.discount.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs capitalize ${getPaymentBadge(s.payment_method)}`}>
                            {s.payment_method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">{s.created_by}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}