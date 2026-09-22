import React, { useRef, useState } from 'react';
import { ASSETS, SERVICES } from '../data';
import { ServiceItem } from '../types';
import { ServerMessage } from './ServerMessage';
import { MapView } from './MapView';
import { Coords } from '../domain/geo';
import { toast } from './notify';

const MAX_PHOTOS = 6;

interface CustomerConfirmRequestProps {
  selectedService: ServiceItem;
  currentAddress: string;
  onBack: () => void;
  /** Gửi đơn lên backend; ném lỗi nếu thất bại → màn báo và cho thử lại. */
  onConfirmDispatch: (note: string, extraServiceIds: string[], photos: File[]) => Promise<void>;
  onChangeService: () => void;
  onEditAddress: () => void;
  /** Sai số GPS (mét) nếu đã định vị được — hiển thị để khách yên tâm toạ độ gửi đi là thật. */
  gpsAccuracy?: number | null;
  /** Định vị lại bằng GPS (cập nhật toạ độ + tên địa chỉ). */
  onLocate?: () => void;
  /** Đang lấy vị trí — hiện spinner ở nút định vị. */
  isLocating?: boolean;
  /** Toạ độ GPS thật để ghim lên bản đồ (không có → dùng ảnh tĩnh dự phòng). */
  coords?: Coords | null;
}

