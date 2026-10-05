import React, { useState } from 'react';
import { AdminUser, listUsers, setUserStatus } from '../adminApi';
import { useQuery } from '../useQuery';
import { Pager } from '../Pager';
import { StatusBadge } from '../StatusBadge';
import { ServerMessage } from '../../components/ServerMessage';
import { confirmDialog, toast } from '../../components/notify';
import type { AppRole } from '../../api/auth';

const CARD = 'rounded-2xl border border-surface-container bg-surface-container-lowest shadow-sm';

const ROLE_LABEL: Record<AppRole, string> = {
  CUSTOMER: 'Khách hàng',
  P_IND: 'Thợ độc lập',
  P_SHOP: 'Chủ tiệm',
  P_STAFF: 'Nhân viên tiệm',
  ADMIN: 'Quản trị',
};

const fmtDate = (iso: string) => new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export const Users: React.FC = () => {
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, error, loading, reload } = useQuery(() => listUsers(page), [page]);

  const toggle = async (u: AdminUser) => {
    const lock = u.status === 'ACTIVE';
    const who = u.fullName || u.phone || 'tài khoản này';
    const ok = await confirmDialog(
      lock
        ? `Khoá ${who}? Mọi phiên đăng nhập của họ sẽ bị thu hồi ngay.`
        : `Mở khoá cho ${who}? Họ có thể đăng nhập lại.`,
      { okText: lock ? 'Khoá' : 'Mở khoá', cancelText: 'Huỷ', danger: lock }
    );
    if (!ok) return;
    setBusyId(u.id);
    try {
      await setUserStatus(u.id, lock ? 'LOCKED' : 'ACTIVE');
      toast(lock ? `Đã khoá ${who}.` : `Đã mở khoá ${who}.`, 'success');
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không cập nhật được tài khoản.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-space-md">
      <div>
        <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Người dùng</h2>
        <p className="font-body-sm text-[12.5px] text-secondary">
          Khoá tài khoản sẽ thu hồi mọi thiết bị đang đăng nhập. Tài khoản quản trị được bảo vệ, không khoá được.
        </p>
      </div>

      {error && <ServerMessage variant="error">{error}</ServerMessage>}

      <div className={`${CARD} overflow-x-auto`}>
        <table className="w-full min-w-[720px] text-left font-body-sm text-[13.5px]">
          <thead className="bg-surface-container-low font-label-sm text-[11px] uppercase tracking-wider text-secondary">
            <tr>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Số điện thoại</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Tạo lúc</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {data?.items.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-on-surface">{u.fullName || <span className="text-secondary">—</span>}</td>
                <td className="px-4 py-3 tabular-nums text-on-surface">{u.phone ?? '—'}</td>
                <td className="px-4 py-3 text-on-surface">{ROLE_LABEL[u.appRole] ?? u.appRole}</td>
                <td className="px-4 py-3">
                  <StatusBadge tone={u.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khoá'}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3 text-secondary">{fmtDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  {u.role === 'ADMIN' ? (
                    <span className="text-[12px] text-secondary">Được bảo vệ</span>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === u.id}
                      onClick={() => void toggle(u)}
                      className={`rounded-lg px-3 py-1.5 font-label-md text-[12.5px] font-bold transition-colors disabled:opacity-50 ${
                        u.status === 'ACTIVE'
                          ? 'bg-error-container text-error hover:opacity-90'
                          : 'bg-tertiary-fixed text-tertiary hover:opacity-90'
                      }`}
                    >
                      {busyId === u.id ? 'Đang xử lý…' : u.status === 'ACTIVE' ? 'Khoá' : 'Mở khoá'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-secondary">Chưa có người dùng nào.</td>
              </tr>
            )}
            {!data && loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-secondary">Đang tải…</td>
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
