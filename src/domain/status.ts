// Trạng thái đơn hàng — BẢN SAO BẮT BUỘC từ ERD §7.1 (đủ 14 giá trị).
// Quy tắc (CLAUDE.md): SCREAMING_SNAKE_CASE, KHÔNG tự đặt tên khác, KHÔNG viết tắt,
// KHÔNG dịch sang tiếng Việt trong mã nguồn. Nhãn tiếng Việt để ở tầng hiển thị bên dưới.
export const ORDER_STATUS = {
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  REQUESTED: 'REQUESTED',
  ASSIGNED: 'ASSIGNED',
  ARRIVED: 'ARRIVED',
  CHECKING: 'CHECKING',
  WAITING_FOR_APPROVAL: 'WAITING_FOR_APPROVAL',
  APPROVED: 'APPROVED',
  IN_PROGRESS: 'IN_PROGRESS',
  ADDITIONAL_QUOTE: 'ADDITIONAL_QUOTE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_PARTNER_FOUND: 'NO_PARTNER_FOUND',
  EXPIRED: 'EXPIRED',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

/** Nhãn tiếng Việt cho tầng hiển thị — phủ đủ 14 trạng thái. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: 'Chờ xác nhận',
  REQUESTED: 'Đang tìm thợ',
  ASSIGNED: 'Thợ đang tới',
  ARRIVED: 'Thợ đã tới nơi',
  CHECKING: 'Đang kiểm tra xe',
  WAITING_FOR_APPROVAL: 'Chờ bạn duyệt giá',
  APPROVED: 'Đã duyệt giá',
  IN_PROGRESS: 'Đang sửa',
  ADDITIONAL_QUOTE: 'Có báo giá bổ sung',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  NO_PARTNER_FOUND: 'Chưa tìm được thợ',
  EXPIRED: 'Đã hết hạn',
};

/** Trạng thái cuối — dừng polling để tránh hao pin (FRONTEND spec §9). */
const TERMINAL_STATUSES: OrderStatus[] = [
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.NO_PARTNER_FOUND,
  ORDER_STATUS.EXPIRED,
];

export const isTerminal = (s?: OrderStatus): boolean =>
  !!s && TERMINAL_STATUSES.includes(s);
