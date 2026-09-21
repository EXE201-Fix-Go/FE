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
  itemType: 'LABOR' | 'PART' | 'SURCHARGE' | 'DISCOUNT' | 'SUPPORT';
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
export const acceptOffer = (assignmentId: string) =>
  api<Offer>(`/partner/offers/${assignmentId}/accept`, { method: 'POST' });
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
