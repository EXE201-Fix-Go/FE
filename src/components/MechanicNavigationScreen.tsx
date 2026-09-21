import React, { useState } from 'react';
import { ASSETS } from '../data';

interface MechanicNavigationProps {
  /** Bấm "Đã tới nơi" — khi nối backend là async (ARRIVED → CHECKING). */
  onArrived: () => Promise<void> | void;
  /** Đơn thật (tên khách, địa chỉ, ghi chú); không có → mẫu. */
  live?: { orderCode: string; contactName?: string | null; addressText: string; note?: string | null; serviceName: string };
  onBackToDashboard: () => void;
}

export const MechanicNavigationScreen: React.FC<MechanicNavigationProps> = ({
  onArrived,
  live,
  onBackToDashboard,
}) => {
  const [speed, setSpeed] = useState(32);

  return (
    <div className="flex flex-col w-full min-h-screen bg-inverse-surface relative pb-safe select-none">
      {/* Top Turn-by-Turn Instruction Banner */}
      <div className="fixed top-0 inset-x-0 max-w-md mx-auto z-40 bg-inverse-surface/95 backdrop-blur-md pt-safe shadow-lg border-b border-white/10">
        <div className="px-gutter py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-tertiary text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[32px]">turn_right</span>
            </div>
            <div>
              <span className="font-label-sm text-[11px] uppercase tracking-wider text-tertiary-fixed font-bold block">
                Sau 150m nữa
              </span>
              <h2 className="font-headline-md text-headline-md text-white font-bold leading-tight">
                Rẽ phải vào Nguyễn Trãi
              </h2>
            </div>
          </div>

          {/* Speed Indicator */}
          <div className="flex flex-col items-center bg-white/10 px-2.5 py-1 rounded-xl">
            <span className="font-data-metric-md text-[20px] text-white leading-none font-extrabold">
              {speed}
            </span>
            <span className="text-[10px] text-white/70 uppercase">km/h</span>
          </div>
        </div>
      </div>

      {/* Live Map GPS Canvas */}
      <div className="relative w-full h-[62vh] mt-20 overflow-hidden bg-surface-container">
        <div
          className="w-full h-full bg-cover bg-center filter brightness-95"
          style={{ backgroundImage: `url('${ASSETS.mapTrackingLive}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30 pointer-events-none"></div>

        {/* Floating Route Info Pill */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-inverse-surface/90 backdrop-blur-md text-white px-3.5 py-2 rounded-full shadow-lg border border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-tertiary animate-ping"></span>
          <span className="font-label-md text-label-md font-bold">Còn 850m</span>
          <span className="text-white/60">•</span>
          <span className="font-label-md text-label-md text-tertiary-fixed font-bold">~3 phút</span>
        </div>

        {/* Floating Recenter and Compass */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button
            onClick={() => setSpeed((prev) => (prev === 32 ? 38 : 32))}
            className="w-10 h-10 rounded-full bg-inverse-surface/90 text-white flex items-center justify-center shadow-lg border border-white/10 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">explore</span>
          </button>
        </div>

        {/* Mechanic moving marker */}
        <div className="absolute top-[45%] left-[52%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-xl ring-4 ring-primary/40 animate-pulse">
            <span className="material-symbols-outlined text-[26px]">navigation</span>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-full bg-black/80 text-white text-[10px] font-bold">
            Xe của bạn
          </span>
        </div>
      </div>

      {/* Customer Contact & Status Deck */}
      <div className="relative z-30 bg-surface-container-lowest rounded-t-[24px] -mt-6 p-gutter flex flex-col gap-space-md shadow-2xl">
        <div className="w-10 h-1 bg-surface-container-highest rounded-full self-center"></div>

        {/* Customer Information Preview */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={ASSETS.customerPortrait}
              alt="Customer"
              className="w-12 h-12 rounded-full object-cover shadow-sm border border-surface-container"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                  {live?.contactName || 'Trần Thị Mai Lan'}
                </h3>
                <span className="px-1.5 py-0.2 rounded bg-tertiary-container text-on-tertiary text-[10px] font-bold">
                  VIP
                </span>
              </div>
              <p className="font-body-sm text-[12px] text-secondary mt-0.5">
                {live ? `${live.serviceName} • ${live.orderCode}` : 'Honda Vision 2022 • 59-P1 888.88'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:0908123456"
              className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-md active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
            </a>
            <button
              onClick={() => alert('Đã gửi tin nhắn: "Tôi sắp đến nơi, cách 300m nữa nhé!"')}
              className="w-11 h-11 rounded-full bg-surface-container text-on-surface flex items-center justify-center shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
            </button>
          </div>
        </div>

        {/* Destination Target Location */}
        <div className="p-[15px] bg-surface-container-low rounded-xl flex items-start gap-2.5 border border-surface-container">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
            location_on
          </span>
          <div>
            <span className="font-label-sm text-[11px] text-secondary font-bold uppercase block">
              Điểm đến cứu hộ
            </span>
            <span className="font-body-sm text-[13.5px] text-on-surface font-semibold block">
              {live ? live.addressText : '242 Cống Quỳnh, P. Phạm Ngũ Lão, Q.1'}
            </span>
            <span className="font-body-sm text-[12px] text-primary mt-0.5 block">
              Ghi chú: {live ? live.note || '—' : 'Xe Vision đỏ dựng trước cổng Circle K'}
            </span>
          </div>
        </div>

        {/* Action Button: Arrived */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onBackToDashboard}
            className="w-14 h-14 rounded-xl bg-surface-container text-secondary flex items-center justify-center"
            title="Quay lại bảng tin"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <button
            onClick={onArrived}
            className="flex-1 h-14 bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
          >
            <span className="material-symbols-outlined text-[24px]">task_alt</span>
            <span>ĐÃ TỚI NƠI • LẬP BÁO GIÁ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
