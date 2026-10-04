export type AdminTab = 'overview' | 'users' | 'kyc' | 'orders';

export const ADMIN_TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Tổng quan', icon: 'dashboard' },
  { id: 'users', label: 'Người dùng', icon: 'group' },
  { id: 'kyc', label: 'Duyệt KYC', icon: 'verified_user' },
  { id: 'orders', label: 'Đơn hàng', icon: 'receipt_long' },
];
