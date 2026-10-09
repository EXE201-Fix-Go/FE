// Danh mục dịch vụ + mức phí đang áp dụng — đọc từ BE (RB-23: không hard-code giá/phí ở client).
import { api } from './client';

export interface ApiService {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

/** Mức phí hiện hành; trường null = backend chưa cấu hình, UI không được tự đoán. */
export interface Pricing {
  callOutFee: number | null;
  travelPerKm: number | null;
  travelFreeKm: number | null;
}

export const listServices = () => api<ApiService[]>('/services', { auth: false });
export const getPricing = () => api<Pricing>('/pricing', { auth: false });
