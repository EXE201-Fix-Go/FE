import React, { useState } from 'react';
import { ASSETS, DEFAULT_MECHANIC } from '../data';

interface CustomerTrackingProps {
  /** Demo: bấm để giả lập thợ tới nơi. Khi nối backend, App tự chuyển màn theo trạng thái. */
  onArrivedAndQuote?: () => void;
  onCancel: () => void;
  /** Dữ liệu thật từ backend (nếu có) — ghi đè thông tin mẫu. */
  live?: {
    orderCode: string;
    status: string;
    statusLabel: string;
    mechanicName?: string | null;
    mechanicPhone?: string | null;
    address: string;
  };
}

export const CustomerTrackingScreen: React.FC<CustomerTrackingProps> = ({
  onArrivedAndQuote,
  onCancel,
  live,
}) => {
  const mechanicName = live?.mechanicName || DEFAULT_MECHANIC.name;
  const mechanicPhone = live?.mechanicPhone || DEFAULT_MECHANIC.phone;
  const arrived = live ? live.status !== 'ASSIGNED' : false;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'mechanic' | 'customer'; text: string }>>([
    {
      sender: 'mechanic',
      text: 'Chào bạn, tôi đang qua ngã sáu Phù Đổng, tầm 6-7 phút nữa có mặt nhé!',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isRotating, setIsRotating] = useState(false);

  const handleSendChat = (textToSend?: string) => {
    const text = textToSend || chatInput.trim();
    if (!text) return;

    setChatMessages((prev) => [...prev, { sender: 'customer', text }]);
    setChatInput('');
    setIsChatOpen(true);

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'mechanic',
          text: 'Dạ tôi thấy rồi, tôi đang chạy xe tới ngay đây!',
        },
      ]);
    }, 900);
  };

  const handleRecenter = () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 300);
  };

  return (
    <div className="flex flex-col w-full relative min-h-screen pb-safe">
      {/* Live Tracking Map Section (Top ~42%) */}
      <div className="relative w-full h-[340px] overflow-hidden bg-surface-container">
        {/* Map Canvas Viewport */}
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-700"
          style={{ backgroundImage: `url('${ASSETS.mapTrackingLive}')` }}
        />
        {/* Live Ambient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 pointer-events-none"></div>

        {/* Simulated Active Route SVG Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" viewBox="0 0 390 340">
          <path
            d="M 85 240 C 130 220, 180 180, 225 155 S 290 115, 305 75"
            stroke="#000000"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.15"
            strokeWidth="8"
          />
          <path
            d="M 85 240 C 130 220, 180 180, 225 155 S 290 115, 305 75"
            id="route-path"
            stroke="#cc4900"
            strokeDasharray="8 6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
          {/* User Position Landmark */}
          <g transform="translate(85, 240)">
            <circle className="animate-ping" cx="0" cy="0" fill="#cc4900" fillOpacity="0.2" r="16" />
            <circle cx="0" cy="0" fill="#a33900" r="9" />
            <circle cx="0" cy="0" fill="#ffffff" r="4" />
          </g>
        </svg>

        {/* Moving Mechanic Marker along route */}
        <div className="absolute top-[88px] right-[76px] flex flex-col items-center animate-bounce duration-1000">
          <div className="bg-primary text-on-primary px-space-xs py-0.5 rounded-full shadow-lg flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-[14px]">two_wheeler</span>
            <span className="font-label-sm text-[10px] leading-tight">Tuấn đang tới</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-on-surface text-primary-fixed flex items-center justify-center shadow-xl">
            <span className="material-symbols-outlined text-[24px]">motorcycle</span>
          </div>
        </div>

        {/* Floating Top ETA Pill Card */}
        <div className="absolute top-4 inset-x-margin px-4 flex items-center justify-between pointer-events-auto">
          <div className="bg-surface-container-lowest/95 backdrop-blur-md px-space-md py-space-xs rounded-full shadow-lg flex items-center gap-space-sm border border-surface-container">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary"></span>
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-label-md text-label-md text-on-surface font-bold">
                {live ? live.statusLabel : 'Đến trong 6 - 8 phút'}
              </span>
              <span className="font-body-sm text-[12px] text-secondary">• 1.2 km</span>
            </div>
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
        <div className="absolute bottom-6 left-4 bg-surface-container-lowest/90 backdrop-blur-sm px-space-sm py-1 rounded-lg shadow-sm flex items-center gap-1">
          <span className="material-symbols-outlined text-primary text-[16px]">location_on</span>
          <span className="font-label-sm text-[12px] text-on-surface truncate max-w-[210px] font-medium">
            {live ? live.address : '242 Cống Quỳnh, Q.1'}
          </span>
        </div>
      </div>

      {/* Dispatch Tracking Sheet (Bottom ~58%) */}
      <div className="relative bg-surface-container-lowest rounded-t-[28px] -mt-4 shadow-[0_-6px_24px_rgba(11,28,48,0.08)] px-gutter pt-space-md pb-space-lg flex flex-col gap-space-md z-10">
        {/* Grabber Indicator */}
        <div className="w-12 h-1.5 bg-surface-container-high rounded-full self-center"></div>

        {/* Next Step Shortcut Button (demo) / Live status line */}
        {onArrivedAndQuote ? (
          <button
            onClick={onArrivedAndQuote}
            className="w-full py-2.5 px-3 rounded-xl bg-tertiary-container text-on-tertiary font-label-md text-[13.5px] font-bold flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">build_circle</span>
            <span>Thợ Tuấn đã đến nơi! Bấm để xem Biên bản &amp; Báo giá minh bạch →</span>
          </button>
        ) : (
          live && (
            <div className="w-full py-2.5 px-[15px] rounded-xl bg-surface-container flex items-center justify-between gap-2">
              <span className="font-body-sm text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary animate-pulse">sync</span>
                {live.statusLabel}
              </span>
              <span className="font-label-sm text-secondary">{live.orderCode}</span>
            </div>
          )
        )}

        {/* Main Live Dispatch Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-[11px] text-primary uppercase tracking-wider font-bold">
              {arrived ? 'Thợ đang xử lý tại chỗ' : 'Đang khẩn cấp di chuyển'}
            </span>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface flex items-baseline gap-1 font-bold">
              7 phút{' '}
              <span className="font-body-md text-body-md text-secondary font-normal">(1.2 km)</span>
            </h2>
          </div>
          <div className="flex flex-col items-end">
            <div className="bg-tertiary-container text-on-tertiary px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              <span className="font-label-sm text-[11px] font-bold">{live ? live.statusLabel : 'Đã nhận đơn'}</span>
            </div>
            <span className="font-body-sm text-[11px] text-secondary mt-1">Cập nhật 5s trước</span>
          </div>
        </div>

        {/* Four-Step Status Journey Tracker */}
        <div className="bg-surface-container-low rounded-xl p-[15px] flex flex-col gap-1.5 border border-surface-container">
          <div className="flex items-center justify-between relative px-2">
            {/* Connecting Track Bar */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-surface-container-highest -z-0"></div>
            <div className="absolute left-6 w-[36%] top-1/2 -translate-y-1/2 h-1 bg-primary -z-0"></div>

            {/* Step 1: Assigned */}
            <div className="flex flex-col items-center gap-1 z-10">
              <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
            </div>
            {/* Step 2: On the way (Active) */}
            <div className="flex flex-col items-center gap-1 z-10">
              <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary ring-4 ring-primary-fixed/60 flex items-center justify-center shadow-md animate-pulse">
                <span className="material-symbols-outlined text-[16px]">navigation</span>
              </div>
            </div>
            {/* Step 3: Arrived */}
            <div className="flex flex-col items-center gap-1 z-10">
              <div className="w-7 h-7 rounded-full bg-surface-container-highest text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">place</span>
              </div>
            </div>
            {/* Step 4: Repairing */}
            <div className="flex flex-col items-center gap-1 z-10">
              <div className="w-7 h-7 rounded-full bg-surface-container-highest text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">build</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-center px-0 font-label-sm text-[11px]">
            <span className="text-on-surface w-1/4 font-semibold">Đã nhận</span>
            <span className="text-primary font-bold w-1/4">Đang đến</span>
            <span className="text-secondary w-1/4">Đã tới nơi</span>
            <span className="text-secondary w-1/4">Sửa chữa</span>
          </div>
        </div>

        {/* Mechanic Profile Card */}
        <div className="bg-surface-container-lowest rounded-xl p-[15px] shadow-[0_2px_12px_rgba(11,28,48,0.06)] flex items-center gap-space-md border border-surface-container">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm bg-surface-container">
            <img
              alt={`Thợ cứu hộ Fix&Go ${mechanicName}`}
              className="w-full h-full object-cover"
              src={DEFAULT_MECHANIC.avatar}
            />
            <div className="absolute bottom-0 inset-x-0 bg-primary/90 text-on-primary text-center font-label-sm text-[9px] py-0.5 font-bold">
              TOP THỢ
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-headline-md text-[17px] leading-tight text-on-surface truncate font-bold">
                {mechanicName}
              </h3>
              <span
                className="material-symbols-outlined text-tertiary text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
                title="Đã xác minh nghiệp vụ"
              >
                check_circle
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center text-primary font-label-md text-label-md">
                <span
                  className="material-symbols-outlined text-[16px] text-[#eab308]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="ml-0.5 text-on-surface font-bold">4.9</span>
              </div>
              <span className="text-secondary text-[12px] font-body-sm">(1.420 đánh giá)</span>
            </div>

            {/* Vehicle Badge */}
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-surface-container rounded-md">
              <span className="material-symbols-outlined text-on-surface-variant text-[14px]">
                motorcycle
              </span>
              <span className="font-label-sm text-[12px] text-on-surface-variant font-bold">
                {DEFAULT_MECHANIC.vehicle}
              </span>
              <span className="text-secondary text-[11px]">•</span>
              <span className="font-label-sm text-[12px] text-primary tracking-wide font-bold">
                {DEFAULT_MECHANIC.licensePlate}
              </span>
            </div>
          </div>
        </div>

        {/* Primary & Secondary Rapid Action Triggers */}
        <div className="grid grid-cols-2 gap-space-sm pt-space-xs">
          {/* Call Button */}
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

          {/* Chat Trigger Button */}
          <button
            aria-label="Gửi tin nhắn hoặc thông báo nhanh cho thợ"
            onClick={() => setIsChatOpen(true)}
            className="h-[52px] bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all font-bold"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">chat</span>
            <span className="font-label-lg text-label-lg">Nhắn tin</span>
          </button>
        </div>

        {/* Quick Preset Message Pills */}
        <div className="flex flex-col gap-1.5">
          <span className="font-label-sm text-[11px] text-secondary">Tin nhắn nhanh vị trí:</span>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-nowrap">
            <button
              className="px-3 py-1.5 bg-surface-container rounded-full font-body-sm text-[12px] text-on-surface hover:bg-primary-fixed active:scale-95 transition-colors"
              onClick={() => handleSendChat('🏪 Tôi đang đứng trước Circle K')}
              type="button"
            >
              🏪 Tôi đang đứng trước Circle K
            </button>
            <button
              className="px-3 py-1.5 bg-surface-container rounded-full font-body-sm text-[12px] text-on-surface hover:bg-primary-fixed active:scale-95 transition-colors"
              onClick={() => handleSendChat('🌧️ Tôi mặc áo mưa màu xanh')}
              type="button"
            >
              🌧️ Tôi mặc áo mưa màu xanh
            </button>
            <button
              className="px-3 py-1.5 bg-surface-container rounded-full font-body-sm text-[12px] text-on-surface hover:bg-primary-fixed active:scale-95 transition-colors"
              onClick={() => handleSendChat('🚦 Ngay góc ngã tư đèn đỏ')}
              type="button"
            >
              🚦 Ngay góc ngã tư đèn đỏ
            </button>
          </div>
        </div>

        {/* Safety & Security Reminder Banner */}
        <div className="bg-secondary-container/40 rounded-xl p-[15px] flex items-start gap-space-sm border border-secondary-container/60">
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[18px]">security</span>
          </div>
          <div className="flex-1">
            <h4 className="font-label-md text-[13px] text-on-surface font-bold">Lưu ý an toàn nhận diện</h4>
            <p className="font-body-sm text-[12px] text-on-secondary-container leading-relaxed">
              Kiểm tra đúng biển số xe{' '}
              <strong className="text-on-surface font-bold">{DEFAULT_MECHANIC.licensePlate}</strong> và áo đồng
              phục gắn logo Fix&amp;Go màu cam đậm trước khi bàn giao xe.
            </p>
          </div>
        </div>

        {/* Emergency Secondary Row / Cancel Support Link */}
        <div className="flex items-center justify-between pt-1 text-center">
          <button
            onClick={() => {
              if (
                window.confirm(
                  `Thợ ${mechanicName} đang trên đường tới. Bạn có chắc muốn hủy chuyến cứu hộ này?`
                )
              ) {
                onCancel();
              }
            }}
            className="font-body-sm text-[13px] text-secondary hover:text-error transition-colors px-2 py-1"
            type="button"
          >
            Hủy yêu cầu cứu hộ
          </button>

          <div className="flex items-center gap-1 text-tertiary">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            <span className="font-label-sm text-[12px]">Bảo hiểm sửa chữa 30 ngày</span>
          </div>
        </div>
      </div>

      {/* Interactive Modal: Chat Bottom Sheet */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end p-0">
          <div className="bg-surface-container-lowest rounded-t-2xl p-space-md flex flex-col gap-space-sm max-h-[75vh] w-full max-w-md mx-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></div>
                <span className="font-label-lg text-label-lg text-on-surface font-bold">
                  Chat trực tiếp với Tuấn
                </span>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Dialogue History */}
            <div className="flex flex-col gap-2 overflow-y-auto py-2 min-h-[140px] max-h-[240px]">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`max-w-[80%] p-space-sm rounded-xl font-body-sm text-[13.5px] ${
                    msg.sender === 'customer'
                      ? 'self-end bg-primary text-on-primary rounded-tr-none'
                      : 'self-start bg-surface-container text-on-surface rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Quick Text Box */}
            <div className="flex items-center gap-2 pt-1 border-t border-surface-container">
              <input
                className="flex-1 h-11 bg-surface-container rounded-xl px-space-sm text-body-sm text-on-surface focus:outline-none focus:bg-surface-container-high"
                placeholder="Nhập tin nhắn cho thợ..."
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendChat();
                }}
              />
              <button
                onClick={() => handleSendChat()}
                className="w-11 h-11 bg-primary text-on-primary rounded-xl flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
