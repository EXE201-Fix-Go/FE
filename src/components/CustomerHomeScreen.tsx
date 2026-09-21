import React, { useState } from 'react';
import { ASSETS, SERVICES } from '../data';
import { ServiceItem } from '../types';

interface CustomerHomeScreenProps {
  onSelectService: (service: ServiceItem) => void;
  onNavigateToConfirm?: () => void;
  selectedService?: ServiceItem;
  currentAddress: string;
  onAddressChange?: (address: string) => void;
  onUpdateAddress?: () => void;
}

export const CustomerHomeScreen: React.FC<CustomerHomeScreenProps> = ({
  onSelectService,
  onNavigateToConfirm,
  selectedService = SERVICES[0],
  currentAddress,
  onAddressChange,
  onUpdateAddress,
}) => {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState(currentAddress);

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (addressInput.trim()) {
      onAddressChange?.(addressInput.trim());
    }
    setIsEditingAddress(false);
  };

  return (
    <div className="flex flex-col w-full pb-24">
      <div className="flex flex-col w-full px-gutter space-y-space-md pt-2">
        {/* Urgent Operational Status Pill */}
        <div className="w-full bg-primary-container text-on-primary-container p-[15px] rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-space-xs min-w-0">
            <span className="relative flex h-3 w-3 flex-shrink-0 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-surface-container-lowest"></span>
            </span>
            <div className="flex flex-col min-w-0 ml-1">
              <span className="font-label-sm text-[11px] uppercase tracking-wide text-primary-fixed truncate">
                Cứu hộ xe máy khẩn cấp 24/7
              </span>
              <span className="font-label-md text-label-md font-bold text-white truncate">
                Thợ có mặt sau 10 - 15 phút
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-lowest/15 px-space-xs py-1 rounded-lg flex-shrink-0">
            <span className="material-symbols-outlined text-primary-fixed text-[18px]">bolt</span>
            <span className="font-label-sm text-[12px] text-primary-fixed font-bold">Quận 1</span>
          </div>
        </div>

        {/* Detected Current Location Bar */}
        <div className="w-full bg-surface-container-lowest p-[15px] rounded-xl shadow-sm flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs min-w-0">
            <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0 text-primary">
              <span className="material-symbols-outlined text-[20px]">near_me</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-[11px] text-secondary truncate">Vị trí hiện tại của bạn</span>
              <span className="font-label-md text-label-md text-on-surface font-bold truncate">
                {currentAddress}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsEditingAddress(true)}
            className="px-space-sm py-1.5 rounded-lg bg-surface-container text-primary font-label-sm text-label-sm font-bold flex-shrink-0 active:scale-95 hover:bg-surface-container-high transition-all"
            type="button"
          >
            Đổi
          </button>
        </div>

        {/* Modal for editing address */}
        {isEditingAddress && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveAddress}
              className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-space-md shadow-xl flex flex-col gap-3 animate-in fade-in zoom-in-95"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-on-surface">Đổi địa chỉ sự cố</h3>
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-secondary"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface font-body-md outline-none focus:border-primary"
                placeholder="Nhập địa chỉ hoặc số nhà..."
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface font-label-md"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-bold shadow-sm"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Live Rescue Dispatch Map Snapshot Card */}
        <div className="relative w-full rounded-xl overflow-hidden shadow-sm bg-surface-container-low">
          <div
            className="w-full h-28 bg-cover bg-center"
            style={{ backgroundImage: `url('${ASSETS.mapSnapshotHome}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/90 via-inverse-surface/40 to-transparent flex items-end p-space-sm">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-space-xs text-inverse-on-surface">
                <span className="material-symbols-outlined text-tertiary-fixed-dim text-[18px]">electric_moped</span>
                <span className="font-label-sm text-[12px] font-bold">5 thợ gần nhất đang trực tuyến sẵn sàng</span>
              </div>
              <span className="font-label-sm text-[11px] bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full font-bold shadow-sm">
                Định vị GPS
              </span>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between pt-space-xs">
          <h2 className="font-headline-md text-headline-md text-on-surface">Chọn dịch vụ cần hỗ trợ</h2>
          <span className="font-label-sm text-[12px] text-secondary">Chạm để gọi ngay</span>
        </div>

        {/* Services Triage 2-Column Responsive Grid */}
        <div className="grid grid-cols-2 gap-space-sm" id="service-grid">
          {SERVICES.map((service) => {
            const isSelected = selectedService.id === service.id;
            return (
              <button
                key={service.id}
                onClick={() => onSelectService(service)}
                className={`service-card text-left w-full min-h-[120px] p-[15px] rounded-xl shadow-sm active:scale-[0.98] transition-all flex flex-col justify-between relative overflow-hidden border ${
                  isSelected
                    ? 'bg-primary-fixed border-primary text-on-primary-fixed shadow-md ring-2 ring-primary/30'
                    : 'bg-surface-container-lowest border-transparent hover:border-surface-container-high'
                }`}
                type="button"
              >
                <div className="flex items-start justify-between w-full">
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-high text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[24px]">{service.icon}</span>
                  </div>

                  {service.badge && (
                    <span
                      className={`text-[9px] leading-[1.4] px-1.5 py-1 rounded-full font-bold uppercase tracking-tight text-center ${
                        service.badgeColor === 'tertiary'
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                          : service.badgeColor === 'primary'
                          ? 'bg-primary-fixed text-on-primary-fixed'
                          : 'bg-secondary-fixed text-on-secondary-fixed'
                      }`}
                    >
                      {service.badge}
                    </span>
                  )}
                </div>

                <div className="mt-space-xs">
                  <span className="font-label-md text-label-md font-bold block leading-tight text-on-surface">
                    {service.name}
                  </span>
                  <span className="font-body-sm text-[12px] text-secondary block mt-0.5">
                    {service.desc}
                  </span>
                </div>

                <div className="mt-space-xs flex items-baseline justify-between pt-space-xs border-t border-surface-container/60">
                  <span className="font-label-sm text-[11px] text-secondary">Giá từ</span>
                  <span className="font-data-metric-md text-[18px] text-primary font-bold">
                    {service.priceDisplay}
                    <span className="text-label-sm ml-0.5">₫</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
};
