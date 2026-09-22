import React, { useEffect, useState } from 'react';
import { listMyOrders, Order } from '../api/orders';
import { apiConfigured } from '../api/client';
import { ServerMessage } from './ServerMessage';
import { ORDER_STATUS_LABEL, isTerminal } from '../domain/status';
import { formatVND } from '../domain/money';
import { SERVICES } from '../data';

interface CustomerHistoryProps {
  onBackToHome: () => void;
  /** Mở màn chi tiết cho bất kỳ đơn nào (kể cả đã huỷ / hết hạn). */
  onOpen: (order: Order) => void;
}

const STATUS_TONE: Record<string, string> = {
  COMPLETED: 'bg-tertiary-container text-on-tertiary-container',
  CANCELLED: 'bg-error-container text-on-error-container',
  NO_PARTNER_FOUND: 'bg-error-container text-on-error-container',
  EXPIRED: 'bg-surface-container-highest text-on-surface-variant',
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('vi-VN')} • ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
}

/** Dữ liệu mẫu cho bản demo không có backend (GitHub Pages). */
const DEMO_ORDERS: Order[] = [
  {
    id: 'demo-1', orderCode: 'FG-241018-K2M9', status: 'COMPLETED', serviceId: 'tire-patch', serviceName: 'Vá xe lưu động',
    extraServiceIds: [], addressText: '242 Cống Quỳnh, Q.1', photoUrls: [], lat: 10.77, lng: 106.69, callOutFee: 30000,
    createdAt: '2024-10-18T15:45:00Z', partner: { id: 'p1', fullName: 'Nguyễn Văn Tuấn', phone: '0908123456' },
    quote: null, payment: { id: 'pay1', amount: 120000, status: 'CONFIRMED', method: 'CASH' }, history: [],
  },
  {
    id: 'demo-2', orderCode: 'FG-240805-Q7ZD', status: 'CANCELLED', serviceId: 'battery-jump', serviceName: 'Kích bình ắc quy',
    extraServiceIds: [], addressText: '128 Nguyễn Trãi, Q.1', photoUrls: [], lat: 10.76, lng: 106.68, callOutFee: 30000,
    createdAt: '2024-08-05T01:30:00Z', partner: { id: 'p2', fullName: 'Trần Đình Nam', phone: '0909000000' },
    quote: null, payment: { id: 'pay2', amount: 30000, status: 'CONFIRMED', method: 'CASH' }, history: [],
  },
];

/** Bảng đơn hàng thật của khách — dữ liệu từ backend (GET /orders). */
export const CustomerHistoryScreen: React.FC<CustomerHistoryProps> = ({
  onBackToHome,
  onOpen,
}) => {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    if (!apiConfigured) {
      setOrders(DEMO_ORDERS);
      return;
    }
    listMyOrders()
      .then(setOrders)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Không tải được lịch sử.'));
  };
  useEffect(load, []);

  const serviceName = (o: Order) => o.serviceName ?? SERVICES.find((s) => s.id === o.serviceId)?.name ?? o.serviceId;
  const amount = (o: Order) =>
    o.quote && o.quote.status === 'APPROVED' ? o.quote.totalAmount : o.payment ? o.payment.amount : o.callOutFee;

  return (
    <div className="flex flex-col w-full px-gutter pb-24 space-y-space-md pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Lịch sử cứu hộ</h2>
          <p className="font-body-sm text-[12.5px] text-secondary">Dữ liệu thật từ máy chủ Fix&amp;Go</p>
        </div>
        <span className="px-2.5 py-1 bg-primary-fixed text-on-primary-fixed rounded-full font-label-sm text-[11px] font-bold">
          {orders ? `${orders.length} đơn` : '…'}
        </span>
      </div>

      {error && (
        <ServerMessage variant="error">
          <span className="flex items-center justify-between gap-2 w-full">
            <span>{error}</span>
            <button type="button" onClick={load} className="font-label-sm underline whitespace-nowrap">Thử lại</button>
          </span>
        </ServerMessage>
      )}

      {orders === null && !error && (
        <div className="rounded-xl bg-surface-container-lowest p-[15px] text-center font-body-sm text-secondary">
          Đang tải…
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="rounded-xl bg-surface-container-lowest p-[15px] text-center font-body-sm text-secondary">
          Chưa có đơn nào. Đặt cứu hộ ở trang chủ nhé!
        </div>
      )}

      {/* Bảng đơn */}
      {orders && orders.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
          <table className="w-full text-left font-body-sm">
            <thead className="bg-surface-container-low font-label-sm text-[11px] uppercase tracking-wider text-secondary">
              <tr>
                <th className="px-[15px] py-2.5">Đơn</th>
                <th className="px-2 py-2.5">Trạng thái</th>
                <th className="px-[15px] py-2.5 text-right">Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {orders.map((o) => {
                const running = !isTerminal(o.status);
                const tone = STATUS_TONE[o.status] ?? 'bg-primary-fixed text-on-primary-fixed';
                return (
                  <tr
                    key={o.id}
                    onClick={() => onOpen(o)}
                    className="cursor-pointer active:bg-surface-container-low"
                  >
                    <td className="px-[15px] py-3 align-top">
                      <div className="font-label-md text-on-surface font-bold">{serviceName(o)}</div>
                      <div className="font-label-sm text-[11px] text-secondary font-mono">{o.orderCode}</div>
                      <div className="font-label-sm text-[11px] text-secondary">{fmtDate(o.createdAt)}</div>
                      {o.partner?.fullName && (
                        <div className="font-label-sm text-[11px] text-on-surface-variant">Thợ: {o.partner.fullName}</div>
                      )}
                    </td>
                    <td className="px-2 py-3 align-top">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-label-sm text-[11px] font-bold ${tone}`}>
                        {ORDER_STATUS_LABEL[o.status] ?? o.status}
                      </span>
                      <div className="font-label-sm text-[11px] text-primary mt-1">
                        {running ? 'Đang chạy · xem ›' : 'Xem chi tiết ›'}
                      </div>
                    </td>
                    <td className="px-[15px] py-3 align-top text-right font-label-md text-on-surface font-bold tabular-nums whitespace-nowrap">
                      {formatVND(amount(o))}
                      {o.payment && (
                        <div className={`font-label-sm text-[11px] font-normal ${o.payment.status === 'CONFIRMED' ? 'text-tertiary' : 'text-error'}`}>
                          {o.payment.status === 'CONFIRMED' ? 'đã trả' : 'chưa trả'}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={onBackToHome}
        className="w-full h-12 rounded-xl bg-surface-container text-on-surface font-label-md flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-[20px]">home</span>
        Về trang chủ
      </button>
    </div>
  );
};
