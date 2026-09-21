import React from 'react';
import { ASSETS, DEFAULT_MECHANIC } from '../data';

interface CustomerHistoryProps {
  onBackToHome: () => void;
  onViewInvoice: () => void;
}

export const CustomerHistoryScreen: React.FC<CustomerHistoryProps> = ({
  onBackToHome,
  onViewInvoice,
}) => {
  const historyList = [
    {
      id: '#FG-88294',
      date: '18/10/2024 • 22:45',
      service: 'Vá nấm lốp không ruột cao cấp',
      vehicle: 'Honda Vision 110i • 59-P1 888.88',
      location: '242 Cống Quỳnh, P. Phạm Ngũ Lão, Q.1',
      price: '120.000 ₫',
      status: 'Hoàn tất',
      mechanic: DEFAULT_MECHANIC.name,
      warrantyActive: true,
      warrantyDaysLeft: 28,
    },
    {
      id: '#FG-76120',
      date: '05/08/2024 • 08:30',
      service: 'Kích bình ắc quy xe máy',
      vehicle: 'Honda Air Blade • 59-P1 888.88',
      location: '128 Nguyễn Trãi, Q.1',
      price: '60.000 ₫',
      status: 'Hoàn tất',
      mechanic: 'Trần Đình Nam',
      warrantyActive: false,
    },
  ];

  return (
    <div className="flex flex-col w-full px-gutter pb-24 space-y-space-md pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
            Lịch sử cứu hộ
          </h2>
          <p className="font-body-sm text-[12.5px] text-secondary">
            Tra cứu hóa đơn điện tử &amp; phiếu bảo hành 30 ngày
          </p>
        </div>
        <span className="px-2.5 py-1 bg-primary-fixed text-on-primary-fixed rounded-full font-label-sm text-[11px] font-bold">
          2 cuốc cứu hộ
        </span>
      </div>

      {/* Active Warranty Highlight Banner */}
      <div className="p-space-md rounded-xl bg-tertiary-container/10 border border-tertiary-container/20 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary flex-shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[22px]">verified_user</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-label-md text-label-md text-tertiary font-bold">
              Bảo hành còn hiệu lực (28 ngày)
            </h4>
            <span className="bg-tertiary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
              Bảo vệ
            </span>
          </div>
          <p className="font-body-sm text-[12px] text-on-surface mt-0.5 leading-snug">
            Vết vá xe <b>59-P1 888.88</b> được hỗ trợ vá lại miễn phí tận nơi trên toàn TP.HCM nếu xì rò hơi.
          </p>
        </div>
      </div>

      {/* History Items Cards */}
      <div className="space-y-space-sm">
        {historyList.map((item) => (
          <div
            key={item.id}
            className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container/60">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  receipt_long
                </span>
                <span className="font-label-sm text-[12px] font-mono font-bold text-on-surface">
                  {item.id}
                </span>
              </div>
              <span className="font-label-sm text-[11px] px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                {item.status}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-label-md text-label-md text-on-surface font-bold">
                  {item.service}
                </h3>
                <p className="font-body-sm text-[12px] text-secondary mt-0.5">
                  {item.vehicle}
                </p>
              </div>
              <span className="font-data-metric-md text-[18px] text-primary font-bold">
                {item.price}
              </span>
            </div>

            <div className="flex items-start gap-1.5 text-secondary text-[12px] font-body-sm">
              <span className="material-symbols-outlined text-[16px] text-primary-container shrink-0 mt-0.5">
                location_on
              </span>
              <span className="line-clamp-1">{item.location}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-surface-container/60">
              <span className="font-label-sm text-[11px] text-secondary">
                {item.date} • Thợ {item.mechanic}
              </span>

              {item.warrantyActive ? (
                <button
                  onClick={onViewInvoice}
                  className="px-2.5 py-1 rounded-lg bg-primary-fixed text-on-primary-fixed font-label-sm text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <span>Chi tiết &amp; Đánh giá</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  onClick={onBackToHome}
                  className="px-2.5 py-1 rounded-lg bg-surface-container text-secondary font-label-sm text-[11px] font-semibold"
                >
                  Đặt lại dịch vụ này
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
