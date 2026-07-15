// src/app/users/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUsers, deleteUser, updateUser, registerUser } from "@/lib/api";
import { getUser } from "@/lib/auth";
import AppShell from "@/components/AppShell";

interface SystemUser {
  id: number;
  username: string;
  role: string;
}

interface UserForm {
  username: string;
  password: string;
  role_id: number;
}

const ROLES = [
  { id: 1, name: "admin" },
  { id: 2, name: "cashier" },
  { id: 3, name: "manager" },
];

const emptyForm: UserForm = { username: "", password: "", role_id: 2 };

interface FormFieldsProps {
  isEdit: boolean;
  form: UserForm;
  setForm: (form: UserForm) => void;
}

// Defined outside UsersPage so it's not recreated (and remounted) on every keystroke.
function FormFields({ isEdit, form, setForm }: FormFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="text-gray-400 text-sm block mb-1">Username</label>
        <input type="text" placeholder="Enter username" value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg" />
      </div>
      <div>
        <label className="text-gray-400 text-sm block mb-1">
          {isEdit ? <>New Password <span className="text-gray-500">(leave blank to keep)</span></> : "Password"}
        </label>
        <input type="password" placeholder={isEdit ? "Enter new password" : "Enter password"} value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg" />
      </div>
      <div>
        <label className="text-gray-400 text-sm block mb-1">Role</label>
        <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: Number(e.target.value) })}
          className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg">
          {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [success, setSuccess] = useState("");

  const loadUsers = useCallback(() => {
    getUsers().then((res) => setUsers(res.data));
  }, []);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push("/login"); return; }
    if (user.role !== "admin") { router.push("/dashboard"); return; }
    setCurrentUser(user);
    loadUsers();
  }, [router, loadUsers]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleCreate = async () => {
    if (!form.username || !form.password) {
      alert("Username and password are required.");
      return;
    }
    setLoading(true);
    try {
      await registerUser(form.username, form.password, form.role_id);
      showSuccess("User created successfully.");
      setShowForm(false);
      setForm(emptyForm);
      loadUsers();
    } catch {
      alert("Failed to create user. Username may already exist.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingUser || !form.username) {
      alert("Username is required.");
      return;
    }
    setLoading(true);
    try {
      await updateUser(editingUser.id, {
        username: form.username,
        password: form.password || "unchanged",
        role_id: form.role_id,
      });
      showSuccess("User updated successfully.");
      setEditingUser(null);
      setForm(emptyForm);
      loadUsers();
    } catch {
      alert("Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteUser(id);
      showSuccess("User deleted.");
      loadUsers();
    } catch {
      alert("Failed to delete user.");
    }
  };

  const openEdit = (u: SystemUser) => {
    setEditingUser(u);
    setForm({ username: u.username, password: "", role_id: ROLES.find((r) => r.name === u.role)?.id ?? 2 });
    setShowForm(false);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-900 text-purple-400";
      case "manager": return "bg-blue-900 text-blue-400";
      case "cashier": return "bg-green-900 text-green-400";
      default: return "bg-gray-700 text-gray-400";
    }
  };

  return (
    <AppShell active="users" username={currentUser?.username} role={currentUser?.role}>
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">User Management</h2>
          <button
            onClick={() => { setShowForm(!showForm); setEditingUser(null); setForm(emptyForm); }}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
          >
            + Add User
          </button>
        </div>

        {success && (
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg mb-4">{success}</div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-gray-800 p-4 sm:p-6 rounded-xl mb-6">
            <h3 className="text-lg font-semibold mb-4">New User</h3>
            <FormFields isEdit={false} form={form} setForm={setForm} />
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={handleCreate} disabled={loading}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg disabled:opacity-50 transition">
                {loading ? "Saving..." : "Save User"}
              </button>
              <button onClick={cancelForm}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition">Cancel</button>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {editingUser && (
          <div className="bg-gray-800 p-4 sm:p-6 rounded-xl mb-6">
            <h3 className="text-lg font-semibold mb-4">
              Edit User — <span className="text-blue-400">{editingUser.username}</span>
            </h3>
            <FormFields isEdit={true} form={form} setForm={setForm} />
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={handleUpdate} disabled={loading}
                className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg disabled:opacity-50 transition">
                {loading ? "Saving..." : "Update User"}
              </button>
              <button onClick={cancelForm}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition">Cancel</button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-sm text-gray-400">{users.length} user{users.length !== 1 ? "s" : ""} registered</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-700">
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Username</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-500 py-8">No users found.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                      <td className="px-4 py-3 text-gray-500">{u.id}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {u.username}
                        {u.username === currentUser?.username && (
                          <span className="ml-2 text-xs text-blue-400">(you)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs capitalize ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button onClick={() => openEdit(u)}
                            className="text-blue-400 hover:text-blue-300 text-sm transition">Edit</button>
                          {u.username !== currentUser?.username && (
                            <button onClick={() => handleDelete(u.id)}
                              className="text-red-400 hover:text-red-300 text-sm transition">Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}