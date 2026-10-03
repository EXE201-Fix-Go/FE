import React, { useState } from 'react';
import type { AuthUser } from '../api/auth';
import type { OrderStatus } from '../domain/status';
import { confirmDialog, NotificationHost } from '../components/notify';
import { ADMIN_TABS, AdminTab } from './tabs';
import { Overview } from './screens/Overview';
import { Users } from './screens/Users';
import { Kyc } from './screens/Kyc';
import { Orders } from './screens/Orders';

interface AdminAppProps {
  user: AuthUser | null;
  onLogout: () => void;
}

/**
 * Trang quản trị (chỉ tài khoản ADMIN). Toàn trang rộng — không nằm trong khung điện thoại `max-w-md` của app khách.
 * Toàn bộ mã admin nằm trong src/admin/ để không đụng các màn của nhóm khác.
 */
export const AdminApp: React.FC<AdminAppProps> = ({ user, onLogout }) => {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [ordersStatus, setOrdersStatus] = useState<OrderStatus | undefined>(undefined);

  const goto = (next: AdminTab, status?: OrderStatus) => {
    setOrdersStatus(next === 'orders' ? status : undefined);
    setTab(next);
  };

  const logout = async () => {
    const ok = await confirmDialog('Đăng xuất khỏi trang quản trị?', { okText: 'Đăng xuất', cancelText: 'Ở lại' });
    if (ok) onLogout();
  };

  const navButton = (t: (typeof ADMIN_TABS)[number], vertical: boolean) => (
    <button
      key={t.id}
      type="button"
      onClick={() => goto(t.id)}
      aria-current={tab === t.id ? 'page' : undefined}
      className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 font-label-md text-label-md font-bold transition-colors ${
        vertical ? 'w-full' : ''
      } ${tab === t.id ? 'bg-primary-container text-on-primary' : 'text-on-surface hover:bg-surface-container'}`}
    >
      <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
      {t.label}
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-surface text-on-surface md:flex">
      {/* Thanh bên (màn rộng) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-surface-container bg-surface-container-lowest p-4 md:flex">
        <div className="mb-6 px-2">
          <p className="font-headline-md text-[22px] font-extrabold text-primary">Fix&amp;Go</p>
          <p className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-secondary">Quản trị vận hành</p>
        </div>
        <nav className="flex flex-col gap-1">{ADMIN_TABS.map((t) => navButton(t, true))}</nav>
        <div className="mt-auto border-t border-surface-container pt-4">
          <p className="truncate px-2 font-label-md text-label-md font-bold">{user?.fullName || 'Quản trị viên'}</p>
          <p className="truncate px-2 pb-2 font-body-sm text-[12px] text-secondary">{user?.phone ?? ''}</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 font-label-md text-label-md font-bold text-error transition-colors hover:bg-error-container"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Thanh trên (màn hẹp) */}
        <header className="sticky top-0 z-10 border-b border-surface-container bg-surface-container-lowest md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="font-headline-md text-[18px] font-extrabold text-primary">
              Fix&amp;Go <span className="font-label-sm text-[11px] font-bold uppercase text-secondary">Quản trị</span>
            </p>
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Đăng xuất"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-error hover:bg-error-container"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">{ADMIN_TABS.map((t) => navButton(t, false))}</nav>
        </header>

        <main className="mx-auto w-full max-w-6xl p-4 md:p-8">
          {tab === 'overview' && <Overview onGoto={goto} />}
          {tab === 'users' && <Users />}
          {tab === 'kyc' && <Kyc />}
          {tab === 'orders' && <Orders key={ordersStatus ?? 'all'} initialStatus={ordersStatus} />}
        </main>
      </div>

      <NotificationHost />
    </div>
  );
};
