import React from 'react';

export type MechanicTab = 'rescue' | 'income' | 'reviews' | 'profile';

interface MechanicBottomNavProps {
  activeTab: MechanicTab;
  onRescue: () => void;
  onIncome: () => void;
  onReviews: () => void;
  onProfile: () => void;
}

const baseItem =
  'flex min-w-[60px] min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 transition-all active:scale-95';

export const MechanicBottomNav: React.FC<MechanicBottomNavProps> = ({
  activeTab,
  onRescue,
  onIncome,
  onReviews,
  onProfile,
}) => {
  const itemClass = (active: boolean) =>
    `${baseItem} ${
      active
        ? 'bg-primary-fixed/55 text-primary font-bold'
        : 'text-secondary hover:bg-surface-container-low hover:text-on-surface'
    }`;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-md border-t border-surface-container bg-surface-container-lowest/95 pb-safe shadow-[0_-4px_16px_rgba(11,28,48,0.06)] backdrop-blur-xl"
      aria-label="Điều hướng đối tác"
    >
      <div className="mx-auto flex h-16 max-w-md items-center gap-1 px-gutter">
        <button
          className={itemClass(activeTab === 'rescue')}
          onClick={onRescue}
          type="button"
          aria-current={activeTab === 'rescue' ? 'page' : undefined}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: activeTab === 'rescue' ? "'FILL' 1" : "'FILL' 0" }}
          >
            build
          </span>
          <span className="font-label-sm text-[11px]">Cứu hộ</span>
        </button>

        <button
          className={itemClass(activeTab === 'income')}
          onClick={onIncome}
          type="button"
          aria-current={activeTab === 'income' ? 'page' : undefined}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: activeTab === 'income' ? "'FILL' 1" : "'FILL' 0" }}
          >
            account_balance_wallet
          </span>
          <span className="font-label-sm text-[11px]">Thu nhập</span>
        </button>

        <button
          className={itemClass(activeTab === 'reviews')}
          onClick={onReviews}
          type="button"
          aria-current={activeTab === 'reviews' ? 'page' : undefined}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: activeTab === 'reviews' ? "'FILL' 1" : "'FILL' 0" }}
          >
            star
          </span>
          <span className="font-label-sm text-[11px]">Đánh giá</span>
        </button>

        <button
          className={itemClass(activeTab === 'profile')}
          onClick={onProfile}
          type="button"
          aria-current={activeTab === 'profile' ? 'page' : undefined}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            style={{ fontVariationSettings: activeTab === 'profile' ? "'FILL' 1" : "'FILL' 0" }}
          >
            account_circle
          </span>
          <span className="font-label-sm text-[11px]">Tài khoản</span>
        </button>
      </div>
    </nav>
  );
};
