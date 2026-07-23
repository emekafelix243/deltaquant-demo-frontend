// frontend/src/app/receipts/[saleId]/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getReceipt } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Receipt } from "@/types";
import Image from "next/image";

export default function ReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const saleId = params?.saleId;
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  const loadReceipt = useCallback(() => {
    if (saleId) {
      getReceipt(Number(saleId))
        .then((res) => setReceipt(res.data))
        .catch(() => alert("Receipt not found."))
        .finally(() => setLoading(false));
    }
  }, [saleId]);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) { router.push("/login"); return; }
    setUser(currentUser);
    loadReceipt();
  }, [router, loadReceipt]);

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white text-xl">Loading receipt...</p>
    </div>
  );

  if (!receipt) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white text-xl">Receipt not found.</p>
    </div>
  );

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .receipt-card {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          table { border-collapse: collapse !important; width: 100% !important; }
          td, th { border: 1px solid #000 !important; }
        }
      `}</style>

      {/* Navbar */}
      <div className="no-print bg-gray-800 px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="DeltaQuant" className="h-9 w-9 object-contain" />
          <h1 className="text-lg font-bold text-white tracking-tight">DeltaQuant</h1>
        </div>
        {user && (
          <span className="hidden sm:block text-gray-400 text-sm">{user.username} · {user.role}</span>
        )}
      </div>

      <div className="min-h-screen bg-gray-900 flex flex-col items-center py-6 px-4">
        {/* Action Buttons */}
        <div className="no-print w-full max-w-2xl flex gap-2 mb-4">
          <button onClick={handlePrint}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition text-sm">
            🖨 Print Receipt
          </button>
          <button onClick={() => router.push("/sales")}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg transition text-sm">
            ← Back to Sales
          </button>
        </div>

        {/* Receipt Card */}
        <div className="receipt-card bg-white text-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl p-6">

          {/* Header — Logo + Shop Info */}
          <div className="flex items-center justify-between mb-4">
            <Image
              src="/logo.png"
              alt="DeltaQuant"
              width={72}
              height={72}
              className="object-contain"
            />
            <div className="text-right">
              <h1 className="text-lg font-bold uppercase">Delta Quant Solutions</h1>
              <p className="text-gray-500 text-xs">53 Afolabi Obey Street, Ejigbo, Lagos</p>
              <p className="text-gray-500 text-xs">Tel: 08038882485, 08168424165</p>
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-600 mt-1">Official Receipt</p>
            </div>
          </div>

          <div className="border-t-2 border-gray-800 mb-4"></div>

          {/* Receipt Info Table */}
          <table className="w-full text-sm mb-4" style={{ borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td className="font-semibold text-gray-600 py-1.5 px-3 border border-gray-300 bg-gray-50 w-1/3">Receipt No</td>
                <td className="py-1.5 px-3 border border-gray-300 font-medium">{receipt.id}</td>
              </tr>
              <tr>
                <td className="font-semibold text-gray-600 py-1.5 px-3 border border-gray-300 bg-gray-50">Sales No</td>
                <td className="py-1.5 px-3 border border-gray-300 font-medium">{receipt.sale_id}</td>
              </tr>
              <tr>
                <td className="font-semibold text-gray-600 py-1.5 px-3 border border-gray-300 bg-gray-50">Date</td>
                <td className="py-1.5 px-3 border border-gray-300 font-medium">
                  {new Date(receipt.generated_at).toLocaleDateString("en-NG", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </td>
              </tr>
              <tr>
                <td className="font-semibold text-gray-600 py-1.5 px-3 border border-gray-300 bg-gray-50">Cashier</td>
                <td className="py-1.5 px-3 border border-gray-300 font-medium">{user?.username ?? "—"}</td>
              </tr>
              <tr>
                <td className="font-semibold text-gray-600 py-1.5 px-3 border border-gray-300 bg-gray-50">Payment</td>
                <td className="py-1.5 px-3 border border-gray-300 font-medium capitalize">{receipt.payment_method}</td>
              </tr>
              {receipt.payment_method === "credit" && receipt.customer_name && (
                <tr>
                  <td className="font-semibold text-gray-600 py-1.5 px-3 border border-gray-300 bg-gray-50">Customer</td>
                  <td className="py-1.5 px-3 border border-gray-300 font-medium">{receipt.customer_name}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Items Table */}
          <table className="w-full text-sm mb-4" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="text-left py-2 px-3 border border-gray-700 font-semibold">Item</th>
                <th className="text-center py-2 px-3 border border-gray-700 font-semibold">Qty</th>
                <th className="text-right py-2 px-3 border border-gray-700 font-semibold">Unit Price (₦)</th>
                <th className="text-right py-2 px-3 border border-gray-700 font-semibold">Subtotal (₦)</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items && receipt.items.length > 0 ? (
                receipt.items.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="py-2 px-3 border border-gray-300 font-medium">{item.product_name}</td>
                    <td className="py-2 px-3 border border-gray-300 text-center">{item.quantity}</td>
                    <td className="py-2 px-3 border border-gray-300 text-right">{item.unit_price.toLocaleString()}</td>
                    <td className="py-2 px-3 border border-gray-300 text-right font-semibold">{item.subtotal.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-3 px-3 border border-gray-300 text-center text-gray-400 text-xs">
                    Item details not available
                  </td>
                </tr>
              )}
              {/* Total Row */}
              <tr className="bg-gray-800 text-white font-bold">
                <td colSpan={3} className="py-2 px-3 border border-gray-700 text-right text-base">TOTAL</td>
                <td className="py-2 px-3 border border-gray-700 text-right text-base">₦{receipt.total_amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-300">
            <p className="text-gray-500 text-xs">Thank you for your purchase!</p>
            <p className="text-gray-400 text-xs mt-1">Powered by DeltaQuant</p>
          </div>
        </div>
      </div>
    </>
  );
}