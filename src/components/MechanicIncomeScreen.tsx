import React from 'react';
import { PartnerStats } from '../api/partner';
import { formatVND } from '../domain/money';
import { ASSETS } from '../data';
import { MechanicBottomNav } from './MechanicBottomNav';

interface MechanicIncomeScreenProps {
  displayName?: string | null;
  stats: PartnerStats | null;
  onRescue: () => void;
  onReviews: () => void;
  onProfile: () => void;
}

export const MechanicIncomeScreen: React.FC<MechanicIncomeScreenProps> = ({
  displayName,
  stats,
  onRescue,
  onReviews,
  onProfile,
}) => {
  const earnedToday = stats?.earnedToday ?? 0;
  const completedToday = stats?.completedToday ?? 0;

  return (
    <div className="min-h-screen w-full bg-surface pb-28">
      <header className="fixed top-0 inset-x-0 z-30 mx-auto max-w-md border-b border-surface-container bg-surface-container-lowest/95 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="flex h-20 items-center justify-between px-gutter">
          <div className="flex items-center gap-space-sm">
            <img alt="Fix&Go" className="h-9 w-auto object-contain" src={ASSETS.logo} />
            <div>
              <p className="font-label-lg font-bold text-on-surface">Thu nhập</p>
              <p className="font-body-sm text-[12px] text-secondary">Báo cáo của {displayName || 'bạn'}</p>
            </div>
          </div>
          <span className="material-symbols-outlined rounded-full bg-tertiary-fixed p-2 text-tertiary">payments</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-space-md px-gutter pt-24">
        <section className="rounded-2xl bg-inverse-surface p-space-lg text-inverse-on-surface shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-label-sm uppercase tracking-[0.14em] text-inverse-on-surface/70">Hôm nay</p>
              <p className="mt-2 font-data-metric-lg text-[34px] text-white">{formatVND(earnedToday)}</p>
              <p className="mt-1 font-body-sm text-inverse-on-surface/75">
                {completedToday} cuốc đã hoàn tất
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed">
              <span className="material-symbols-outlined text-[26px]">trending_up</span>
            </div>
          </div>
          <p className="mt-5 font-body-sm text-inverse-on-surface/70">Tổng hợp từ các đơn đã hoàn tất.</p>
        </section>

        <section className="grid grid-cols-1 gap-space-sm">
          <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md shadow-sm">
            <span className="material-symbols-outlined text-[22px] text-tertiary">task_alt</span>
            <p className="mt-3 font-label-sm uppercase tracking-wide text-secondary">Tổng cuốc</p>
            <p className="mt-1 font-headline-md text-on-surface">{stats?.completedTotal ?? 0}</p>
          </div>
        </section>

          <section className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center">
            <span className="material-symbols-outlined text-[36px] text-secondary">bar_chart</span>
            <h2 className="mt-3 font-headline-md text-on-surface">Chưa có lịch sử chi tiết</h2>
            <p className="mx-auto mt-2 max-w-[290px] font-body-sm text-secondary">
              Backend hiện cung cấp số tổng hợp. Lịch sử giao dịch sẽ hiển thị khi API doanh thu được kết nối.
            </p>
          </section>
      </main>

      <MechanicBottomNav
        activeTab="income"
        onRescue={onRescue}
        onIncome={() => undefined}
        onReviews={onReviews}
        onProfile={onProfile}
      />
    </div>
  );
};
