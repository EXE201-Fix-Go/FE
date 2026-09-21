import React from 'react';
import { ASSETS } from '../data';

import { AuthUser } from '../api/auth';

interface CustomerProfileProps {
  onLogout: () => void;
  /** Tài khoản thật đang đăng nhập; không có → hiển thị mẫu. */
  user?: AuthUser | null;
}

export const CustomerProfileScreen: React.FC<CustomerProfileProps> = ({
  onLogout,
  user,
}) => {
  const name = user?.fullName || (user ? 'Khách Fix&Go' : 'Trần Thị Mai Lan');
  const contact = user ? user.phone ?? '' : '0908 123 456 • hieunghiatom@gmail.com';
  return (
    <div className="flex flex-col w-full px-gutter pb-24 space-y-space-md pt-2">
      {/* Profile Card */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container flex items-center gap-space-md">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container shrink-0 border-2 border-primary/20">
          <img
            alt="Customer profile"
            src={ASSETS.customerPortrait}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-headline-md text-headline-md text-on-surface truncate font-bold">
              {name}
            </h2>
            <span className="px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed text-[10px] font-bold uppercase">
              Thành viên VIP
            </span>
          </div>
          <p className="font-body-sm text-[12.5px] text-secondary mt-0.5">
            {contact}
          </p>
          <div className="flex items-center gap-1 mt-1 text-tertiary font-label-sm text-[11px] font-semibold">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            <span>Đã xác minh số điện thoại &amp; tài khoản</span>
          </div>
        </div>
      </div>


      {/* Saved Vehicles */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container space-y-space-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-label-md text-label-md text-on-surface font-bold">Phương tiện đã lưu</h3>
          <span className="font-label-sm text-[11px] text-primary cursor-pointer hover:underline">
            + Thêm xe
          </span>
        </div>

        <div className="space-y-2">
          <div className="p-[15px] bg-surface-container-low rounded-xl flex items-center justify-between border border-surface-container">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-primary text-[22px]">two_wheeler</span>
              <div>
                <span className="font-label-md text-[13px] text-on-surface font-bold block">
                  Honda Vision 110i (Đỏ mận)
                </span>
                <span className="font-body-sm text-[11px] text-secondary">
                  Lốp không ruột Tubeless • Khóa Smartkey
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono font-bold text-[11px]">
              59-P1 888.88
            </span>
          </div>

          <div className="p-[15px] bg-surface-container-low rounded-xl flex items-center justify-between border border-surface-container">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-secondary text-[22px]">two_wheeler</span>
              <div>
                <span className="font-label-md text-[13px] text-on-surface font-bold block">
                  Honda Air Blade 125 (Đen nhám)
                </span>
                <span className="font-body-sm text-[11px] text-secondary">
                  Lốp có ruột • Đời 2019
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono font-bold text-[11px]">
              59-V1 123.45
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Contacts & Settings */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container space-y-2">
        <h3 className="font-label-md text-label-md text-on-surface font-bold pb-1">
          Hỗ trợ &amp; Thiết lập an toàn
        </h3>

        <a
          href="tel:19006868"
          className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-error text-[20px]">e911_emergency</span>
            <span className="font-body-sm text-[13px] text-on-surface">Hotline Khẩn Cấp 24/7 Fix&amp;Go</span>
          </div>
          <span className="font-label-sm text-[12px] text-primary font-bold">1900 6868</span>
        </a>

        <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-tertiary text-[20px]">shield</span>
            <span className="font-body-sm text-[13px] text-on-surface">Chính sách bảo hành 30 ngày</span>
          </div>
          <span className="material-symbols-outlined text-[16px] text-secondary">chevron_right</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container transition-colors">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary text-[20px]">receipt</span>
            <span className="font-body-sm text-[13px] text-on-surface">Thông tin xuất hóa đơn VAT</span>
          </div>
          <span className="material-symbols-outlined text-[16px] text-secondary">chevron_right</span>
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
