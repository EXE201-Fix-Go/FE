import React from 'react';
import { getOverview } from '../adminApi';
import { useQuery } from '../useQuery';
import { ServerMessage } from '../../components/ServerMessage';
import { formatVND } from '../../domain/money';
import { ORDER_STATUS, ORDER_STATUS_LABEL, OrderStatus } from '../../domain/status';
import { orderTone, StatusBadge } from '../StatusBadge';
import type { AdminTab } from '../tabs';

const CARD = 'rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md shadow-sm';
const STATUSES = Object.values(ORDER_STATUS) as OrderStatus[]; // đúng thứ tự vòng đời (ERD §7.1)

interface StatProps {
  icon: string;
  title: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  onClick?: () => void;
}

const Stat: React.FC<StatProps> = ({ icon, title, value, hint, onClick }) => {
  const body = (
    <>
      <div className="flex items-center gap-2 text-secondary">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
        <span className="font-label-md text-label-md font-bold">{title}</span>
      </div>
      <div className="mt-2 font-headline-md text-[28px] font-extrabold leading-tight text-on-surface tabular-nums">{value}</div>
      {hint && <div className="mt-1 font-body-sm text-[12.5px] text-secondary">{hint}</div>}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={`${CARD} text-left transition-colors hover:bg-surface-container-low`}>
      {body}
    </button>
  ) : (
    <div className={CARD}>{body}</div>
  );
};

export const Overview: React.FC<{ onGoto: (tab: AdminTab, ordersStatus?: OrderStatus) => void }> = ({ onGoto }) => {
  const { data, error, loading, reload } = useQuery(getOverview, []);

  return (
    <div className="space-y-space-md">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Tổng quan vận hành</h2>
          <p className="font-body-sm text-[12.5px] text-secondary">
            {data ? `Cập nhật lúc ${new Date(data.generatedAt).toLocaleTimeString('vi-VN')}` : 'Đang tải số liệu…'}
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-surface-container px-3 font-label-md text-label-md text-on-surface transition-colors enabled:hover:bg-surface-container-high disabled:opacity-60"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            {loading ? 'progress_activity' : 'refresh'}
          </span>
          Làm mới
        </button>
      </div>

      {error && <ServerMessage variant="error">{error}</ServerMessage>}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              icon="group"
              title="Người dùng"
              value={data.users.total.toLocaleString('vi-VN')}
              hint={`${data.users.customers} khách · ${data.users.partners} thợ · ${data.users.admins} admin${
                data.users.locked ? ` · ${data.users.locked} bị khoá` : ''
              }`}
              onClick={() => onGoto('users')}
            />
            <Stat
              icon="verified_user"
              title="Thợ chờ duyệt KYC"
              value={data.partners.pending.toLocaleString('vi-VN')}
              hint={`${data.partners.approved} đã duyệt (${data.partners.onlineApproved} đang online) · ${data.partners.rejected} từ chối`}
              onClick={() => onGoto('kyc')}
            />
            <Stat
              icon="receipt_long"
              title="Đơn hàng"
              value={data.orders.total.toLocaleString('vi-VN')}
              hint={`${data.orders.today} đơn tạo hôm nay`}
              onClick={() => onGoto('orders')}
            />
            <Stat
              icon="payments"
              title="Đã thu (tiền mặt)"
              value={formatVND(data.revenue.confirmedTotal)}
              hint={
                <>
                  Hôm nay {formatVND(data.revenue.confirmedToday)}
                  {data.revenue.estimatedCommission != null && data.revenue.commissionRate != null && (
                    <>
                      {' '}
                      · hoa hồng tạm tính {formatVND(data.revenue.estimatedCommission)} (
                      {Number((data.revenue.commissionRate * 100).toFixed(2))}%)
                    </>
                  )}
                </>
              }
            />
          </div>

          <div className={CARD}>
            <h3 className="font-label-md text-label-md font-bold text-on-surface">Đơn theo trạng thái</h3>
            <p className="mb-3 font-body-sm text-[12.5px] text-secondary">Bấm vào một trạng thái để xem danh sách đơn.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {STATUSES.map((s) => {
                const n = data.orders.byStatus[s] ?? 0;
                const pct = data.orders.total > 0 ? Math.round((n / data.orders.total) * 100) : 0;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onGoto('orders', s)}
                    className="rounded-xl border border-surface-container p-3 text-left transition-colors hover:bg-surface-container-low"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge tone={orderTone(s)}>{ORDER_STATUS_LABEL[s]}</StatusBadge>
                      <span className="font-label-md text-label-md font-bold tabular-nums text-on-surface">{n}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-primary-container" style={{ width: `${pct}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
