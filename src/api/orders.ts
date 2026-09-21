// Đơn hàng — backend cắm vào đây sau. Dùng chung enum trạng thái từ domain (không hard-code chuỗi).
import { api } from './client';
import { OrderStatus } from '../domain/status';

export interface Order {
  id: string;
  status: OrderStatus;
  serviceId: string;
  addressText: string;
  note?: string;
  createdAt: string;
}

export interface CreateOrderInput {
  serviceId: string;
  extraServiceIds?: string[];
  addressText: string;
  note?: string;
  photoUrls?: string[];
}

export const createOrder = (input: CreateOrderInput) =>
  api<Order>('/orders', { method: 'POST', body: input });

export const getOrder = (id: string) => api<Order>(`/orders/${id}`);

export const cancelOrder = (id: string) =>
  api<Order>(`/orders/${id}/cancel`, { method: 'POST' });
