import React from 'react';
import { ScreenId } from '../types';

interface CustomerBottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
}

const RESCUE_SCREENS: ScreenId[] = [
  'customer_confirm_request',
  'customer_radar_searching',
  'customer_tracking',
  'customer_quote_review',
];

type SideItem = {
  key: string;
  label: string;
  icon: string;
  screen?: ScreenId;
  href?: string;
};

const LEFT_ITEMS: SideItem[] = [
  { key: 'home', label: 'Trang chủ', icon: 'two_wheeler', screen: 'customer_home' },
  { key: 'history', label: 'Lịch sử', icon: 'history', screen: 'customer_history' },
];
const RIGHT_ITEMS: SideItem[] = [
  { key: 'support', label: 'Hỗ trợ', icon: 'support_agent', href: 'tel:19006868' },
  { key: 'profile', label: 'Hồ sơ', icon: 'account_circle', screen: 'customer_profile' },
];

export const CustomerBottomNav: React.FC<CustomerBottomNavProps> = ({
  currentScreen,
  onNavigate,
}) => {
  const rescueActive = RESCUE_SCREENS.includes(currentScreen);

  const SideTab: React.FC<{ item: SideItem }> = ({ item }) => {
    const active = item.screen === currentScreen;
    const cls = `flex flex-col items-center justify-center gap-0.5 h-12 transition-all active:scale-95 ${
      active ? 'text-primary' : 'text-secondary hover:text-on-surface'
    }`;
    const inner = (
      <>
        <span
          className="material-symbols-outlined text-[24px]"
          style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {item.icon}
        </span>
        <span className={`text-[11px] ${active ? 'font-bold' : 'font-medium'}`}>
          {item.label}
        </span>
      </>
    );
    return item.href ? (
      <a href={item.href} className={cls} aria-label={item.label}>
        {inner}
      </a>
    ) : (
      <button type="button" onClick={() => onNavigate(item.screen!)} className={cls}>
        {inner}
      </button>
    );
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 max-w-md mx-auto z-40 pb-safe bg-[#f8f9ff]/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(11,28,48,0.06)] border-t border-surface-container">
      <div className="grid grid-cols-5 items-end h-16 px-space-xs max-w-md mx-auto">
        <SideTab item={LEFT_ITEMS[0]} />
        <SideTab item={LEFT_ITEMS[1]} />

        {/* Cứu hộ khẩn cấp — FAB đỏ, nổi bật ở chính giữa */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => onNavigate('customer_confirm_request')}
            aria-label="Cứu hộ khẩn cấp"
            className="flex flex-col items-center active:scale-95 transition-all"
          >
            <span className="relative -mt-9 flex items-center justify-center">
              <span className="absolute w-16 h-16 rounded-full bg-error/30 motion-safe:animate-ping" />
              <span
                className={`relative w-16 h-16 rounded-full bg-error text-on-error flex items-center justify-center ring-4 ring-[#f8f9ff] shadow-[0_8px_22px_rgba(186,26,26,0.5)] transition-transform ${
                  rescueActive ? 'scale-105' : ''
                }`}
              >
                <span
                  className="material-symbols-outlined text-[30px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  e911_emergency
                </span>
              </span>
            </span>
            <span className="text-[10px] font-bold text-error leading-none mt-1 whitespace-nowrap">
              Cứu hộ khẩn cấp
            </span>
          </button>
        </div>

        <SideTab item={RIGHT_ITEMS[0]} />
        <SideTab item={RIGHT_ITEMS[1]} />
      </div>
    </nav>
  );
};
