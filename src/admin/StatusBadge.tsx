import React from 'react';
import { ORDER_STATUS_LABEL, OrderStatus } from '../domain/status';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-container text-on-surface',
  success: 'bg-tertiary-fixed text-tertiary',
  warning: 'bg-primary-fixed text-primary',
  danger: 'bg-error-container text-error',
  info: 'bg-secondary-container text-secondary',
};

export const StatusBadge: React.FC<{ tone?: Tone; children: React.ReactNode }> = ({ tone = 'neutral', children }) => (
  <span
    className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 font-label-sm text-[11px] font-bold ${TONES[tone]}`}
  >
    {children}
  </span>
);

/**
 * Nhãn cho góc nhìn quản trị. ORDER_STATUS_LABEL được viết cho khách ("Chờ bạn duyệt giá"), nên với admin
 * những nhãn xưng "bạn" phải nói rõ chủ thể là khách.
 */
export function adminOrderLabel(status: OrderStatus): string {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return 'Chờ khách xác nhận';
    case 'WAITING_FOR_APPROVAL':
      return 'Chờ khách duyệt giá';
    default:
      return ORDER_STATUS_LABEL[status] ?? status;
  }
}

/** Màu theo ý nghĩa nghiệp vụ của trạng thái đơn (14 giá trị, ERD §7.1). */
export function orderTone(status: OrderStatus): Tone {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
    case 'NO_PARTNER_FOUND':
      return 'danger';
    case 'EXPIRED':
      return 'neutral';
    case 'PENDING_CONFIRMATION':
    case 'REQUESTED':
    case 'WAITING_FOR_APPROVAL':
    case 'ADDITIONAL_QUOTE':
    case 'PAUSED':
      return 'warning';
    default:
      return 'info';
  }
}
