import React from 'react';

interface PagerProps {
  page: number; // bắt đầu từ 0 (đúng với BE)
  totalPages: number;
  totalElements: number;
  onPage: (page: number) => void;
  disabled?: boolean;
}

export const Pager: React.FC<PagerProps> = ({ page, totalPages, totalElements, onPage, disabled }) => {
  const last = Math.max(totalPages - 1, 0);
  const btn =
    'flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-on-surface transition-colors enabled:hover:bg-surface-container-high disabled:opacity-40';
  return (
    <div className="flex items-center justify-between gap-3 pt-3 font-body-sm text-[13px] text-secondary">
      <span>
        {totalElements.toLocaleString('vi-VN')} bản ghi · trang {Math.min(page + 1, Math.max(totalPages, 1))}/
        {Math.max(totalPages, 1)}
      </span>
      <div className="flex gap-2">
        <button type="button" aria-label="Trang trước" className={btn} disabled={disabled || page <= 0} onClick={() => onPage(page - 1)}>
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>
        <button type="button" aria-label="Trang sau" className={btn} disabled={disabled || page >= last} onClick={() => onPage(page + 1)}>
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
};
