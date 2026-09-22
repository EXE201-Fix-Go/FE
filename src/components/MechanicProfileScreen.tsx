import React from 'react';
import { PartnerProfile, PartnerStats } from '../api/partner';
import { ASSETS } from '../data';
import { formatVND } from '../domain/money';
import { MechanicBottomNav } from './MechanicBottomNav';

interface MechanicProfileScreenProps {
  profile: PartnerProfile | null;
  stats: PartnerStats | null;
  live: boolean;
  displayName?: string | null;
  phone?: string | null;
  onRescue: () => void;
  onIncome: () => void;
  onReviews: () => void;
  onLogout: () => void;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FG';
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const MechanicProfileScreen: React.FC<MechanicProfileScreenProps> = ({
  profile,
  stats,
  live,
  displayName,
  phone,
  onRescue,
  onIncome,
  onReviews,
  onLogout,
}) => {
  const name = profile?.fullName || displayName || 'Nguyễn Văn Tuấn';
  const accountPhone = profile?.phone || phone || '090 812 3456';
  const partnerType = profile?.partnerType;
  const roleLabel = partnerType === 'SHOP'
    ? 'Chủ tiệm'
    : partnerType === 'SHOP_STAFF'
      ? 'Thợ thuộc tiệm'
      : 'Thợ cá nhân';
  const shopLabel = profile?.shopName || (partnerType === 'SHOP' ? 'Tiệm sửa xe của tôi' : 'Đội 1 · Q.1');
  const isOnline = profile?.availability === 'ONLINE';
  const verificationLabel = profile?.verificationStatus === 'PENDING'
    ? 'Đang chờ duyệt'
    : profile?.verificationStatus === 'REJECTED'
      ? 'Cần cập nhật hồ sơ'
      : 'Đã xác minh';

  return (
    <div className="min-h-screen w-full bg-surface pb-28">
      <header className="fixed top-0 inset-x-0 z-30 mx-auto max-w-md border-b border-surface-container bg-surface-container-lowest/95 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="flex h-20 items-center justify-between px-gutter">
          <div className="flex items-center gap-space-sm">
            <img alt="Fix&Go" className="h-9 w-auto object-contain" src={ASSETS.logo} />
            <div>
              <p className="font-label-lg font-bold text-on-surface">Tài khoản</p>
              <p className="font-body-sm text-[12px] text-secondary">Thông tin đối tác</p>
            </div>
          </div>
          <span className="material-symbols-outlined rounded-full bg-secondary-container p-2 text-on-secondary-container">person</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-space-md px-gutter pt-24">
        <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-[22px] font-extrabold text-on-primary">
              {initials(name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-headline-md text-on-surface">{name}</h1>
                <span className="material-symbols-outlined shrink-0 text-[18px] text-tertiary">verified</span>
              </div>
              <p className="mt-1 truncate font-body-md text-secondary">{roleLabel}</p>
              <p className="mt-0.5 truncate font-body-sm text-secondary">{shopLabel}</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-tertiary animate-pulse' : 'bg-secondary'}`} />
              <span className="font-label-md text-on-surface">{isOnline ? 'Đang sẵn sàng nhận đơn' : 'Đang tạm nghỉ'}</span>
            </div>
            <span className="font-label-sm text-secondary">{verificationLabel}</span>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-3 text-center shadow-sm">
            <span className="material-symbols-outlined text-[22px] text-primary">star</span>
            <p className="mt-2 font-headline-md text-on-surface">{live ? stats?.averageRating?.toFixed(1) || '--' : '4.9'}</p>
            <p className="mt-0.5 font-body-sm text-secondary">Đánh giá</p>
          </div>
          <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-3 text-center shadow-sm">
            <span className="material-symbols-outlined text-[22px] text-tertiary">task_alt</span>
            <p className="mt-2 font-headline-md text-on-surface">{live ? stats?.completedTotal ?? 0 : 128}</p>
            <p className="mt-0.5 font-body-sm text-secondary">Cuốc hoàn tất</p>
          </div>
          <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-3 text-center shadow-sm">
            <span className="material-symbols-outlined text-[22px] text-primary">payments</span>
            <p className="mt-2 truncate font-label-md text-on-surface">{live ? formatVND(stats?.earnedToday ?? 0) : '480.000 ₫'}</p>
            <p className="mt-0.5 font-body-sm text-secondary">Hôm nay</p>
          </div>
        </section>

        <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md shadow-sm">
          <h2 className="font-headline-md text-on-surface">Thông tin tài khoản</h2>
          <div className="mt-3 divide-y divide-surface-container">
            <div className="flex items-center gap-3 py-3 first:pt-1">
              <span className="material-symbols-outlined text-[21px] text-secondary">phone</span>
              <div className="min-w-0 flex-1">
                <p className="font-body-sm text-secondary">Số điện thoại</p>
                <p className="mt-0.5 font-label-md text-on-surface">{accountPhone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-3">
              <span className="material-symbols-outlined text-[21px] text-secondary">badge</span>
              <div className="min-w-0 flex-1">
                <p className="font-body-sm text-secondary">Loại tài khoản</p>
                <p className="mt-0.5 font-label-md text-on-surface">{roleLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-3 last:pb-1">
              <span className="material-symbols-outlined text-[21px] text-secondary">location_on</span>
              <div className="min-w-0 flex-1">
                <p className="font-body-sm text-secondary">Khu vực hoạt động</p>
                <p className="mt-0.5 font-label-md text-on-surface">Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-center pb-4 pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-white px-6 font-body-lg text-error/70 shadow-sm ring-1 ring-surface-container transition-all hover:text-error active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            Đăng xuất
          </button>
        </div>
      </main>

      <MechanicBottomNav
        activeTab="profile"
        onRescue={onRescue}
        onIncome={onIncome}
        onReviews={onReviews}
        onProfile={() => undefined}
      />
    </div>
  );
};
