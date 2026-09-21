import React, { useState } from 'react';
import { DEFAULT_MECHANIC, SERVICES } from '../data';
import { QuoteLineInput } from '../api/partner';

type Line = { id: string; name: string; price: number; checked: boolean; required: boolean; type: QuoteLineInput['itemType'] };

const DEMO_LINES: Line[] = [
  { id: 'callout', name: 'Phí xuất phát cứu hộ cố định', price: 30000, checked: true, required: true, type: 'SURCHARGE' },
  { id: 'labor', name: 'Tiền công rút đinh & kiểm tra', price: 40000, checked: true, required: true, type: 'LABOR' },
  { id: 'patch', name: 'Miếng vá nấm cao su Japan Tech', price: 50000, checked: true, required: false, type: 'PART' },
  { id: 'night', name: 'Phụ phí an toàn ban đêm (Sau 22:00)', price: 20000, checked: true, required: false, type: 'SURCHARGE' },
  { id: 'promo', name: 'Ưu đãi Fix&Go chào bạn mới', price: -20000, checked: true, required: false, type: 'DISCOUNT' },
];

/** Dòng báo giá sinh từ đơn thật: phí gọi thợ + dịch vụ chính + dịch vụ phụ khách chọn (giá niêm yết) + gợi ý thêm. */
function linesFromOrder(callOutFee: number, serviceId: string, extraServiceIds: string[]): Line[] {
  const svc = (code: string) => SERVICES.find((s) => s.id === code);
  const main = svc(serviceId);
  const lines: Line[] = [
    { id: 'callout', name: 'Phí gọi thợ (khách đã xác nhận)', price: callOutFee, checked: true, required: true, type: 'SURCHARGE' },
    { id: `svc:${serviceId}`, name: main?.name ?? serviceId, price: main?.price ?? 0, checked: true, required: true, type: 'LABOR' },
    ...extraServiceIds.map((code) => {
      const e = svc(code);
      return { id: `svc:${code}`, name: `${e?.name ?? code} (khách chọn thêm)`, price: e?.price ?? 0, checked: true, required: false, type: 'LABOR' as const };
    }),
    { id: 'part', name: 'Linh kiện thay thế (nếu có)', price: 50000, checked: false, required: false, type: 'PART' },
    { id: 'night', name: 'Phụ phí ban đêm (sau 22:00)', price: 20000, checked: false, required: false, type: 'SURCHARGE' },
    { id: 'promo', name: 'Ưu đãi Fix&Go khách mới', price: -20000, checked: false, required: false, type: 'DISCOUNT' },
  ];
  return lines;
}

interface MechanicQuoteCreateProps {
  /** Gửi các dòng báo giá (không gồm phí gọi thợ — backend tự cộng). */
  onQuoteSent: (items: QuoteLineInput[]) => Promise<void> | void;
  onJobFinished: () => Promise<void> | void;
  onBackToNavigation: () => void;
  /** Đơn thật: trạng thái để biết khách đã duyệt chưa; dịch vụ để sinh dòng báo giá. */
  live?: {
    orderCode: string;
    status: string;
    contactName?: string | null;
    contactPhone?: string | null;
    approvedTotal?: number | null;
    callOutFee: number;
    serviceId: string;
    extraServiceIds: string[];
    quoteRevision?: number | null;
  };
}

