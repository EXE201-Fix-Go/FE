import React from 'react';
import { Order } from '../api/orders';
import { ORDER_STATUS_LABEL, isTerminal } from '../domain/status';
import { formatVND } from '../domain/money';
import { QuoteBreakdown } from './QuoteBreakdown';
import { SERVICES } from '../data';

interface CustomerOrderDetailProps {
  order: Order;
  onBack: () => void;
  /** Đơn đang chạy → mở lại luồng theo dõi/duyệt. */
  onResume?: (order: Order) => void;
  /** Đơn đã hoàn tất → mở hoá đơn & đánh giá. */
  onViewInvoice?: (order: Order) => void;
}

const STATUS_TONE: Record<string, string> = {
  COMPLETED: 'bg-tertiary-container text-on-tertiary-container',
  CANCELLED: 'bg-error-container text-on-error-container',
  NO_PARTNER_FOUND: 'bg-error-container text-on-error-container',
  EXPIRED: 'bg-surface-container-highest text-on-surface-variant',
};

const ACTOR_LABEL: Record<string, string> = {
  CUSTOMER: 'Khách hàng',
  PARTNER: 'Thợ',
  SYSTEM: 'Hệ thống',
  ADMIN: 'Quản trị',
};

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('vi-VN')} • ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
}

