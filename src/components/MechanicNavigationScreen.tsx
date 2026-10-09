import React from 'react';
import { MapView } from './MapView';

interface MechanicNavigationProps {
  /** Bấm "Đã tới nơi" — async (ARRIVED → CHECKING). */
  onArrived: () => Promise<void> | void;
  /** Từ chối/hủy đơn sau khi đối tác đã nhận nhưng chưa hoàn tất. */
  onCancelOrder: () => Promise<void> | void;
  /** Đơn thật đang thực hiện. */
  live: {
    orderCode: string;
    contactName?: string | null;
    contactPhone?: string | null;
    addressText: string;
    note?: string | null;
    serviceName: string;
    photoUrls?: string[];
    lat: number;
    lng: number;
  };
  onBackToDashboard: () => void;
}

export const MechanicNavigationScreen: React.FC<MechanicNavigationProps> = ({
  onArrived,
  onCancelOrder,
  live,
  onBackToDashboard,
}) => {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${live.lat},${live.lng}&travelmode=motorcycle`;
  const customerName = live.contactName || live.contactPhone || live.orderCode;

  return (
    <div className="flex flex-col w-full min-h-screen bg-inverse-surface relative pb-safe select-none">
      {/* Top banner: điểm đến */}
      <div className="fixed top-0 inset-x-0 max-w-md mx-auto z-40 bg-inverse-surface/95 backdrop-blur-md pt-safe shadow-lg border-b border-white/10">
        <div className="px-gutter py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-tertiary text-white flex items-center justify-center shadow-md shrink-0">
              <span className="material-symbols-outlined text-[28px]">location_on</span>
            </div>
            <div className="min-w-0">
              <span className="font-label-sm text-[11px] uppercase tracking-wider text-tertiary-fixed font-bold block">
                Điểm đến cứu hộ
              </span>
              <h2 className="font-headline-md text-[16px] text-white font-bold leading-tight line-clamp-2">
                {live.addressText}
              </h2>
            </div>
          </div>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 px-3 h-10 rounded-xl bg-white/10 text-white font-label-md font-bold flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">directions</span>
            Chỉ đường
          </a>
        </div>
      </div>

      {/* Bản đồ điểm đến */}
      <div className="relative w-full h-[55vh] mt-20 overflow-hidden bg-surface-container">
        <MapView
          center={{ lat: live.lat, lng: live.lng }}
          zoom={15}
          markers={[{ lat: live.lat, lng: live.lng, label: customerName, tone: 'primary' }]}
          className="w-full h-full"
        />
      </div>

      {/* Customer Contact & Status Deck */}
      <div className="relative z-30 bg-surface-container-lowest rounded-t-[24px] -mt-6 p-gutter flex flex-col gap-space-md shadow-2xl">
        <div className="w-10 h-1 bg-surface-container-highest rounded-full self-center"></div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              aria-hidden
              className="w-12 h-12 rounded-full shrink-0 bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-label-lg font-bold border border-surface-container"
            >
              {customerName.trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold truncate">{customerName}</h3>
              <p className="font-body-sm text-[12px] text-secondary mt-0.5 truncate">
                {live.serviceName} • {live.orderCode}
              </p>
            </div>
          </div>

          {live.contactPhone && (
            <a
              href={`tel:${live.contactPhone}`}
              aria-label="Gọi khách"
              className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-md active:scale-95 shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">call</span>
            </a>
          )}
        </div>

        {/* Ghi chú + ảnh hiện trường */}
        <div className="p-[15px] bg-surface-container-low rounded-xl flex items-start gap-2.5 border border-surface-container">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">edit_note</span>
          <div className="min-w-0">
            <span className="font-label-sm text-[11px] text-secondary font-bold uppercase block">Ghi chú của khách</span>
            <span className="font-body-sm text-[13.5px] text-on-surface font-semibold block">{live.note || '—'}</span>
            {live.photoUrls && live.photoUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto mt-2">
                {live.photoUrls.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noreferrer" className="shrink-0">
                    <img src={u} alt="Ảnh hiện trường" className="w-20 h-20 rounded-lg object-cover border border-surface-container" />
                  </a>
                ))}
              </div>
            )}
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

        <button
          type="button"
          onClick={onCancelOrder}
          className="w-full h-11 rounded-xl border border-error/40 text-error font-label-md font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
        >
          <span className="material-symbols-outlined text-[19px]">cancel</span>
          <span>TỪ CHỐI ĐƠN</span>
        </button>
      </div>
    </div>
  );
};
