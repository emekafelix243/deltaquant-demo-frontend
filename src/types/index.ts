// src/types/index.ts

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  barcode?: string;
  price: number;
  cost_price: number;
  is_active: boolean;
  quantity?: number;
  low_stock_threshold?: number;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  low_stock_threshold: number;
  last_restock_date?: string;
  next_restock_date?: string;
}

export interface SaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number; // fixed: added unit_price to SaleItem
  subtotal: number;
}

export interface Sale {
  id: number;
  cashier_id: number;
  payment_method: string;
  discount: number;
  total_amount: number;
  created_at: string;
  items: SaleItem[];
}

// Dedicated ReceiptItem type (matches what the API actually returns)

export interface ReceiptItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// Fixed Receipt type — uses ReceiptItem, not SaleItem
export interface Receipt {
  id: number;
  sale_id: number;
  total_amount: number;
  payment_method: string;
  generated_at: string;
  items: ReceiptItem[];
  cashier: string;
  customer_name?: string;
}

export interface Report {
  user: string;
  role: string;
  daily: {
    sales_count: number;
    revenue: number;
  };
  monthly: {
    revenue: number;
  };
  all_time: {
    total_sales: number;
    total_revenue: number;
  };
  top_products: {
    name: string;
    total_sold: number;
    total_revenue: number;
  }[];
}
