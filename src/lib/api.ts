// src/lib/api.ts
import axios from "axios";
import { getToken } from "@/lib/auth";

const API_BASE_URL = "https://deltaquant-demo-backend.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Users
export const getUsers = () => api.get("/users/");
export const deleteUser = (id: number) => api.delete(`/users/${id}`);
export const updateUser = (id: number, data: object) => api.put(`/users/${id}`, data);

// Auth
export const loginUser = (username: string, password: string) =>
  api.post("/auth/login", new URLSearchParams({ username, password }), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

export const registerUser = (username: string, password: string, role_id: number) =>
  api.post("/auth/register", { username, password, role_id });

// Products
export const getProducts = (search?: string) =>
  api.get("/products/", { params: search ? { search } : {} });
export const createProduct = (data: object) => api.post("/products/", data);
export const updateProduct = (id: number, data: object) => api.put(`/products/${id}`, data);
export const deleteProduct = (id: number) => api.delete(`/products/${id}`);

// Inventory
export const getInventory = () => api.get("/inventory/");
export const getLowStock = () => api.get("/inventory/low-stock");
export const adjustStock = (data: object) => api.post("/inventory/adjust", data);

// Sales
export const createSale = (data: object) => api.post("/sales/", data);
export const getSales = () => api.get("/sales/");
export const getSale = (id: number) => api.get(`/sales/${id}`);

// Customers / Credit
export const getCustomers = () => api.get("/customers/");
export const createCustomer = (data: { name: string; phone?: string }) =>
  api.post("/customers/", data);
export const getCustomer = (id: number) => api.get(`/customers/${id}`);
export const recordPayment = (id: number, data: { amount: number; note?: string }) =>
  api.post(`/customers/${id}/payments`, data);

// Receipts
export const getReceipt = (saleId: number) => api.get(`/receipts/${saleId}`);

// Reports
export const getReports = () => api.get("/reports/reports");

// Backup — uses axios instance so auth header is included automatically
export const downloadBackup = () =>
  api.get("/admin/backup", { responseType: "blob" });

// Payments
export const initializePayment = (email: string) =>
  api.post("/payments/initialize", { email });

export const verifyOrder = (reference: string) =>
  api.get(`/payments/verify/${reference}`);

export const getDemoStatus = () => api.get("/sales/demo-status");

export default api;