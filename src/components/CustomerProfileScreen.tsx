import React from 'react';
import { AuthUser } from '../api/auth';

interface CustomerProfileProps {
  onLogout: () => void;
  /** Tài khoản thật đang đăng nhập. */
  user: AuthUser | null;
}

export const CustomerProfileScreen: React.FC<CustomerProfileProps> = ({ onLogout, user }) => {
  const name = user?.fullName || 'Khách Fix&Go';
  const contact = user?.phone ?? '';
  return (
    <div className="flex flex-col w-full px-gutter pb-24 space-y-space-md pt-2">
      {/* Profile Card */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container flex items-center gap-space-md">
        <div
          aria-hidden
          className="w-16 h-16 rounded-full shrink-0 bg-primary-fixed text-on-primary-fixed border-2 border-primary/20 flex items-center justify-center font-headline-md text-[26px] font-bold"
        >
          {name.trim().charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-headline-md text-headline-md text-on-surface truncate font-bold">{name}</h2>
          {contact && <p className="font-body-sm text-[12.5px] text-secondary mt-0.5">{contact}</p>}
          <div className="flex items-center gap-1 mt-1 text-tertiary font-label-sm text-[11px] font-semibold">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span>Đã xác minh số điện thoại</span>
          </div>
        </div>
      </div>

      {/* Đăng xuất */}
      <button
        onClick={onLogout}
        className="w-full h-12 rounded-xl border border-error/40 text-error font-label-md font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
        Đăng xuất
      </button>
    </div>
  );
};