export const MechanicQuoteCreateScreen: React.FC<MechanicQuoteCreateProps> = ({
  onQuoteSent,
  onJobFinished,
  onBackToNavigation,
  live,
}) => {
  const [items, setItems] = useState<Line[]>(() =>
    live ? linesFromOrder(live.callOutFee, live.serviceId, live.extraServiceIds) : DEMO_LINES
  );

  const [diagnosis, setDiagnosis] = useState('Thủng lốp do đinh tán 3cm • Cần vá nấm chịu lực');
  const [isSent, setIsSent] = useState(live ? live.status !== 'CHECKING' : false);
  const [isFixing, setIsFixing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Đang soạn báo giá bổ sung (revision mới) sau khi khách đã duyệt bản trước (BR03 / C-02). */
  const [revising, setRevising] = useState(false);
  const approved = live ? live.status === 'IN_PROGRESS' || live.status === 'PAUSED' : true;
  const waiting = live ? live.status === 'WAITING_FOR_APPROVAL' || live.status === 'ADDITIONAL_QUOTE' : false;
  // Bản đã gửi là bất biến: chỉ sửa được khi chưa gửi hoặc đang soạn revision mới.
  const editable = !isSent || revising;

  const toggleItem = (id: string) => {
    if (!editable) return;
    setItems((prev) =>
      prev.map((it) => (it.id === id && !it.required ? { ...it, checked: !it.checked } : it))
    );
  };

  const totalPrice = items.reduce((sum, it) => (it.checked ? sum + it.price : sum), 0);

  const handleSendToCustomer = async () => {
    setSending(true);
    setError(null);
    const lines: QuoteLineInput[] = items
      .filter((it) => it.checked && it.id !== 'callout')
      .map((it) => ({
        itemType: it.type,
        description: it.name,
        quantity: 1,
        unitPrice: Math.abs(it.price),
        serviceId: it.id.startsWith('svc:') ? it.id.slice(4) : undefined,
      }));
    try {
      await onQuoteSent(lines);
      setIsSent(true);
      setRevising(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không gửi được báo giá.');
    } finally {
      setSending(false);
    }
  };

  const handleCompleteJob = async () => {
    setIsFixing(true);
    setError(null);
    try {
      await onJobFinished();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không hoàn tất được.');
      setIsFixing(false);
    }
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
            {live ? `${live.contactName || 'Khách hàng'} (${live.contactPhone || live.orderCode})` : 'Trần Thị Mai Lan (0908 123 456)'}
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
          <span className="font-label-sm text-[11px] text-secondary">
            {editable ? 'Bấm để chọn/bỏ' : `Đã gửi${live?.quoteRevision ? ` (bản ${live.quoteRevision})` : ''} — không sửa được`}
          </span>
        </div>

        <div className="space-y-2.5">
          {items.map((it) => (
            <div
              key={it.id}
              onClick={() => toggleItem(it.id)}
              className={`flex items-center justify-between p-2.5 rounded-lg transition-colors border ${
                editable ? 'cursor-pointer' : 'cursor-default'
              } ${
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
        {error && (
          <div role="alert" className="rounded-xl bg-error-container text-on-error-container font-body-sm px-[15px] py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}
        {editable ? (
          <div className="space-y-2">
            <button
              onClick={handleSendToCustomer}
              disabled={sending}
              className="w-full h-14 bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
            >
              <span className={`material-symbols-outlined text-[22px] ${sending ? 'animate-spin' : ''}`}>{sending ? 'progress_activity' : 'send'}</span>
              <span>
                {revising ? 'GỬI BÁO GIÁ BỔ SUNG' : 'GỬI BÁO GIÁ CHO KHÁCH DUYỆT'} ({totalPrice.toLocaleString('vi-VN')} ₫)
              </span>
            </button>
            {revising && (
              <button
                type="button"
                onClick={() => setRevising(false)}
                className="w-full h-11 rounded-xl bg-surface-container text-on-surface font-label-md"
              >
                Hủy sửa, giữ bản đã duyệt
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {approved ? (
              <div className="p-[15px] bg-tertiary-container/15 text-tertiary rounded-xl flex items-center gap-2 border border-tertiary-container/30">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span className="font-label-sm text-[12.5px] font-bold">
                  Khách đã chấp thuận báo giá{live?.approvedTotal ? ` ${live.approvedTotal.toLocaleString('vi-VN')} ₫` : ' 120.000 ₫'} trên ứng dụng!
                </span>
              </div>
            ) : (
              <div className="p-[15px] bg-surface-container rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary animate-spin">progress_activity</span>
                <span className="font-label-sm text-[12.5px] text-on-surface-variant">
                  Đã gửi báo giá — đang chờ khách duyệt trên điện thoại…
                </span>
              </div>
            )}

            {live && approved && (
              <button
                type="button"
                onClick={() => setRevising(true)}
                className="w-full h-12 rounded-xl bg-surface-container text-on-surface font-label-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                Có phát sinh? Gửi báo giá bổ sung (khách duyệt lại)
              </button>
            )}
            {waiting && (
              <p className="font-label-sm text-[11px] text-center text-secondary">
                Không thể sửa bản đã gửi. Nếu cần đổi, chờ khách quyết định rồi gửi bản bổ sung.
              </p>
            )}

            <button
              onClick={handleCompleteJob}
              disabled={isFixing || !approved}
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
