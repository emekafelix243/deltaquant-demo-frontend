// frontend/src/app/settings/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrganizationSettings, updateOrganizationSettings } from "@/lib/api";
import { getUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ business_name: "", address: "", phone: "" });

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) { router.push("/login"); return; }
    if (currentUser.role !== "admin") { router.push("/dashboard"); return; }
    setUser(currentUser);
    getOrganizationSettings().then((res) => setForm(res.data)).finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateOrganizationSettings(form);
      setSuccess("Business details updated successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      alert("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (<div className="min-h-screen bg-gray-900 flex items-center justify-center"><p className="text-white text-xl">Loading...</p></div>);

  return (
    <AppShell active="settings" username={user?.username} role={user?.role}>
      <div className="p-4 sm:p-6 max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Business Settings</h2>
        <p className="text-gray-400 text-sm mb-6">These details appear on every printed receipt.</p>
        {success && (<div className="bg-green-600 text-white px-4 py-3 rounded-lg mb-4">{success}</div>)}
        <div className="bg-gray-800 p-4 sm:p-6 rounded-xl space-y-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Business Name</label>
            <input type="text" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} placeholder="e.g. Adaeze Stores" className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Address</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="e.g. 12 Market Road, Ikeja, Lagos" className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg" />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">Phone Number</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 08012345678" className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg" />
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition">{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    </AppShell>
  );
}