export const CustomerConfirmRequestScreen: React.FC<CustomerConfirmRequestProps> = ({
  selectedService,
  currentAddress,
  onBack,
  onConfirmDispatch,
  onChangeService,
  onEditAddress,
  gpsAccuracy,
  onLocate,
  isLocating,
  coords,
}) => {
  const [note, setNote] = useState('Xe Honda Vision đỏ dựng trước cổng Circle K');
  const [isRotating, setIsRotating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Dịch vụ thêm (ngoài dịch vụ chính chọn từ trang chủ)
  const [extra, setExtra] = useState<string[]>([]);
  const addableServices = SERVICES.filter((s) => s.id !== selectedService.id);
  const toggleExtra = (id: string) =>
    setExtra((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  // Ảnh hiện trường / bằng chứng
  const [photos, setPhotos] = useState<{ id: string; url: string; file: File }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files)
      .slice(0, MAX_PHOTOS - photos.length)
      .map((f) => ({ id: `${Date.now()}-${Math.random()}`, url: URL.createObjectURL(f), file: f }));
    setPhotos((p) => [...p, ...next]);
  };
  const removePhoto = (id: string) => setPhotos((p) => p.filter((x) => x.id !== id));

  const handleRecenter = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 400);
    onLocate?.(); // định vị lại thật (cập nhật toạ độ + tên địa chỉ)
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onConfirmDispatch(note, extra, photos.map((p) => p.file));
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Không gửi được yêu cầu.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full relative min-h-screen pb-safe">
      {/* Map Canvas Section (Top Mobile Viewport) — bản đồ Leaflet thật ghim đúng GPS */}
      <div className="relative w-full h-[360px] overflow-hidden bg-surface-container-low select-none">
        {coords ? (
          <MapView
            center={{ lat: coords.lat, lng: coords.lng }}
            accuracy={coords.accuracy}
            markers={[{ lat: coords.lat, lng: coords.lng, label: currentAddress, tone: 'primary' }]}
            className="w-full h-full"
          />
        ) : (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url('${ASSETS.mapSnapshotHome}')` }}
          />
        )}

        {/* Nhãn địa chỉ + độ chính xác GPS */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-[500]">
          <div className="flex items-center gap-space-xs bg-surface-container-lowest/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md min-w-0">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse flex-shrink-0"></span>
            <span className="font-label-sm text-[12px] text-on-surface truncate max-w-[200px]">{currentAddress}</span>
          </div>
          {gpsAccuracy != null && (
            <div className="bg-surface-container-lowest/95 backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-md flex items-center gap-1 flex-shrink-0">
              <span className="material-symbols-outlined text-[16px] text-tertiary">near_me</span>
              <span className="font-label-sm text-[12px] text-on-surface">±{Math.round(gpsAccuracy)}m</span>
            </div>
          )}
        </div>

        {/* GPS Floating Actions (Right Flank) */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2.5 z-[500]">
          <button
            aria-label="Định vị lại vị trí"
            onClick={handleRecenter}
            disabled={isLocating}
            className={`w-11 h-11 bg-surface-container-lowest text-on-surface rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform hover:bg-surface-container ${
              isRotating && !isLocating ? 'rotate-180 duration-300' : ''
            }`}
          >
            <span className={`material-symbols-outlined text-[22px] text-primary ${isLocating ? 'animate-spin' : ''}`}>
              {isLocating ? 'progress_activity' : 'my_location'}
            </span>
          </button>
          <button
            aria-label="Chế độ xem phố"
            onClick={() => toast(`Vị trí: ${currentAddress}`, 'info')}
            className="w-11 h-11 bg-surface-container-lowest text-on-surface rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[22px] text-secondary">streetview</span>
          </button>
        </div>

        {/* Quick Radius Notification pill */}
        <div className="absolute bottom-4 left-4 z-20">
          <div className="bg-surface-container-lowest/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-tertiary">moped</span>
            <span className="font-label-sm text-[12px] text-on-surface font-semibold">
              4 thợ gần nhất (~4-8 phút)
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Confirmation Sheet */}
      <div className="relative w-full bg-surface-container-lowest rounded-t-[24px] shadow-[0_-8px_24px_rgba(11,28,48,0.08)] px-gutter pt-4 pb-8 flex flex-col gap-3.5 z-30">
        {/* Drag Handle / Grabber Indicator */}
        <div className="w-10 h-1 bg-surface-container-highest rounded-full self-center mb-0.5"></div>

        {/* Dịch vụ cần hỗ trợ — dịch vụ chính + thêm dịch vụ khác */}
        <div className="bg-surface-container-low p-[15px] rounded-xl flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
              Dịch vụ cần hỗ trợ
            </span>
            <span className="text-[11px] text-primary font-bold">
              {1 + extra.length} dịch vụ
            </span>
          </div>

          {/* Dịch vụ chính */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  {selectedService.icon}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-md text-on-surface truncate">
                  {selectedService.name}
                </span>
                <span className="text-[12px] text-on-surface-variant">
                  Giá từ {selectedService.priceDisplay}₫ · dịch vụ chính
                </span>
              </div>
            </div>
            <button
              onClick={onChangeService}
              className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors text-[12px] font-bold flex-shrink-0"
            >
              Đổi
            </button>
          </div>

          {/* Dịch vụ đã thêm (pill có nút xóa) */}
          {extra.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {extra.map((id) => {
                const s = SERVICES.find((x) => x.id === id);
                if (!s) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 bg-primary-fixed text-on-primary-fixed pl-2.5 pr-1 py-1 rounded-full text-[12px] font-bold"
                  >
                    {s.name}
                    <button
                      type="button"
                      onClick={() => toggleExtra(id)}
                      aria-label={`Bỏ ${s.name}`}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Thêm dịch vụ khác — chip cuộn ngang */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">add_circle</span>
              <span className="font-label-sm text-[11px] text-on-surface-variant">
                Thêm dịch vụ khác (không bắt buộc)
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-[15px] px-[15px] pb-0.5">
              {addableServices.map((s) => {
                const on = extra.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleExtra(s.id)}
                    className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[12px] font-medium transition-colors ${
                      on
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-lowest text-on-surface border-surface-container-high hover:border-primary/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {on ? 'check' : s.icon}
                    </span>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Verified Breakdown Location Bar */}
        <div className="flex items-start gap-2.5 bg-surface-container-lowest p-[15px] rounded-xl shadow-sm border border-surface-container">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px] text-primary">location_on</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-label-sm text-[11px] text-on-surface-variant font-semibold">
              Địa chỉ gặp sự cố
            </span>
            <span className="font-body-sm text-[13.5px] text-on-surface font-medium leading-tight line-clamp-2 mt-0.5">
              {currentAddress}
            </span>
            {gpsAccuracy != null && (
              <span className="font-label-sm text-[11px] text-tertiary font-semibold flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[13px]">gps_fixed</span>
                Toạ độ GPS · ±{Math.round(gpsAccuracy)}m
              </span>
            )}
          </div>
          <button
            aria-label="Sửa địa chỉ"
            onClick={onEditAddress}
            className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container-low transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        </div>

        {/* Optional Driver Instruction / Visual Landmark Input */}
        <div className="flex items-center gap-2.5 bg-surface-container-low px-3 py-2.5 rounded-xl focus-within:bg-surface-container transition-colors border border-surface-container">
          <span className="material-symbols-outlined text-[20px] text-secondary flex-shrink-0">
            edit_note
          </span>
          <input
            className="bg-transparent w-full text-on-surface placeholder:text-on-secondary-container font-body-sm text-body-sm outline-none border-0 p-0"
            placeholder="Ghi chú cho thợ (Vd: Xe Vision đỏ trước Circle K...)"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Ảnh hiện trường — bằng chứng, giúp thợ chuẩn bị đúng đồ nghề */}
        <div className="bg-surface-container-low p-[15px] rounded-xl flex flex-col gap-space-sm border border-surface-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-primary">photo_camera</span>
              <span className="font-label-md text-on-surface font-bold">Ảnh hiện trường</span>
            </div>
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              {photos.length}/{MAX_PHOTOS}
            </span>
          </div>
          <p className="text-[12px] text-on-surface-variant leading-relaxed">
            Chụp lỗi xe hoặc vị trí để thợ mang đúng đồ nghề và làm bằng chứng khi bàn giao.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            hidden
            onChange={(e) => {
              addPhotos(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="flex flex-wrap gap-2">
            {photos.map((p) => (
              <div
                key={p.id}
                className="relative w-16 h-16 rounded-lg overflow-hidden border border-surface-container"
              >
                <img src={p.url} alt="Ảnh hiện trường" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label="Xóa ảnh"
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-inverse-surface/80 text-inverse-on-surface flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 text-primary flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
                <span className="text-[10px] font-bold">Chụp</span>
              </button>
            )}
          </div>
        </div>

        {/* Fee Callout Card (High Trust & Utilitarian Transparency) */}
        <div className="bg-surface-container-high/60 p-[15px] rounded-xl flex flex-col gap-1.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-primary">receipt_long</span>
              <span className="font-label-md text-label-md text-on-surface font-bold">
                Phí xuất phát (Call-out fee)
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-data-metric-md text-[20px] text-primary font-bold">30.000</span>
              <span className="font-label-md text-label-md text-primary font-bold">₫</span>
            </div>
          </div>
          <p className="font-body-sm text-[12px] text-on-surface-variant leading-relaxed">
            Bao gồm toàn bộ chi phí thợ mang đồ nghề di chuyển tận nơi để kiểm tra và xử lý tại chỗ.
          </p>
        </div>

        {/* Main Full-Width Thumb CTA Action */}
        <div className="pt-1 flex flex-col gap-2">
          {submitError && (
            <ServerMessage variant="error">{submitError}</ServerMessage>
          )}
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full h-14 bg-primary hover:bg-primary-container active:scale-[0.99] text-on-primary rounded-xl font-label-lg text-label-lg uppercase tracking-wide flex items-center justify-between px-5 shadow-[0_8px_20px_rgba(163,57,0,0.3)] transition-all font-bold"
          >
            <span className="flex items-center gap-2">
              <span
                className={`material-symbols-outlined text-[22px] ${
                  isSubmitting ? 'animate-spin' : ''
                }`}
              >
                {isSubmitting ? 'progress_activity' : 'radar'}
              </span>
              <span>{isSubmitting ? 'Đang kết nối...' : 'Xác nhận & Tìm thợ ngay'}</span>
            </span>
            <span className="bg-on-primary/20 px-2.5 py-1 rounded-lg text-on-primary font-bold text-label-md">
              30.000 ₫
            </span>
          </button>

          {/* Trust Guarantee Micro-copy */}
          <div className="flex items-center justify-center gap-1.5 text-center px-2 py-1">
            <span className="material-symbols-outlined text-[16px] text-tertiary flex-shrink-0">
              verified_user
            </span>
            <p className="font-label-sm text-[11px] text-on-secondary-container">
              Cam kết minh bạch • Chỉ thanh toán dịch vụ phát sinh khi bạn đồng ý báo giá
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
