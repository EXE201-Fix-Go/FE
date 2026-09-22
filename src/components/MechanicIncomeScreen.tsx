import React from 'react';
import { PartnerStats } from '../api/partner';
import { formatVND } from '../domain/money';
import { ASSETS } from '../data';
import { MechanicBottomNav } from './MechanicBottomNav';

interface MechanicIncomeScreenProps {
  displayName?: string | null;
  stats: PartnerStats | null;
  live: boolean;
  onRescue: () => void;
  onReviews: () => void;
  onProfile: () => void;
}

const DEMO_DAILY_INCOME = [
  { label: 'T2', amount: 360000 },
  { label: 'T3', amount: 520000 },
  { label: 'T4', amount: 280000 },
  { label: 'T5', amount: 640000 },
  { label: 'T6', amount: 480000 },
  { label: 'T7', amount: 760000 },
  { label: 'CN', amount: 480000 },
];

const DEMO_RECENT_INCOME = [
  { title: 'Vá lốp không ruột', code: '#FG-2048', time: 'Hôm nay, 14:20', amount: 120000 },
  { title: 'Cứu hộ xe không nổ máy', code: '#FG-2041', time: 'Hôm nay, 10:05', amount: 95000 },
  { title: 'Thay bình ắc quy', code: '#FG-2034', time: 'Hôm qua, 18:40', amount: 185000 },
];

export const MechanicIncomeScreen: React.FC<MechanicIncomeScreenProps> = ({
  displayName,
  stats,
  live,
  onRescue,
  onReviews,
  onProfile,
}) => {
  const earnedToday = live ? stats?.earnedToday ?? 0 : 480000;
  const completedToday = live ? stats?.completedToday ?? 0 : 6;
  const maxDailyIncome = Math.max(...DEMO_DAILY_INCOME.map((item) => item.amount));

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
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-[72%] rounded-full bg-tertiary-fixed" />
          </div>
          <p className="mt-2 font-body-sm text-inverse-on-surface/70">
            {live ? 'Tổng hợp từ các đơn đã hoàn tất.' : 'Dữ liệu minh hoạ cho bản prototype.'}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-space-sm">
          <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md shadow-sm">
            <span className="material-symbols-outlined text-[22px] text-primary">calendar_month</span>
            <p className="mt-3 font-label-sm uppercase tracking-wide text-secondary">Tháng này</p>
            <p className="mt-1 font-headline-md text-on-surface">
              {live ? 'Chưa có dữ liệu' : '12.450.000 ₫'}
            </p>
          </div>
          <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md shadow-sm">
            <span className="material-symbols-outlined text-[22px] text-tertiary">task_alt</span>
            <p className="mt-3 font-label-sm uppercase tracking-wide text-secondary">Tổng cuốc</p>
            <p className="mt-1 font-headline-md text-on-surface">{live ? stats?.completedTotal ?? 0 : 128}</p>
          </div>
        </section>

        {!live ? (
          <>
            <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-headline-md text-on-surface">Thu nhập 7 ngày</h2>
                  <p className="mt-1 font-body-sm text-secondary">Theo dõi nhịp nhận đơn của bạn</p>
                </div>
                <span className="rounded-full bg-tertiary-fixed px-2.5 py-1 font-label-sm text-on-tertiary-fixed">Tuần này</span>
              </div>
              <div className="mt-6 flex h-40 items-end justify-between gap-2">
                {DEMO_DAILY_INCOME.map((item) => (
                  <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div className="flex h-full w-full items-end">
                      <div
                        className={`w-full rounded-t-xl ${item.amount === maxDailyIncome ? 'bg-primary' : 'bg-primary-fixed-dim'}`}
                        style={{ height: `${Math.max(18, (item.amount / maxDailyIncome) * 100)}%` }}
                        title={formatVND(item.amount)}
                      />
                    </div>
                    <span className="font-label-sm text-[11px] text-secondary">{item.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-headline-md text-on-surface">Giao dịch gần đây</h2>
                <span className="font-label-sm text-secondary">3 đơn</span>
              </div>
              <div className="mt-3 divide-y divide-surface-container">
                {DEMO_RECENT_INCOME.map((item) => (
                  <div key={item.code} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
                      <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-md text-on-surface">{item.title}</p>
                      <p className="mt-0.5 font-body-sm text-secondary">{item.code} · {item.time}</p>
                    </div>
                    <span className="shrink-0 font-label-md text-tertiary">+{formatVND(item.amount)}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center">
            <span className="material-symbols-outlined text-[36px] text-secondary">bar_chart</span>
            <h2 className="mt-3 font-headline-md text-on-surface">Chưa có lịch sử chi tiết</h2>
            <p className="mx-auto mt-2 max-w-[290px] font-body-sm text-secondary">
              Backend hiện cung cấp số tổng hợp. Lịch sử giao dịch sẽ hiển thị khi API doanh thu được kết nối.
            </p>
          </section>
        )}
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
