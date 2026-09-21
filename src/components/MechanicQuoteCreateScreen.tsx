import React, { useState } from 'react';
import { DEFAULT_MECHANIC } from '../data';

interface MechanicQuoteCreateProps {
  onQuoteSent: () => void;
  onJobFinished: () => void;
  onBackToNavigation: () => void;
}

export const MechanicQuoteCreateScreen: React.FC<MechanicQuoteCreateProps> = ({
  onQuoteSent,
  onJobFinished,
  onBackToNavigation,
}) => {
  const [items, setItems] = useState([
    { id: 'callout', name: 'Phí xuất phát cứu hộ cố định', price: 30000, checked: true, required: true },
    { id: 'labor', name: 'Tiền công rút đinh & kiểm tra', price: 40000, checked: true, required: true },
    { id: 'patch', name: 'Miếng vá nấm cao su Japan Tech', price: 50000, checked: true, required: false },
    { id: 'night', name: 'Phụ phí an toàn ban đêm (Sau 22:00)', price: 20000, checked: true, required: false },
    { id: 'promo', name: 'Ưu đãi Fix&Go chào bạn mới', price: -20000, checked: true, required: false },
  ]);

  const [diagnosis, setDiagnosis] = useState('Thủng lốp do đinh tán 3cm • Cần vá nấm chịu lực');
  const [isSent, setIsSent] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id && !it.required ? { ...it, checked: !it.checked } : it))
    );
  };

  const totalPrice = items.reduce((sum, it) => (it.checked ? sum + it.price : sum), 0);

  const handleSendToCustomer = () => {
    setIsSent(true);
    onQuoteSent();
  };

  const handleCompleteJob = () => {
    setIsFixing(true);
    setTimeout(() => {
      onJobFinished();
    }, 1000);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface px-gutter pt-safe pb-24 space-y-space-md">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBackToNavigation}
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div className="text-center">
          <span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-bold block">
            Biên bản giám định
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
            Tạo Báo Giá Minh Bạch
          </h2>
        </div>
        <span className="w-10"></span>
      </div>

      {/* Customer summary */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container flex items-center justify-between">
        <div>
          <span className="font-label-sm text-[11px] text-secondary">Khách hàng gặp nạn:</span>
          <h3 className="font-label-lg text-label-lg text-on-surface font-bold">
            Trần Thị Mai Lan (0908 123 456)
          </h3>
          <span className="font-body-sm text-[12px] text-secondary">
            Honda Vision • Biển số: 59-P1 888.88
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold">
          ✓
        </div>
      </div>

      {/* Diagnostic Diagnosis Input */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container space-y-2">
        <label className="font-label-md text-label-md text-on-surface font-bold block">
          Chẩn đoán thực tế tại hiện trường:
        </label>
        <div className="bg-surface-container-low p-2.5 rounded-lg border border-surface-container">
          <input
            className="w-full bg-transparent text-body-sm text-on-surface outline-none"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </div>
        <p className="font-body-sm text-[11px] text-secondary">
          Nội dung này sẽ hiển thị trực tiếp lên điện thoại khách hàng để khách duyệt minh bạch.
        </p>
      </div>

      {/* Itemized pricing checklist */}
      <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container space-y-space-sm">
        <div className="flex items-center justify-between pb-1 border-b border-surface-container">
          <h3 className="font-label-md text-label-md text-on-surface font-bold">
            Bảng kê chi phí sửa chữa
          </h3>
          <span className="font-label-sm text-[11px] text-secondary">Bấm để chọn/bỏ</span>
        </div>

        <div className="space-y-2.5">
          {items.map((it) => (
            <div
              key={it.id}
              onClick={() => toggleItem(it.id)}
              className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors border ${
                it.checked
                  ? 'bg-surface-container-low border-primary/20'
                  : 'bg-surface-container border-transparent opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <input
                  type="checkbox"
                  checked={it.checked}
                  readOnly
                  className="w-4 h-4 rounded text-primary focus:ring-primary"
                />
                <span className="font-body-sm text-[13px] text-on-surface font-medium truncate">
                  {it.name}
                </span>
              </div>
              <span
                className={`font-label-md text-label-md tabular-nums font-bold ${
                  it.price < 0 ? 'text-tertiary' : 'text-on-surface'
                }`}
              >
                {it.price > 0
                  ? `${it.price.toLocaleString('vi-VN')} ₫`
                  : `-${Math.abs(it.price).toLocaleString('vi-VN')} ₫`}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-surface-container flex items-center justify-between">
          <div>
            <span className="font-label-sm text-[11px] text-secondary uppercase font-bold block">
              Tổng báo giá gửi khách
            </span>
            <span className="font-label-sm text-[11px] text-tertiary font-semibold">
              Đúng giá niêm yết hệ thống Fix&amp;Go
            </span>
          </div>
          <span className="font-data-metric-lg text-primary font-extrabold">
            {totalPrice.toLocaleString('vi-VN')} ₫
          </span>
        </div>
      </div>

      {/* Action triggers */}
      <div className="space-y-2 pt-2">
        {!isSent ? (
          <button
            onClick={handleSendToCustomer}
            className="w-full h-14 bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
          >
            <span className="material-symbols-outlined text-[22px]">send</span>
            <span>GỬI BÁO GIÁ CHO KHÁCH DUYỆT ({totalPrice.toLocaleString('vi-VN')} ₫)</span>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="p-[15px] bg-tertiary-container/15 text-tertiary rounded-xl flex items-center gap-2 border border-tertiary-container/30">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span className="font-label-sm text-[12.5px] font-bold">
                Khách đã chấp thuận báo giá 120.000 ₫ trên ứng dụng!
              </span>
            </div>

            <button
              onClick={handleCompleteJob}
              disabled={isFixing}
              className="w-full h-14 bg-tertiary text-on-tertiary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
            >
              {isFixing ? (
                <>
                  <span className="material-symbols-outlined text-[22px] animate-spin">
                    progress_activity
                  </span>
                  <span>Đang ghi nhận kết quả &amp; kích hoạt bảo hành...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[22px]">task_alt</span>
                  <span>HOÀN TẤT SỬA CHỮA &amp; THU TIỀN</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
