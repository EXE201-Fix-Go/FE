import React, { useState, useEffect } from 'react';
import { DEFAULT_MECHANIC } from '../data';
import { ServiceItem } from '../types';

interface CustomerRadarSearchingProps {
  service: ServiceItem;
  address: string;
  onCancel: () => void;
  onMechanicMatched: () => void;
}

export const CustomerRadarSearchingScreen: React.FC<CustomerRadarSearchingProps> = ({
  service,
  address,
  onCancel,
  onMechanicMatched,
}) => {
  const [seconds, setSeconds] = useState(38);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const messages = [
    'Đã gửi tín hiệu cứu hộ tới các thợ trong bán kính 2km...',
    'Thợ Nguyễn Văn Tuấn (cách 450m) đang xem yêu cầu...',
    'Ưu tiên kết nối trạm sửa chữa gần nhất tại Quận 1...',
    'Thời gian phản hồi dự kiến: dưới 60 giây',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [messages.length]);

  const formattedMins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const formattedSecs = (seconds % 60).toString().padStart(2, '0');

  return (
    <div className="flex flex-col w-full min-w-0 pb-12 select-none">
      {/* Power Saving Alert Banner */}
      <div className="px-gutter pt-space-xs pb-space-sm">
        <div className="flex items-center justify-between gap-space-sm px-space-md py-space-xs rounded-xl bg-inverse-surface text-inverse-on-surface shadow-sm">
          <div className="flex items-center gap-space-xs min-w-0">
            <span
              className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
            <p className="font-label-sm text-[12px] truncate">Chế độ tiết kiệm pin tự động bật</p>
          </div>
          <span className="font-label-sm text-[11px] text-secondary-fixed opacity-80 flex-shrink-0 whitespace-nowrap">
            Màn hình tối ưu
          </span>
        </div>
      </div>

      {/* Central Radar & Map Search Canvas Area */}
      <div className="relative w-full overflow-hidden bg-inverse-surface py-space-lg flex flex-col items-center justify-center min-h-[340px]">
        {/* Vignette / Radial Shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface via-transparent to-inverse-surface/80 pointer-events-none"></div>

        {/* Live Radar Ring Pulses */}
        <div className="relative flex items-center justify-center w-72 h-72">
          {/* Expanding Radar Wave 1 */}
          <div
            className="absolute inset-0 rounded-full bg-primary/20 animate-ping"
            style={{ animationDuration: '3s', animationIterationCount: 'infinite' }}
          ></div>
          {/* Expanding Radar Wave 2 */}
          <div
            className="absolute w-56 h-56 rounded-full bg-primary-container/15 animate-ping"
            style={{ animationDuration: '2.2s', animationDelay: '0.8s', animationIterationCount: 'infinite' }}
          ></div>
          {/* Static Distance Rings */}
          <div className="absolute w-64 h-64 rounded-full border border-white/5"></div>
          <div className="absolute w-44 h-44 rounded-full border border-white/10"></div>
          <div className="absolute w-24 h-24 rounded-full border border-white/15"></div>

          {/* Mechanic 1: Phía Tây Bắc (600m) */}
          <div
            className="absolute -top-1 left-16 flex flex-col items-center animate-pulse"
            style={{ animationDuration: '2s' }}
          >
            <div className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[16px]">two_wheeler</span>
            </div>
            <span className="mt-0.5 px-1.5 py-0.5 rounded-full bg-inverse-surface/90 text-[10px] font-label-sm text-tertiary-fixed font-bold leading-tight">
              600m
            </span>
          </div>

          {/* Mechanic 2: Phía Đông Bắc (1.1km) */}
          <div
            className="absolute top-8 right-8 flex flex-col items-center animate-pulse"
            style={{ animationDuration: '2.4s', animationDelay: '0.4s' }}
          >
            <div className="w-8 h-8 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[16px]">two_wheeler</span>
            </div>
            <span className="mt-0.5 px-1.5 py-0.5 rounded-full bg-inverse-surface/90 text-[10px] font-label-sm text-tertiary-fixed font-bold leading-tight">
              1.1km
            </span>
          </div>

          {/* Mechanic 3: Phía Nam (450m - Đang xem yêu cầu) */}
          <div
            className="absolute bottom-4 left-14 flex flex-col items-center animate-pulse cursor-pointer"
            style={{ animationDuration: '1.8s', animationDelay: '0.9s' }}
            onClick={onMechanicMatched}
            title="Bấm để kết nối ngay với thợ Tuấn"
          >
            <div className="w-8 h-8 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center shadow-md ring-2 ring-tertiary-fixed">
              <span className="material-symbols-outlined text-[16px]">two_wheeler</span>
            </div>
            <span className="mt-0.5 px-1.5 py-0.5 rounded-full bg-inverse-surface/90 text-[10px] font-label-sm text-tertiary-fixed font-bold leading-tight">
              450m
            </span>
          </div>

          {/* Mechanic 4: Phía Đông Nam (1.4km) */}
          <div
            className="absolute bottom-10 right-12 flex flex-col items-center animate-pulse"
            style={{ animationDuration: '2.6s', animationDelay: '1.2s' }}
          >
            <div className="w-7 h-7 rounded-full bg-tertiary/80 text-on-tertiary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[14px]">two_wheeler</span>
            </div>
            <span className="mt-0.5 px-1 py-0.5 rounded-full bg-inverse-surface/90 text-[9px] font-label-sm text-tertiary-fixed font-bold leading-tight">
              1.4km
            </span>
          </div>

          {/* Center User Beacon Marker */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_24px_rgba(163,57,0,0.6)]">
              <span className="material-symbols-outlined text-[32px] text-on-primary">fmd_bad</span>
              {/* Lightning Flare Mini-badge */}
              <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center shadow-sm">
                <span
                  className="material-symbols-outlined text-[14px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  bolt
                </span>
              </span>
            </div>
            <div className="mt-2 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 text-on-surface text-[11px] font-label-md font-bold shadow-sm">
              Vị trí của bạn
            </div>
          </div>
        </div>

        {/* Live Scan Status Ticker Badge */}
        <div className="relative z-10 mt-space-sm flex items-center gap-space-xs px-space-md py-2 rounded-full bg-surface-container-lowest/15 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-ping"></span>
          <span className="font-label-sm text-[12px] text-on-tertiary-container">
            Đang kết nối 4 thợ gần nhất
          </span>
        </div>
      </div>

      {/* Content & Control Deck */}
      <div className="px-gutter -mt-4 relative z-20 flex flex-col gap-space-md">
        {/* Fast Action trigger to simulate match */}
        <button
          onClick={onMechanicMatched}
          className="w-full py-3 px-3 rounded-xl bg-tertiary text-on-tertiary font-label-sm text-[13px] leading-snug font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform"
        >
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Thợ Nguyễn Văn Tuấn (450m) vừa nhận đơn! Bấm để xem trực tiếp →</span>
        </button>

        {/* Timer & Live Reassurance Counter Card */}
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-md flex items-center justify-between border border-surface-container">
          <div className="flex flex-col">
            <span className="font-label-sm text-[11px] text-on-secondary-container uppercase">
              Thời gian tìm kiếm
            </span>
            <div className="flex items-baseline gap-space-xs mt-0.5">
              <span className="font-data-metric-lg text-primary tracking-tight font-extrabold">
                {formattedMins}:{formattedSecs}
              </span>
              <span className="font-label-sm text-secondary">giây</span>
            </div>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="font-label-sm text-[11px] text-on-secondary-container uppercase">
              Thời gian phản hồi
            </span>
            <span className="font-headline-md text-headline-md text-tertiary mt-0.5 font-bold">
              &lt; 60 giây
            </span>
          </div>
        </div>

        {/* Dynamic Status Reassurance Ticker */}
        <div className="rounded-xl bg-surface-container-low p-space-md flex items-start gap-space-sm shadow-sm border border-surface-container">
          <span
            className="material-symbols-outlined text-[24px] text-primary flex-shrink-0 mt-0.5 animate-spin"
            style={{ animationDuration: '8s' }}
          >
            sync
          </span>
          <div className="flex flex-col min-w-0">
            <p className="font-body-sm text-[13.5px] text-on-surface font-medium transition-all duration-300">
              {messages[tickerIndex]}
            </p>
            <span className="font-label-sm text-[11px] text-on-secondary-container mt-1">
              Đội cứu hộ Fix&amp;Go hoạt động 24/7 tại Quận 1
            </span>
          </div>
        </div>

        {/* Service Details & Fixed Price Guarantee Card */}
        <div className="rounded-xl bg-surface-container-lowest p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container">
          <div className="flex items-center justify-between pb-space-xs">
            <span className="font-label-md text-label-md text-on-surface flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-[18px] text-primary">build_circle</span>
              Thông tin yêu cầu cứu trợ
            </span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-container font-label-sm text-[11px] text-on-secondary-fixed font-bold">
              Khẩn cấp
            </span>
          </div>

          {/* Service Name & Spec */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-body-md text-body-md text-on-surface font-semibold truncate">
                {service.name}
              </p>
              <p className="font-body-sm text-[12px] text-secondary truncate mt-0.5">
                Xe Honda Air Blade • 59-P1 888.88
              </p>
            </div>
            <div className="text-right flex-shrink-0 pl-space-sm">
              <span className="font-data-metric-md text-[20px] text-on-surface font-bold">30.000 ₫</span>
              <p className="font-label-sm text-[11px] text-tertiary font-bold">Phí xuất phát cố định</p>
            </div>
          </div>

          {/* Incident Location with Pin */}
          <div className="flex items-start gap-space-xs pt-space-xs">
            <span className="material-symbols-outlined text-[18px] text-primary-container flex-shrink-0 mt-0.5">
              location_on
            </span>
            <p className="font-body-sm text-[12.5px] text-on-surface-variant line-clamp-2">
              {address}
            </p>
          </div>

          {/* Verified Rescue Trust Badge */}
          <div className="mt-space-xs pt-space-xs flex items-center justify-between rounded-lg bg-surface-container-low px-space-sm py-2">
            <div className="flex items-center gap-1.5 text-tertiary">
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <span className="font-label-sm text-[11px] font-semibold">
                Báo giá minh bạch, không phụ phí
              </span>
            </div>
            <span className="font-label-sm text-[11px] text-secondary">Fix&amp;Go Care</span>
          </div>
        </div>

        {/* Action Section: Cancel Rescue Button */}
        <div className="pt-space-xs flex flex-col gap-space-xs">
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full h-12 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center justify-center gap-space-xs active:bg-surface-container-highest transition-colors font-bold"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary">close</span>
            <span>Hủy tìm kiếm cứu hộ</span>
          </button>
          <p className="font-label-sm text-[12px] text-secondary text-center">
            Cần trợ giúp thoại ngay? Gọi{' '}
            <a className="text-primary font-bold underline" href="tel:19006868">
              1900 6868
            </a>{' '}
            (Miễn cước)
          </p>
        </div>
      </div>

      {/* Modal Confirmation for Cancellation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-inverse-surface/60 backdrop-blur-xs px-gutter pb-safe">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-space-lg shadow-2xl flex flex-col gap-space-md mb-space-md animate-in fade-in slide-in-from-bottom-6">
            <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <div className="text-center">
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold">
                Xác nhận hủy yêu cầu?
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs">
                Các kỹ thuật viên đang chuẩn bị nhận điều phối đến vị trí {address}. Bạn có chắc chắn muốn hủy?
              </p>
            </div>
            <div className="flex flex-col gap-space-sm pt-space-xs">
              <button
                className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center shadow-md active:bg-primary-container transition-colors font-bold"
                onClick={() => setShowCancelModal(false)}
                type="button"
              >
                Tiếp tục tìm thợ (Đang kết nối)
              </button>
              <button
                className="w-full h-11 rounded-xl bg-surface-container-low text-error font-label-md text-label-md flex items-center justify-center hover:bg-error-container hover:text-on-error-container transition-colors font-bold"
                onClick={() => {
                  setShowCancelModal(false);
                  onCancel();
                }}
                type="button"
              >
                Đồng ý hủy yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
