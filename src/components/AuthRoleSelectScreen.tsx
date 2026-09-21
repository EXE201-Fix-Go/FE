import React, { useState } from 'react';
import { ASSETS } from '../data';
import { EntryDestination } from '../types';

interface AuthRoleSelectScreenProps {
  onSelect: (dest: EntryDestination) => void;
}

/**
 * Màn đầu tiên — chọn vai trò TRƯỚC khi nhập SĐT.
 * Ràng role: mỗi tác nhân vào đúng app của mình.
 * Tác nhân: Khách hàng · Thợ độc lập · Tiệm sửa xe (→ Chủ tiệm / Nhân viên).
 */
export const AuthRoleSelectScreen: React.FC<AuthRoleSelectScreenProps> = ({ onSelect }) => {
  const [showShop, setShowShop] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface px-gutter">
      {/* Thương hiệu */}
      <div className="pt-safe" />
      <div className="pt-space-lg flex flex-col items-center text-center">
        <img src={ASSETS.logo} alt="Fix&Go" className="h-12 w-auto object-contain" />
        <h1 className="font-headline-lg text-on-surface mt-space-md">
          Fix&amp;Go đang phục vụ ai ạ?
        </h1>
        <p className="font-body-md text-on-surface-variant mt-space-xs">
          Chọn vai trò để vào đúng ứng dụng của bạn.
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-space-sm py-space-lg">
        {/* Khách hàng */}
        <button
          onClick={() => onSelect('customer')}
          className="group text-left rounded-3xl bg-surface-container-lowest border-2 border-surface-container-highest hover:border-primary p-space-md transition-all active:scale-[0.98] shadow-sm"
        >
          <div className="flex items-center gap-space-md">
            <div className="w-[52px] h-[52px] rounded-2xl bg-primary-container text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">two_wheeler</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-headline-md text-on-surface">Khách hàng</p>
              <p className="font-body-sm text-on-surface-variant mt-0.5">
                Gọi thợ cứu hộ khi xe hỏng
              </p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">
              chevron_right
            </span>
          </div>
        </button>

        {/* Thợ độc lập */}
        <button
          onClick={() => onSelect('mechanic')}
          className="group text-left rounded-3xl bg-surface-container-lowest border-2 border-surface-container-highest hover:border-tertiary p-space-md transition-all active:scale-[0.98] shadow-sm"
        >
          <div className="flex items-center gap-space-md">
            <div className="w-[52px] h-[52px] rounded-2xl bg-tertiary text-on-tertiary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">handyman</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-headline-md text-on-surface">Thợ độc lập</p>
              <p className="font-body-sm text-on-surface-variant mt-0.5">
                Tự nhận đơn, tự đối soát
              </p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-tertiary transition-colors">
              chevron_right
            </span>
          </div>
        </button>

        {/* Tiệm sửa xe → Chủ tiệm / Nhân viên */}
        <div
          className={`rounded-3xl border-2 p-space-md transition-all shadow-sm ${
            showShop
              ? 'bg-inverse-surface text-inverse-on-surface border-inverse-surface'
              : 'bg-surface-container-lowest border-surface-container-highest hover:border-tertiary'
          }`}
        >
          <button
            onClick={() => setShowShop((v) => !v)}
            className="w-full text-left flex items-center gap-space-md active:scale-[0.99] transition-all"
          >
            <div className="w-[52px] h-[52px] rounded-2xl bg-tertiary text-on-tertiary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">store</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-headline-md">Tiệm sửa xe</p>
              <p
                className={`font-body-sm mt-0.5 ${
                  showShop ? 'text-inverse-on-surface/70' : 'text-on-surface-variant'
                }`}
              >
                Dành cho chủ tiệm và nhân viên
              </p>
            </div>
            <span
              className={`material-symbols-outlined transition-transform ${
                showShop ? 'rotate-180 text-tertiary-fixed' : 'text-on-surface-variant'
              }`}
            >
              expand_more
            </span>
          </button>

          {showShop && (
            <div className="mt-space-md flex flex-col gap-space-xs">
              {[
                {
                  dest: 'shop' as const,
                  icon: 'store',
                  label: 'Chủ tiệm',
                  sub: 'Quản lý thợ & đơn của tiệm',
                },
                {
                  dest: 'staff' as const,
                  icon: 'badge',
                  label: 'Nhân viên',
                  sub: 'Nhận đơn của tiệm, xem thu nhập',
                },
              ].map((o) => (
                <button
                  key={o.dest}
                  onClick={() => onSelect(o.dest)}
                  className="flex items-center gap-space-sm rounded-2xl bg-white/10 hover:bg-white/15 px-space-sm py-space-sm active:scale-[0.99] transition-all text-left"
                >
                  <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-tertiary-fixed shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{o.icon}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-label-md">{o.label}</span>
                    <span className="block text-[12px] text-inverse-on-surface/70">{o.sub}</span>
                  </span>
                  <span className="material-symbols-outlined text-tertiary-fixed">arrow_forward</span>
                </button>
              ))}
              <p className="text-[11px] text-inverse-on-surface/60 px-1 pt-0.5">
                Tài khoản chủ tiệm được Fix&amp;Go xét duyệt khi đăng ký.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Đăng ký đối tác mới */}
      <button
        onClick={() => onSelect('register')}
        className="mb-space-lg mx-auto inline-flex items-center gap-1.5 text-tertiary font-label-md active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-[18px]">badge</span>
        Đăng ký làm đối tác mới (KYC)
      </button>
    </div>
  );
};
