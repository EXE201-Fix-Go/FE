// App Đối tác — hồ sơ, KYC, lời mời (broadcast), thực hiện đơn. Khớp BE docs/api.md.
import { api } from './client';
import { Order, Quote } from './orders';
import { OrderStatus } from '../domain/status';

export interface PartnerProfile {
  userId: string;
  fullName: string | null;
  phone: string | null;
  partnerType: 'INDIVIDUAL' | 'SHOP' | 'SHOP_STAFF';
  shopName?: string | null;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  availability: 'ONLINE' | 'BUSY' | 'OFFLINE';
  serviceCodes: string[];
  /** Giấy tờ KYC đã nộp (loại + trạng thái đối chiếu); không có ảnh. */
  documents?: { id: string; documentType: string; reviewStatus: string }[];
}
export interface RegisterPartnerInput {
  fullName: string;
  partnerType: 'INDIVIDUAL' | 'SHOP';
  shopName?: string;
  serviceCodes: string[];
  documents: { documentType: 'ID_FRONT' | 'ID_BACK' | 'SELFIE' | 'LICENSE' | 'OTHER'; storageKey: string }[];
}
export interface Offer {
  assignmentId: string;
  orderId: string;
  orderCode: string;
  orderStatus: OrderStatus;
  serviceId: string;
  serviceName: string;
  addressText: string;
  note?: string | null;
  lat: number;
  lng: number;
  callOutFee: number;
  contactName?: string | null;
  offeredAt: string;
  expiresAt?: string | null;
  roundNo: number;
  photoUrls?: string[];
}
export interface Staff {
  userId: string;
  fullName: string | null;
  phone: string | null;
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  availability: 'ONLINE' | 'BUSY' | 'OFFLINE';
}
export interface QuoteLineInput {
  itemType: 'LABOR' | 'PART' | 'SURCHARGE' | 'DISCOUNT' | 'SUPPORT' | 'TRAVEL';
  description: string;
  quantity: number;
  unitPrice: number;
  serviceId?: string;
}

export const registerPartner = (input: RegisterPartnerInput) =>
  api<PartnerProfile>('/partner-registration', { method: 'POST', body: input });
export const getPartnerMe = () => api<PartnerProfile>('/partner/me');
export interface PartnerStats {
  completedToday: number;
  earnedToday: number;
  completedTotal: number;
  averageRating: number | null;
  reviewCount: number;
  activeJobs: number;
}
export const getPartnerStats = () => api<PartnerStats>('/partner/stats');
export interface PartnerDashboard {
  profile: PartnerProfile;
  offers: Offer[];
  jobs: Offer[];
  stats: PartnerStats;
}
/** Một request cho cả màn dashboard (hồ sơ + lời mời + đơn đang làm + thống kê). */
export const getPartnerDashboard = () => api<PartnerDashboard>('/partner/dashboard');
export const updatePresence = (availability: PartnerProfile['availability'], lat?: number, lng?: number) =>
  api<PartnerProfile>('/partner/me/presence', { method: 'PATCH', body: { availability, lat, lng } });

export const listOffers = () => api<Offer[]>('/partner/offers');
export const listJobs = () => api<Offer[]>('/partner/jobs');
/** Nhận đơn; kèm toạ độ GPS hiện tại của thợ (nếu có) để backend tính phí di chuyển từ đó. */
export const acceptOffer = (assignmentId: string, coords?: { lat: number; lng: number }) =>
  api<Offer>(`/partner/offers/${assignmentId}/accept`, {
    method: 'POST',
    body: coords ? { lat: coords.lat, lng: coords.lng } : undefined,
  });
export const declineOffer = (assignmentId: string, reason?: string) =>
  api<void>(`/partner/offers/${assignmentId}/decline`, { method: 'POST', body: { reason } });

export const arriveAtOrder = (orderId: string) => api<Order>(`/orders/${orderId}/arrive`, { method: 'POST' });
export const startChecking = (orderId: string) => api<Order>(`/orders/${orderId}/check`, { method: 'POST' });
export const sendQuote = (orderId: string, items: QuoteLineInput[]) =>
  api<Quote>(`/orders/${orderId}/quotes`, { method: 'POST', body: { items } });
export const completeOrder = (orderId: string) => api<Order>(`/orders/${orderId}/complete`, { method: 'POST' });

export const listStaff = () => api<Staff[]>('/partner/shop/staff');
export const inviteStaff = (phone: string, fullName: string) =>
  api<Staff[]>('/partner/shop/staff', { method: 'POST', body: { phone, fullName } });

/** Thợ rút khỏi đơn đã nhận trước khi tới nơi: đơn được phát lại cho thợ khác, khách không bị huỷ (BE: ASSIGNED → REQUESTED). */
export const withdrawOrder = (orderId: string, reason?: string) =>
  api<void>(`/orders/${orderId}/withdraw`, { method: 'POST', body: reason ? { reason } : undefined });

/** Gửi vị trí định kỳ khi đang trực. Chỉ đổi vị trí, không đổi ONLINE/BUSY (khác updatePresence). */
export const updateLocation = (lat: number, lng: number) =>
  api<void>('/partner/me/location', { method: 'PUT', body: { lat, lng } });

/** Nộp / nộp lại bộ giấy tờ KYC cho hồ sơ đối tác đã có (thợ vào tiệm qua lời mời, hoặc thợ bị từ chối) → hồ sơ về PENDING. */
export const submitPartnerDocuments = (documents: RegisterPartnerInput['documents']) =>
  api<PartnerProfile>('/partner/me/documents', { method: 'PUT', body: { documents } });
