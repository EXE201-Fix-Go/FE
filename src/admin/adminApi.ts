// API trang quản trị. Người dùng (khoá/mở khoá) và duyệt KYC dùng lại endpoint có sẵn của BE;
// overview / partners / orders là 3 endpoint GET chỉ-đọc mới (BE: module/admin/AdminDashboardController).
import { api } from '../api/client';
import type { AppRole } from '../api/auth';
import type { OrderStatus } from '../domain/status';

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type AccountStatus = 'ACTIVE' | 'LOCKED';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminUser {
  id: string;
  fullName: string | null;
  phone: string | null;
  role: 'CUSTOMER' | 'PARTNER' | 'ADMIN';
  appRole: AppRole;
  status: AccountStatus;
  createdAt: string;
  email?: string | null;
}

export interface AdminOverview {
  users: { total: number; customers: number; partners: number; admins: number; locked: number };
  partners: { pending: number; approved: number; rejected: number; onlineApproved: number };
  orders: { total: number; today: number; byStatus: Record<OrderStatus, number> };
  revenue: {
    confirmedTotal: number;
    confirmedToday: number;
    /** null khi DB chưa có cấu hình hoa hồng hiệu lực. */
    commissionRate: number | null;
    estimatedCommission: number | null;
  };
  generatedAt: string;
}

export interface AdminDocument {
  documentType: string;
  reviewStatus: string;
}

export interface AdminPartnerRow {
  userId: string;
  fullName: string | null;
  phone: string | null;
  partnerType: 'INDIVIDUAL' | 'SHOP' | 'SHOP_STAFF';
  shopName: string | null;
  parentShopId: string | null;
  verificationStatus: VerificationStatus;
  availability: 'ONLINE' | 'BUSY' | 'OFFLINE';
  verifiedAt: string | null;
  documents: AdminDocument[];
}

export interface AdminOrderRow {
  id: string;
  orderCode: string;
  status: OrderStatus;
  serviceName: string | null;
  customerName: string | null;
  customerPhone: string | null;
  partnerName: string | null;
  callOutFee: number;
  travelFee: number | null;
  paidAmount: number | null;
  createdAt: string;
  completedAt: string | null;
}

/** Ghép query string, bỏ qua giá trị rỗng. */
function qs(params: Record<string, string | number | undefined | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') u.set(k, String(v));
  }
  const s = u.toString();
  return s ? `?${s}` : '';
}

export const getOverview = () => api<AdminOverview>('/admin/overview');

export const listUsers = (page = 0, size = 20) =>
  api<PageResponse<AdminUser>>(`/admin/users${qs({ page, size })}`);

export const setUserStatus = (id: string, status: AccountStatus) =>
  api<AdminUser>(`/admin/users/${id}/status`, { method: 'PATCH', body: { status } });

export const listPartners = (status: VerificationStatus | undefined, page = 0, size = 20) =>
  api<PageResponse<AdminPartnerRow>>(`/admin/partners${qs({ status, page, size })}`);

export const verifyPartner = (id: string, status: Exclude<VerificationStatus, 'PENDING'>) =>
  api<unknown>(`/admin/partners/${id}/verify`, { method: 'POST', body: { status } });

export const listOrders = (status: OrderStatus | undefined, page = 0, size = 20) =>
  api<PageResponse<AdminOrderRow>>(`/admin/orders${qs({ status, page, size })}`);
