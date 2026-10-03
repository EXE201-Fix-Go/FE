import React, { useState } from 'react';
import { listOrders } from '../adminApi';
import { useQuery } from '../useQuery';
import { Pager } from '../Pager';
import { adminOrderLabel, orderTone, StatusBadge } from '../StatusBadge';
import { ServerMessage } from '../../components/ServerMessage';
import { formatVND } from '../../domain/money';
import { ORDER_STATUS, OrderStatus } from '../../domain/status';

const CARD = 'rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm';
const STATUSES = Object.values(ORDER_STATUS) as OrderStatus[];

const fmtDate = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export const Orders: React.FC<{ initialStatus?: OrderStatus }> = ({ initialStatus }) => {
  const [status, setStatus] = useState<OrderStatus | ''>(initialStatus ?? '');
  const [page, setPage] = useState(0);
  const { data, error, loading, reload } = useQuery(() => listOrders(status || undefined, page), [status, page]);

  return (
    <div className="space-y-space-md">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Đơn hàng</h2>
          <p className="font-body-sm text-[12.5px] text-secondary">Danh sách chỉ-đọc, mới nhất ở trên cùng.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Lọc theo trạng thái"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as OrderStatus | '');
              setPage(0);
            }}
            className="h-10 rounded-xl border border-surface-container bg-surface-container-lowest px-3 font-label-md text-[13px] text-on-surface"
          >
            <option value="">Tất cả trạng thái</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {adminOrderLabel(s)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            aria-label="Làm mới"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-on-surface transition-colors enabled:hover:bg-surface-container-high disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'progress_activity' : 'refresh'}
            </span>
          </button>
        </div>
      </div>

      {error && <ServerMessage variant="error">{error}</ServerMessage>}

      <div className={`${CARD} overflow-x-auto`}>
        <table className="w-full min-w-[900px] text-left font-body-sm text-[13.5px]">
          <thead className="bg-surface-container-low font-label-sm text-[11px] uppercase tracking-wider text-secondary">
            <tr>
              <th className="px-4 py-3">Mã đơn</th>
              <th className="px-4 py-3">Dịch vụ</th>
              <th className="px-4 py-3">Khách</th>
              <th className="px-4 py-3">Thợ</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Phí gọi / di chuyển</th>
              <th className="px-4 py-3 text-right">Đã thu</th>
              <th className="px-4 py-3">Tạo lúc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {data?.items.map((o) => (
              <tr key={o.id}>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] font-bold text-on-surface">{o.orderCode}</td>
                <td className="px-4 py-3 text-on-surface">{o.serviceName ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="text-on-surface">{o.customerName || '—'}</div>
                  <div className="text-[12px] tabular-nums text-secondary">{o.customerPhone ?? ''}</div>
                </td>
                <td className="px-4 py-3 text-on-surface">{o.partnerName ?? <span className="text-secondary">Chưa có</span>}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={orderTone(o.status)}>{adminOrderLabel(o.status)}</StatusBadge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-on-surface">
                  {formatVND(o.callOutFee)}
                  {o.travelFee != null && o.travelFee > 0 && <div className="text-[12px] text-secondary">+ {formatVND(o.travelFee)}</div>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-on-surface">
                  {o.paidAmount != null ? formatVND(o.paidAmount) : <span className="font-normal text-secondary">—</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-secondary">{fmtDate(o.createdAt)}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-secondary">Không có đơn nào khớp bộ lọc.</td>
              </tr>
            )}
            {!data && loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-secondary">Đang tải…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <Pager page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPage={setPage} disabled={loading} />
      )}
    </div>
  );
};