/** Chi tiết một đơn trong lịch sử: trạng thái, bảng kê phí, timeline, thanh toán — mở được cho mọi đơn. */
export const CustomerOrderDetailScreen: React.FC<CustomerOrderDetailProps> = ({
  order,
  onBack,
  onResume,
  onViewInvoice,
}) => {
  const serviceName = order.serviceName ?? SERVICES.find((s) => s.id === order.serviceId)?.name ?? order.serviceId;
  const tone = STATUS_TONE[order.status] ?? 'bg-primary-fixed text-on-primary-fixed';
  const running = !isTerminal(order.status);
  const total = order.quote?.totalAmount ?? order.payment?.amount ?? order.callOutFee;
  const history = [...(order.history ?? [])].reverse(); // mới nhất lên đầu

  return (
    <div className="flex flex-col w-full px-gutter pb-24 space-y-space-md pt-2">
      {/* Header */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onBack}
          aria-label="Quay lại"
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div className="min-w-0">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold truncate">Chi tiết đơn</h2>
          <p className="font-label-sm text-[11px] text-secondary font-mono">{order.orderCode}</p>
        </div>
      </div>

      {/* Tóm tắt trạng thái */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-headline-md text-headline-md text-on-surface font-bold truncate">{serviceName}</p>
            <p className="font-label-sm text-[11px] text-secondary">{fmtDateTime(order.createdAt)}</p>
          </div>
          <span className={`inline-block px-2.5 py-1 rounded-full font-label-sm text-[11px] font-bold flex-shrink-0 ${tone}`}>
            {ORDER_STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>
        <div className="flex items-start gap-2 pt-1 border-t border-surface-container">
          <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">location_on</span>
          <div className="min-w-0">
            <p className="font-body-sm text-[13px] text-on-surface font-medium leading-snug">{order.addressText}</p>
            <p className="font-label-sm text-[11px] text-secondary">
              {order.lat.toFixed(5)}, {order.lng.toFixed(5)}
            </p>
          </div>
        </div>
      </div>

      {/* Thợ phụ trách */}
      {order.partner?.fullName && (
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">engineering</span>
          </div>
          <div className="min-w-0">
            <p className="font-label-sm text-[11px] text-secondary">Thợ phụ trách</p>
            <p className="font-label-md text-label-md text-on-surface font-bold truncate">{order.partner.fullName}</p>
            {order.partner.phone && <p className="font-label-sm text-[11px] text-secondary">{order.partner.phone}</p>}
          </div>
        </div>
      )}

      {/* Lý do huỷ */}
      {order.status === 'CANCELLED' && order.cancellationReason && (
        <div className="bg-error-container/40 rounded-xl p-space-md border border-error-container flex items-start gap-2">
          <span className="material-symbols-outlined text-error text-[18px] mt-0.5">cancel</span>
          <div>
            <p className="font-label-sm text-[11px] text-error font-bold uppercase">Đã huỷ</p>
            <p className="font-body-sm text-[13px] text-on-surface">{order.cancellationReason}</p>
          </div>
        </div>
      )}

      {/* Bảng kê phí */}
      {order.quote ? (
        <QuoteBreakdown quote={order.quote} />
      ) : (
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-body-sm text-[13px] text-on-surface">Phí gọi thợ</span>
            <span className="font-label-md text-on-surface tabular-nums font-bold">{formatVND(order.callOutFee)}</span>
          </div>
          {order.travelFee != null && order.travelFee > 0 && (
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-[13px] text-on-surface">
                Phí di chuyển{order.travelDistanceKm != null ? ` (${order.travelDistanceKm} km)` : ''}
              </span>
              <span className="font-label-md text-on-surface tabular-nums font-bold">{formatVND(order.travelFee)}</span>
            </div>
          )}
        </div>
      )}

      {/* Tổng + thanh toán */}
      <div className="p-space-md rounded-xl bg-surface-container-high/60 border border-surface-container flex items-center justify-between">
        <div>
          <span className="font-label-sm text-[11px] text-secondary uppercase tracking-wider block font-bold">
            {order.status === 'COMPLETED' ? 'Tổng đã thanh toán' : 'Tạm tính'}
          </span>
          {order.payment && (
            <span
              className={`font-label-sm text-[11px] font-semibold ${
                order.payment.status === 'CONFIRMED' ? 'text-tertiary' : 'text-error'
              }`}
            >
              {order.payment.status === 'CONFIRMED' ? 'Đã thanh toán tiền mặt' : 'Chưa thanh toán'}
            </span>
          )}
        </div>
        <span className="font-data-metric-lg text-primary font-extrabold tabular-nums">{formatVND(total)}</span>
      </div>

      {/* Timeline trạng thái */}
      {history.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container">
          <p className="font-label-md text-label-md text-on-surface font-bold pb-2 border-b border-surface-container">
            Nhật ký xử lý
          </p>
          <ol className="mt-3 space-y-3">
            {history.map((h, i) => (
              <li key={`${h.to}-${h.at}-${i}`} className="flex gap-2.5">
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1 ${i === 0 ? 'bg-primary' : 'bg-surface-container-highest'}`} />
                  {i < history.length - 1 && <span className="w-px flex-1 bg-surface-container-high mt-0.5" />}
                </div>
                <div className="min-w-0 pb-0.5">
                  <p className="font-label-md text-label-md text-on-surface font-bold leading-tight">
                    {ORDER_STATUS_LABEL[h.to] ?? h.to}
                  </p>
                  <p className="font-label-sm text-[11px] text-secondary">
                    {fmtDateTime(h.at)} · {ACTOR_LABEL[h.actorType] ?? h.actorType}
                  </p>
                  {h.note && <p className="font-body-sm text-[12px] text-on-surface-variant mt-0.5">{h.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Hành động */}
      <div className="space-y-2 pt-1">
        {running && onResume && (
          <button
            type="button"
            onClick={() => onResume(order)}
            className="w-full h-13 py-3.5 bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">navigation</span>
            Tiếp tục theo dõi
          </button>
        )}
        {order.status === 'COMPLETED' && onViewInvoice && (
          <button
            type="button"
            onClick={() => onViewInvoice(order)}
            className="w-full h-13 py-3.5 bg-tertiary text-on-tertiary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            Xem hoá đơn & đánh giá
          </button>
        )}
        <button
          type="button"
          onClick={onBack}
          className="w-full h-12 rounded-xl bg-surface-container text-on-surface font-label-md flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Về lịch sử
        </button>
      </div>
    </div>
  );
};
