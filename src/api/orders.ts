// Đơn hàng — khớp BE OrderResponse (docs/api.md). Dùng chung enum trạng thái từ domain (không hard-code chuỗi).
import { api } from './client';
import { OrderStatus } from '../domain/status';

export interface QuoteItem {
  id: string;
  lineNo: number;
  itemType: 'LABOR' | 'PART' | 'SURCHARGE' | 'DISCOUNT' | 'SUPPORT' | 'TRAVEL';
  description: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  serviceId?: string | null;
}
export interface Quote {
  id: string;
  orderId: string;
  revisionNo: number;
  quoteType: 'INITIAL' | 'ADDITIONAL';
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'DECLINED' | 'SUPERSEDED' | 'EXPIRED';
  callOutFeeAmount: number;
  laborAmount: number;
  travelAmount: number;
  partsAmount: number;
  surchargeAmount: number;
  discountAmount: number;
  totalAmount: number;
  sentAt?: string | null;
  items: QuoteItem[];
}
export interface OrderPartner {
  id: string;
  fullName: string | null;
  phone: string | null;
  lat?: number | null;
  lng?: number | null;
  acceptedAt?: string | null;
  arrivedAt?: string | null;
}
export interface Order {
  id: string;
  orderCode: string;
  status: OrderStatus;
  serviceId: string;
  serviceName: string;
  extraServiceIds: string[];
  addressText: string;
  note?: string | null;
  photoUrls: string[];
  contactName?: string | null;
  contactPhone?: string | null;
  lat: number;
  lng: number;
  callOutFee: number;
  travelDistanceKm?: number | null;
  travelFee?: number | null;
  createdAt: string;
  confirmedAt?: string | null;
  completedAt?: string | null;
  partner?: OrderPartner | null;
  quote?: Quote | null;
  payment?: { id: string; amount: number; status: 'PENDING' | 'CONFIRMED' | 'FAILED'; method: string } | null;
  cancellationSource?: string | null;
  cancellationReason?: string | null;
  history: { from: OrderStatus | null; to: OrderStatus; actorType: string; note?: string | null; at: string }[];
}

export interface CreateOrderInput {
  serviceId: string;
  extraServiceIds?: string[];
  addressText: string;
  note?: string;
  photoUrls?: string[];
  lat: number;
  lng: number;
  vehicleDescription?: string;
}

export const createOrder = (input: CreateOrderInput) => api<Order>('/orders', { method: 'POST', body: input });
export const confirmOrder = (id: string) => api<Order>(`/orders/${id}/confirm`, { method: 'POST' });
export const getOrder = (id: string) => api<Order>(`/orders/${id}`);
/** Poll rẻ: chỉ trạng thái + version; tải đơn đầy đủ khi thấy đổi. */
export const getOrderStatus = (id: string) =>
  api<{ id: string; orderCode: string; status: OrderStatus; version: number }>(`/orders/${id}/status`);
export const listMyOrders = () => api<Order[]>('/orders');
export const cancelOrder = (id: string, reason: string) =>
  api<Order>(`/orders/${id}/cancel`, { method: 'POST', body: { reason } });
export const approveQuote = (orderId: string, quoteId: string) =>
  api<Quote>(`/orders/${orderId}/quotes/${quoteId}/approve`, { method: 'POST' });
export const declineQuote = (orderId: string, quoteId: string, reason?: string) =>
  api<Quote>(`/orders/${orderId}/quotes/${quoteId}/decline`, { method: 'POST', body: { reason } });
export const confirmPayment = (orderId: string) =>
  api<Order>(`/orders/${orderId}/payment/confirm`, { method: 'POST' });
export const submitReview = (orderId: string, rating: number, feedback?: string) =>
  api<{ id: string }>(`/orders/${orderId}/review`, { method: 'POST', body: { rating, feedback } });
