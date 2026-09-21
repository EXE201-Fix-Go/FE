export type ScreenId =
  | 'customer_home'
  | 'customer_confirm_request'
  | 'customer_radar_searching'
  | 'customer_tracking'
  | 'customer_quote_review'
  | 'customer_completed'
  | 'customer_history'
  | 'customer_profile'
  | 'mechanic_dashboard'
  | 'mechanic_navigation'
  | 'mechanic_quote_editor'
  | 'mechanic_quote_create'
  | 'partner_register'
  | 'shop_owner';

export type UserRole = 'customer' | 'mechanic';

/** Đích điều hướng từ màn chọn vai trò. Tác nhân chính: Khách, Thợ độc lập, Tiệm (chủ tiệm / nhân viên). */
export type EntryDestination =
  | 'customer'
  | 'mechanic'
  | 'shop'
  | 'staff'
  | 'register';

export interface ServiceItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  priceDisplay: string;
  badge?: string;
  badgeColor?: 'tertiary' | 'primary' | 'secondary';
  icon: string;
}

export interface MechanicInfo {
  name: string;
  rating: number;
  ratingCount: number;
  completedJobs: number;
  vehicle: string;
  licensePlate: string;
  team: string;
  phone: string;
  avatar: string;
  distance: string;
  eta: string;
}

export interface QuoteItem {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  isLocked?: boolean;
  selected: boolean;
}
