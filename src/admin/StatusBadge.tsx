import React from 'react';
import type { OrderStatus } from '../domain/status';

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
