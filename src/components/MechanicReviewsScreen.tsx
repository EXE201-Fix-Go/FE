import React from 'react';
import { PartnerStats } from '../api/partner';
import { ASSETS } from '../data';
import { MechanicBottomNav } from './MechanicBottomNav';

interface MechanicReviewsScreenProps {
  displayName?: string | null;
  stats: PartnerStats | null;
  onRescue: () => void;
  onIncome: () => void;
  onProfile: () => void;
}

const RatingStars: React.FC<{ rating: number }> = ({ rating }) => (
  <span className="inline-flex items-center gap-0.5 text-primary" aria-label={`${rating} trên 5 sao`}>
    {Array.from({ length: 5 }, (_, index) => (
      <span key={index} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        {index < rating ? 'star' : 'star_border'}
      </span>
    ))}
  </span>
);

export const MechanicReviewsScreen: React.FC<MechanicReviewsScreenProps> = ({
  displayName,
  stats,
  onRescue,
  onIncome,
  onProfile,
}) => {
  const rating = stats?.averageRating;
  const reviewCount = stats?.reviewCount ?? 0;

  return (
    <div className="min-h-screen w-full bg-surface pb-28">
      <header className="fixed top-0 inset-x-0 z-30 mx-auto max-w-md border-b border-surface-container bg-surface-container-lowest/95 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="flex h-20 items-center justify-between px-gutter">
          <div className="flex items-center gap-space-sm">
            <img alt="Fix&Go" className="h-9 w-auto object-contain" src={ASSETS.logo} />
            <div>
              <p className="font-label-lg font-bold text-on-surface">Đánh giá</p>
              <p className="font-body-sm text-[12px] text-secondary">Phản hồi của khách hàng</p>
            </div>
          </div>
          <span className="material-symbols-outlined rounded-full bg-primary-fixed p-2 text-primary">star</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-col gap-space-md px-gutter pt-24">
        <section className="grid grid-cols-[1fr_1.35fr] gap-3 rounded-2xl border border-surface-container bg-surface-container-lowest p-space-lg shadow-sm">
          <div className="flex flex-col items-center justify-center border-r border-surface-container pr-3 text-center">
            <p className="font-data-metric-lg text-[40px] text-on-surface">{rating === null || rating === undefined ? '--' : rating.toFixed(1)}</p>
            <RatingStars rating={Math.round(rating ?? 0)} />
            <p className="mt-2 font-body-sm text-secondary">{reviewCount} đánh giá</p>
          </div>
          <div className="flex flex-col justify-center gap-1 text-secondary">
            <span className="material-symbols-outlined text-[28px]">reviews</span>
            <p className="font-body-sm">Điểm trung bình tính trên toàn bộ đánh giá của khách.</p>
          </div>
        </section>

        <section className="rounded-2xl bg-inverse-surface p-space-lg text-inverse-on-surface shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tertiary-fixed text-on-tertiary-fixed">
              <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
            </div>
            <div>
              <p className="font-label-sm uppercase tracking-[0.14em] text-inverse-on-surface/70">Hồ sơ của bạn</p>
              <h2 className="mt-1 font-headline-md text-white">Giữ chất lượng ổn định</h2>
              <p className="mt-1 font-body-sm text-inverse-on-surface/75">
                {`Điểm hiện tại của ${displayName || 'bạn'} được cập nhật từ hệ thống.`}
              </p>
            </div>
          </div>
        </section>

          <section className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center">
            <span className="material-symbols-outlined text-[36px] text-secondary">reviews</span>
            <h2 className="mt-3 font-headline-md text-on-surface">Chưa có danh sách nhận xét</h2>
            <p className="mx-auto mt-2 max-w-[290px] font-body-sm text-secondary">
              Backend hiện cung cấp điểm trung bình và số lượng đánh giá. Nội dung từng nhận xét sẽ hiển thị khi API được kết nối.
            </p>
          </section>
      </main>

      <MechanicBottomNav
        activeTab="reviews"
        onRescue={onRescue}
        onIncome={onIncome}
        onReviews={() => undefined}
        onProfile={onProfile}
      />
    </div>
  );
};
