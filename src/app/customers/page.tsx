// frontend/src/app/customers/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCustomers, getCustomer, createCustomer, recordPayment } from "@/lib/api";
import { getUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";

interface Customer {
  id: number;
  name: string;
  phone?: string;
  created_at: string;
  balance: number;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  note?: string;
  created_by?: string;
  created_at: string;
  sale_id?: number;
}

interface CustomerDetail extends Customer {
  transactions: Transaction[];
}

export default function CustomersPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CustomerDetail | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadCustomers = useCallback(() => {
    getCustomers()
      .then((res) => setCustomers(res.data))
      .catch(() => setError("Failed to load customers"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) { router.push("/login"); return; }
    setUser(currentUser);
    loadCustomers();
  }, [router, loadCustomers]);

  const openCustomer = (id: number) => {
    getCustomer(id).then((res) => setSelected(res.data));
  };

  const closeDetail = () => {
    setSelected(null);
    setPaymentAmount("");
    setPaymentNote("");
  };

  const handleCreateCustomer = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createCustomer({ name: newName.trim(), phone: newPhone.trim() || undefined });
      setNewName("");
      setNewPhone("");
      setShowNewCustomer(false);
      loadCustomers();
    } catch {
      setError("Failed to create customer");
    } finally {
      setSaving(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selected) return;
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) {
      setError("Enter a valid payment amount");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await recordPayment(selected.id, { amount, note: paymentNote || undefined });
      setPaymentAmount("");
      setPaymentNote("");
      openCustomer(selected.id);
      loadCustomers();
    } catch {
      setError("Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white text-xl">Loading...</p>
    </div>
  );

  const totalOwed = customers.reduce((sum, c) => sum + c.balance, 0);

  return (
    <AppShell active="customers" username={user?.username} role={user?.role}>
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Customers</h2>
            <p className="text-gray-400 text-sm mt-1">
              Total outstanding: <span className="text-red-400 font-semibold">₦{totalOwed.toLocaleString()}</span>
            </p>
          </div>
          <button
            onClick={() => setShowNewCustomer(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            + New Customer
          </button>
        </div>

        {error && (
          <div className="bg-red-600 text-white px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-gray-400 text-sm border-b border-gray-700">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Phone</th>
                <th className="text-left py-3 px-4">Balance</th>
                <th className="text-left py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                  <td className="py-3 px-4">{c.name}</td>
                  <td className="py-3 px-4 text-gray-400">{c.phone || "—"}</td>
                  <td className={`py-3 px-4 font-semibold ${c.balance > 0 ? "text-red-400" : "text-green-400"}`}>
                    ₦{c.balance.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => openCustomer(c.id)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-8">No customers yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNewCustomer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-700">
            <h3 className="text-lg font-bold mb-4">New Customer</h3>
            <input
              type="text" placeholder="Name" value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg mb-3"
            />
            <input
              type="text" placeholder="Phone (optional)" value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateCustomer}
                disabled={saving || !newName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-2.5 rounded-lg font-semibold disabled:opacity-50 transition"
              >
                {saving ? "Saving..." : "Create"}
              </button>
              <button
                onClick={() => { setShowNewCustomer(false); setNewName(""); setNewPhone(""); }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2.5 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold">{selected.name}</h3>
                <p className="text-gray-400 text-sm">{selected.phone || "No phone"}</p>
              </div>
              <button onClick={closeDetail} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="bg-gray-700 rounded-lg p-4 mb-4">
              <p className="text-gray-400 text-sm">Outstanding Balance</p>
              <p className={`text-2xl font-bold ${selected.balance > 0 ? "text-red-400" : "text-green-400"}`}>
                ₦{selected.balance.toLocaleString()}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-300 mb-2">Record Payment</p>
              <input
                type="number" min={0} placeholder="Amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg mb-2"
              />
              <input
                type="text" placeholder="Note (optional)"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg mb-2"
              />
              <button
                onClick={handleRecordPayment}
                disabled={saving || !paymentAmount}
                className="w-full bg-green-600 hover:bg-green-700 py-2.5 rounded-lg font-semibold disabled:opacity-50 transition"
              >
                {saving ? "Saving..." : "Record Payment"}
              </button>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-300 mb-2">Transaction History</p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {selected.transactions.length === 0 && (
                  <p className="text-gray-400 text-sm">No transactions yet</p>
                )}
                {selected.transactions.map((t) => (
                  <div key={t.id} className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">
                        {t.type === "credit_sale" ? "Credit Sale" : "Payment"}
                        {t.sale_id ? ` #${t.sale_id}` : ""}
                      </p>
                      <p className="text-gray-400 text-xs">{new Date(t.created_at).toLocaleString()}</p>
                      {t.note && <p className="text-gray-500 text-xs">{t.note}</p>}
                    </div>
                    <span className={`font-semibold ${t.type === "credit_sale" ? "text-red-400" : "text-green-400"}`}>
                      {t.type === "credit_sale" ? "+" : "−"}₦{t.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}