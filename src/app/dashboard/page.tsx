// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getReports, downloadBackup } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Report } from "@/types";
import AppShell from "@/components/AppShell";

export default function DashboardPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [backupMsg, setBackupMsg] = useState("");

  const loadData = useCallback(() => {
    getReports()
      .then((res) => setReport(res.data))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) { router.push("/login"); return; }
    setUser(currentUser);
    loadData();
  }, [router, loadData]);

  const handleBackup = async () => {
    try {
      const res = await downloadBackup();
      const blob = new Blob([res.data], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `briskpos-backup-${new Date().toISOString().slice(0, 10)}.db`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupMsg("Backup downloaded successfully!");
      setTimeout(() => setBackupMsg(""), 4000);
    } catch {
      setBackupMsg("Backup failed. Please try again.");
      setTimeout(() => setBackupMsg(""), 4000);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white text-xl">Loading...</p>
    </div>
  );

  return (
    <AppShell active="dashboard" username={user?.username} role={user?.role}>
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          {user?.role === "admin" && (
            <button
              onClick={handleBackup}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              💾 Backup Database
            </button>
          )}
        </div>

        {backupMsg && (
          <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${backupMsg.includes("failed") ? "bg-red-600" : "bg-green-600"} text-white`}>
            {backupMsg}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-xl">
            <p className="text-gray-400 text-xs sm:text-sm">Today&apos;s Sales</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-400">{report?.daily.sales_count}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl">
            <p className="text-gray-400 text-xs sm:text-sm">Today&apos;s Revenue</p>
            <p className="text-xl sm:text-3xl font-bold text-green-400 break-all">₦{report?.daily.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl">
            <p className="text-gray-400 text-xs sm:text-sm">Monthly Revenue</p>
            <p className="text-xl sm:text-3xl font-bold text-yellow-400 break-all">₦{report?.monthly.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-xl">
            <p className="text-gray-400 text-xs sm:text-sm">Total Sales</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-400">{report?.all_time.total_sales}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-gray-700">
                <th className="text-left py-2">Product</th>
                <th className="text-left py-2">Units Sold</th>
                <th className="text-left py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {report?.top_products.map((p, i) => (
                <tr key={i} className="border-b border-gray-700 hover:bg-gray-700 transition">
                  <td className="py-3">{p.name}</td>
                  <td className="py-3">{p.total_sold}</td>
                  <td className="py-3 text-green-400">₦{p.total_revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}