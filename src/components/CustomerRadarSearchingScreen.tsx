import React, { useState, useEffect } from 'react';
import { formatVND } from '../domain/money';
import { ServiceItem } from '../types';

interface CustomerRadarSearchingProps {
  service: ServiceItem;
  address: string;
  onCancel: () => void;
  /** Phí xuất phát đã chốt trên đơn (callOutFee của BE). */
  callOutFee?: number | null;
  /** Mã đơn thật + dòng trạng thái từ backend (đang phát tín hiệu vòng mấy…). */
  orderCode?: string;
  statusText?: string;
}

export const CustomerRadarSearchingScreen: React.FC<CustomerRadarSearchingProps> = ({
  service,
  address,
  onCancel,
  callOutFee,
  orderCode,
  statusText,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const messages = [
    'Đã gửi tín hiệu cứu hộ tới các thợ gần vị trí của bạn...',
    'Nếu chưa ai nhận, hệ thống tự mở rộng bán kính tìm thợ...',
    'Bạn có thể hủy bất cứ lúc nào trước khi thợ tới nơi.',
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
            Đang tìm thợ gần bạn
          </span>
        </div>
      </div>

      {/* Content & Control Deck */}
      <div className="px-gutter -mt-4 relative z-20 flex flex-col gap-space-md">
        <div className="w-full py-3 px-[15px] rounded-xl bg-surface-container-lowest shadow-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[20px] text-primary animate-pulse">cell_tower</span>
            <span className="font-body-sm text-on-surface-variant truncate">{statusText ?? 'Đang phát tín hiệu tới thợ gần bạn…'}</span>
          </div>
          {orderCode && <span className="font-label-sm text-secondary shrink-0">{orderCode}</span>}
        </div>

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
            </div>
            <div className="text-right flex-shrink-0 pl-space-sm">
              <span className="font-data-metric-md text-[20px] text-on-surface font-bold">
                {callOutFee != null ? formatVND(callOutFee) : '—'}
              </span>
              <p className="font-label-sm text-[11px] text-tertiary font-bold">Phí xuất phát</p>
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
                Báo giá minh bạch trước khi sửa
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
