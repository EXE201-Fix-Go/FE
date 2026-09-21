import React from 'react';
import { ASSETS } from '../data';
import { ScreenId } from '../types';

interface CustomerHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  variant?: 'home' | 'sub';
  onProfileClick?: () => void;
  onEmergencyClick?: () => void;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  title = 'Trang Chủ',
  subtitle = 'Sài Gòn',
  showBack = false,
  showBackButton,
  onBack,
  variant = 'home',
  onProfileClick,
}) => {
  const shouldShowBack = showBackButton !== undefined ? showBackButton : showBack;
  return (
    <header className="fixed top-0 inset-x-0 max-w-md mx-auto z-50 bg-[#f8f9ff]/90 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 px-gutter flex items-center justify-between gap-space-sm">
        {/* Left: Back + Title (màn con) hoặc Logo + brand (trang chủ) */}
        <div className="flex items-center gap-space-xs min-w-0 flex-1">
          {shouldShowBack ? (
            <button
              aria-label="Quay lại"
              onClick={onBack}
              type="button"
              className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
          ) : (
            <img
              alt="Fix&Go"
              src={ASSETS.logo}
              className="h-8 w-auto object-contain flex-shrink-0"
            />
          )}

          <div className="flex flex-col min-w-0 ml-1">
            {shouldShowBack ? (
              <h1 className="font-headline-md text-[18px] text-on-surface truncate font-bold leading-tight">
                {title}
              </h1>
            ) : (
              <>
                <span className="font-label-sm text-[11px] uppercase tracking-wider text-primary font-bold truncate">
                  {subtitle}
                </span>
                <span className="font-headline-md text-[18px] text-on-surface truncate font-bold leading-tight">
                  {title}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Hotline + Profile */}
        <div className="flex items-center gap-space-sm flex-shrink-0">
          {shouldShowBack ? (
            <a
              className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-sm active:scale-95 transition-all"
              href="tel:19006868"
              aria-label="Gọi hotline khẩn cấp 1900 6868"
              title="Hotline khẩn cấp 24/7"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
            </a>
          ) : (
            <a
              className="h-10 px-3 rounded-full bg-primary-container text-on-primary flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              href="tel:19006868"
              title="Hotline khẩn cấp 24/7"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span className="font-label-md text-[13px] font-bold leading-none whitespace-nowrap">
                1900 6868
              </span>
            </a>
          )}

          <button
            onClick={onProfileClick}
            type="button"
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary hover:opacity-90 active:scale-95 transition-all shadow-sm"
            title="Tài khoản cá nhân"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </button>
        </div>
      </div>
    </header>
  );
};
