// Lời mời vào tiệm (AUTHZ §6.3, BE docs/api.md "Nhân viên tiệm — lời mời"). Chủ tiệm chỉ MỜI; tài khoản người được mời
// chỉ đổi khi chính họ chấp nhận.
import { api } from './client';
import type { PartnerProfile } from './partner';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';

export interface Invitation {
  id: string;
  shopId: string;
  shopName: string | null;
  inviteePhone: string;
  inviteeName: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
}

// Người được mời (khách hoặc thợ cá nhân)
export const listMyInvitations = () => api<Invitation[]>('/invitations');
export const acceptInvitation = (id: string) => api<PartnerProfile>(`/invitations/${id}/accept`, { method: 'POST' });
export const declineInvitation = (id: string) => api<void>(`/invitations/${id}/decline`, { method: 'POST' });

// Chủ tiệm
export const listShopInvitations = () => api<Invitation[]>('/partner/shop/invitations');
export const cancelShopInvitation = (id: string) => api<void>(`/partner/shop/invitations/${id}`, { method: 'DELETE' });
export const removeShopStaff = (userId: string) => api<void>(`/partner/shop/staff/${userId}`, { method: 'DELETE' });

// Nhân viên tự rời tiệm
export const leaveShop = () => api<void>('/partner/shop/leave', { method: 'POST' });
