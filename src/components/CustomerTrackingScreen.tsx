import React, { useState } from 'react';
import { MapView, MapMarker } from './MapView';
import { confirmDialog } from './notify';

interface CustomerTrackingProps {
  onCancel: () => void;
  /** Dữ liệu thật của đơn đang theo dõi (App tự chuyển màn theo trạng thái). */
  live: {
    orderCode: string;
    status: string;
    statusLabel: string;
    mechanicName?: string | null;
    mechanicPhone?: string | null;
    address: string;
    customerLat?: number;
    customerLng?: number;
    partnerLat?: number | null;
    partnerLng?: number | null;
  };
}

const STEPS = [
  { label: 'Đã nhận', icon: 'check' },
  { label: 'Đang đến', icon: 'navigation' },
  { label: 'Đã tới nơi', icon: 'place' },
  { label: 'Sửa chữa', icon: 'build' },
];

export const CustomerTrackingScreen: React.FC<CustomerTrackingProps> = ({ onCancel, live }) => {
  const mechanicName = live.mechanicName || 'Thợ Fix&Go';
  const mechanicPhone = live.mechanicPhone || null;
  const arrived = live.status !== 'ASSIGNED';

  // Ghim thật trên bản đồ: khách + thợ (nếu backend đã có toạ độ).
  const mapCenter =
    live.customerLat != null && live.customerLng != null ? { lat: live.customerLat, lng: live.customerLng } : null;
  const mapMarkers: MapMarker[] = [];
  if (live.customerLat != null && live.customerLng != null)
    mapMarkers.push({ lat: live.customerLat, lng: live.customerLng, label: 'Vị trí của bạn', tone: 'primary' });
  if (live.partnerLat != null && live.partnerLng != null)
    mapMarkers.push({ lat: live.partnerLat, lng: live.partnerLng, label: `${mechanicName} (thợ)`, tone: 'tertiary' });
  // Bước hiện tại trên thanh tiến trình theo trạng thái thật (§7.1)
  const stepIndex =
    live.status === 'ASSIGNED'
      ? 1
      : ['ARRIVED', 'CHECKING', 'WAITING_FOR_APPROVAL', 'APPROVED'].includes(live.status)
      ? 2
      : 3;
  const [isRotating, setIsRotating] = useState(false);

  const handleRecenter = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 300);
  };

  return (
    <div className="flex flex-col w-full relative min-h-screen pb-safe">
      {/* Live Tracking Map Section (Top ~42%) */}
      <div className="relative w-full h-[340px] overflow-hidden bg-surface-container">
        {/* Map Canvas Viewport — bản đồ Leaflet thật (khách + thợ) */}
        {mapCenter ? (
          <MapView center={mapCenter} zoom={14} markers={mapMarkers} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[40px]">location_searching</span>
          </div>
        )}

        {/* Floating Top status pill */}
        <div className="absolute top-4 inset-x-margin px-4 flex items-center justify-between z-[500]">
          <div className="bg-surface-container-lowest/95 backdrop-blur-md px-space-md py-space-xs rounded-full shadow-lg flex items-center gap-space-sm border border-surface-container">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary"></span>
            </span>
            <span className="font-label-md text-label-md text-on-surface font-bold">{live.statusLabel}</span>
          </div>

          <button
            aria-label="Định vị lại"
            onClick={handleRecenter}
            className={`w-10 h-10 rounded-full bg-surface-container-lowest shadow-lg flex items-center justify-center text-on-surface active:scale-95 transition-transform ${
              isRotating ? 'rotate-45' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">my_location</span>
          </button>
        </div>

        {/* User Pin Address Tag overlay */}
        <div className="absolute bottom-6 left-4 bg-surface-container-lowest/90 backdrop-blur-sm px-space-sm py-1 rounded-lg shadow-sm flex items-center gap-1 z-[500]">
          <span className="material-symbols-outlined text-primary text-[16px]">location_on</span>
          <span className="font-label-sm text-[12px] text-on-surface truncate max-w-[210px] font-medium">
            {live.address}
          </span>
        </div>
      </div>

      {/* Dispatch Tracking Sheet (Bottom ~58%) */}
      <div className="relative bg-surface-container-lowest rounded-t-[28px] -mt-4 shadow-[0_-6px_24px_rgba(11,28,48,0.08)] px-gutter pt-space-md pb-space-lg flex flex-col gap-space-md z-10">
        {/* Grabber Indicator */}
        <div className="w-12 h-1.5 bg-surface-container-high rounded-full self-center"></div>

        {/* Live status line */}
        <div className="w-full py-2.5 px-[15px] rounded-xl bg-surface-container flex items-center justify-between gap-2">
          <span className="font-body-sm text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary animate-pulse">sync</span>
            {live.statusLabel}
          </span>
          <span className="font-label-sm text-secondary">{live.orderCode}</span>
        </div>

        {/* Main Live Dispatch Header */}
        <div className="flex flex-col">
          <span className="font-label-sm text-[11px] text-primary uppercase tracking-wider font-bold">
            {arrived ? 'Thợ đang xử lý tại chỗ' : 'Thợ đang di chuyển tới bạn'}
          </span>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">
            {live.statusLabel}
          </h2>
        </div>

        {/* Four-Step Status Journey Tracker */}
        <div className="bg-surface-container-low rounded-xl p-[15px] flex flex-col gap-1.5 border border-surface-container">
          <div className="flex items-center justify-between relative px-2">
            {/* Connecting Track Bar */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-surface-container-highest -z-0"></div>
            <div className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-primary -z-0" style={{ width: `${[6, 36, 66, 96][stepIndex] ?? 36}%` }}></div>

            {STEPS.map((st, i) => {
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <div key={st.label} className="flex flex-col items-center gap-1 z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      done
                        ? 'bg-primary text-on-primary shadow-sm'
                        : active
                        ? 'bg-primary-container text-on-primary ring-4 ring-primary-fixed/60 shadow-md animate-pulse'
                        : 'bg-surface-container-highest text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{done ? 'check' : st.icon}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-center px-0 font-label-sm text-[11px]">
            {STEPS.map((st, i) => (
              <span
                key={st.label}
                className={`w-1/4 ${i < stepIndex ? 'text-on-surface font-semibold' : i === stepIndex ? 'text-primary font-bold' : 'text-secondary'}`}
              >
                {st.label}
              </span>
            ))}
          </div>
        </div>

        {/* Mechanic Profile Card */}
        <div className="bg-surface-container-lowest rounded-xl p-[15px] shadow-[0_2px_12px_rgba(11,28,48,0.06)] flex items-center gap-space-md border border-surface-container">
          <div
            aria-hidden
            className="w-16 h-16 rounded-xl flex-shrink-0 bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-headline-md text-[24px] font-bold"
          >
            {mechanicName.trim().charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-headline-md text-[17px] leading-tight text-on-surface truncate font-bold">
              {mechanicName}
            </h3>
            {mechanicPhone && (
              <span className="font-body-sm text-[12px] text-secondary">{mechanicPhone}</span>
            )}
          </div>
        </div>

        {/* Call button */}
        {mechanicPhone && (
          <a
            aria-label="Gọi điện thoại trực tiếp cho thợ cứu hộ"
            className="h-[52px] bg-primary hover:bg-primary-container text-on-primary rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all font-bold"
            href={`tel:${mechanicPhone}`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              call
            </span>
            <span className="font-label-lg text-label-lg">Gọi cho thợ</span>
          </a>
        )}

        {/* Cancel */}
        <div className="flex items-center justify-start pt-1">
          <button
            onClick={async () => {
              const ok = await confirmDialog(
                `Thợ ${mechanicName} đang xử lý đơn này. Bạn có chắc muốn hủy chuyến cứu hộ?`,
                { okText: 'Hủy chuyến', cancelText: 'Giữ lại', danger: true }
              );
              if (ok) onCancel();
            }}
            className="font-body-sm text-[13px] text-secondary hover:text-error transition-colors px-2 py-1"
            type="button"
          >
            Hủy yêu cầu cứu hộ
          </button>
        </div>
      </div>
    </div>
  );
};
