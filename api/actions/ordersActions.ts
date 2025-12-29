import { apiRequest } from "api/clients";

// Types
export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
  unit: string;
}

export interface CreateOrderPayload {
  customerId: number;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes?: string;
}

export interface UpdateOrderPayload extends CreateOrderPayload {
  orderId: number;
}

export interface Customer {
  id: number;
  businessName: string;
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  creditLimit?: number;
  paymentTerms?: string;
  businessType: string;
  status: string;
}

export interface Product {
  id: number;
  name: string;
  purchase: number;
  selling: number;
  unit: string;
  status: string;
  category?: string;
}

export interface Order {
  id: number;
  customerId: number;
  customer?: Customer;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Fetch all products
export const fetchProducts = async (): Promise<{ success: boolean; data: Product[] }> => {
  const response = await apiRequest("/products", "GET");
  return response.data;
};

// Fetch single order by ID
export const fetchOrderById = async (orderId: number): Promise<{ success: boolean; data: Order }> => {
  const response = await apiRequest(`/orders/${orderId}`, "GET");
  return response.data;
};

// Create new order
export const createOrder = async (payload: CreateOrderPayload): Promise<{ success: boolean; data: Order }> => {
  // const response = await apiRequest("/vendor-orders", "POST", payload);
  console.log(payload);
  // return response.data;
};

// Update existing order
export const updateOrder = async (payload: UpdateOrderPayload): Promise<{ success: boolean; data: Order }> => {
  const { orderId, ...data } = payload;
  const response = await apiRequest(`/orders/${orderId}`, "PUT", data);
  return response.data;
};

// Delete order
export const deleteOrder = async (orderId: number): Promise<{ success: boolean }> => {
  const response = await apiRequest(`/orders/${orderId}`, "DELETE");
  return response.data;
};