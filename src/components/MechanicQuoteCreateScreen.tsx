import React, { useState } from 'react';
import { DEFAULT_MECHANIC, SERVICES } from '../data';
import { QuoteLineInput } from '../api/partner';
import { formatVND } from '../domain/money';
import { ServerMessage } from './ServerMessage';

/** Nhóm phí hiển thị: cố định (gọi thợ + dịch vụ) · linh kiện · phụ phí & ưu đãi. Phí di chuyển tách riêng (read-only). */
type Group = 'fixed' | 'parts' | 'extra';
type Line = {
  id: string;
  name: string;
  price: number;
  checked: boolean;
  required: boolean;
  type: QuoteLineInput['itemType'];
  group: Group;
};

const DEMO_LINES: Line[] = [
  { id: 'callout', name: 'Phí xuất phát cứu hộ cố định', price: 30000, checked: true, required: true, type: 'SURCHARGE', group: 'fixed' },
  { id: 'labor', name: 'Tiền công rút đinh & kiểm tra', price: 40000, checked: true, required: true, type: 'LABOR', group: 'fixed' },
  { id: 'patch', name: 'Miếng vá nấm cao su Japan Tech', price: 50000, checked: true, required: false, type: 'PART', group: 'parts' },
  { id: 'night', name: 'Phụ phí an toàn ban đêm (Sau 22:00)', price: 20000, checked: true, required: false, type: 'SURCHARGE', group: 'extra' },
  { id: 'promo', name: 'Ưu đãi Fix&Go chào bạn mới', price: -20000, checked: true, required: false, type: 'DISCOUNT', group: 'extra' },
];

/** Dòng báo giá sinh từ đơn thật: phí gọi thợ + dịch vụ chính + dịch vụ phụ khách chọn (giá niêm yết) + gợi ý thêm. */
function linesFromOrder(callOutFee: number, serviceId: string, extraServiceIds: string[]): Line[] {
  const svc = (code: string) => SERVICES.find((s) => s.id === code);
  const main = svc(serviceId);
  const lines: Line[] = [
    { id: 'callout', name: 'Phí gọi thợ (khách đã xác nhận)', price: callOutFee, checked: true, required: true, type: 'SURCHARGE', group: 'fixed' },
    { id: `svc:${serviceId}`, name: main?.name ?? serviceId, price: main?.price ?? 0, checked: true, required: true, type: 'LABOR', group: 'fixed' },
    ...extraServiceIds.map((code) => {
      const e = svc(code);
      return { id: `svc:${code}`, name: `${e?.name ?? code} (khách chọn thêm)`, price: e?.price ?? 0, checked: true, required: false, type: 'LABOR' as const, group: 'fixed' as const };
    }),
    { id: 'part', name: 'Linh kiện thay thế (nếu có)', price: 50000, checked: false, required: false, type: 'PART', group: 'parts' },
    { id: 'night', name: 'Phụ phí ban đêm (sau 22:00)', price: 20000, checked: false, required: false, type: 'SURCHARGE', group: 'extra' },
    { id: 'promo', name: 'Ưu đãi Fix&Go khách mới', price: -20000, checked: false, required: false, type: 'DISCOUNT', group: 'extra' },
  ];
  return lines;
}

interface MechanicQuoteCreateProps {
  /** Gửi các dòng báo giá (không gồm phí gọi thợ — backend tự cộng). */
  onQuoteSent: (items: QuoteLineInput[]) => Promise<void> | void;
  onJobFinished: () => Promise<void> | void;
  /** Từ chối/hủy đơn sau khi đối tác đã nhận nhưng chưa hoàn tất. */
  onCancelOrder: () => Promise<void> | void;
  onBackToNavigation: () => void;
  /** Đơn thật: trạng thái để biết khách đã duyệt chưa; dịch vụ để sinh dòng báo giá. */
  live?: {
    orderCode: string;
    status: string;
    contactName?: string | null;
    contactPhone?: string | null;
    approvedTotal?: number | null;
    callOutFee: number;
    travelDistanceKm?: number | null;
    travelFee?: number | null;
    serviceId: string;
    extraServiceIds: string[];
    quoteRevision?: number | null;
  };
}

export const MechanicQuoteCreateScreen: React.FC<MechanicQuoteCreateProps> = ({
  onQuoteSent,
  onJobFinished,
  onCancelOrder,
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
  const canCancel = !live || ['ARRIVED', 'CHECKING', 'WAITING_FOR_APPROVAL', 'ADDITIONAL_QUOTE', 'PAUSED'].includes(live.status);
  // Bản đã gửi là bất biến: chỉ sửa được khi chưa gửi hoặc đang soạn revision mới.
  const editable = !isSent || revising;

  const toggleItem = (id: string) => {
    if (!editable) return;
    setItems((prev) =>
      prev.map((it) => (it.id === id && !it.required ? { ...it, checked: !it.checked } : it))
    );
  };

  const travelKm = live?.travelDistanceKm ?? 0;
  const travelFee = live?.travelFee ?? 0;
  const totalPrice = items.reduce((sum, it) => (it.checked ? sum + it.price : sum), 0) + travelFee;
  const fixedLines = items.filter((it) => it.group === 'fixed');
  const partLines = items.filter((it) => it.group === 'parts');
  const extraLines = items.filter((it) => it.group === 'extra');

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

      {/* Bảng kê chi phí — gom thành các box theo nhóm */}
      <div className="space-y-space-sm">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-label-md text-label-md text-on-surface font-bold">
            Bảng kê chi phí sửa chữa
          </h3>
          <span className="font-label-sm text-[11px] text-secondary">
            {editable ? 'Bấm để chọn/bỏ' : `Đã gửi${live?.quoteRevision ? ` (bản ${live.quoteRevision})` : ''} — không sửa được`}
          </span>
        </div>

        <FeeGroup group="fixed" items={fixedLines} editable={editable} onToggle={toggleItem} />

        {travelFee > 0 && (
          <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-space-md py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-primary text-[18px]">two_wheeler</span>
                <div className="min-w-0">
                  <p className="font-label-md text-label-md text-on-surface font-bold leading-tight">Phí di chuyển</p>
                  <p className="font-label-sm text-[11px] text-secondary truncate">
                    {travelKm} km × đơn giá hệ thống · tự động, không sửa
                  </p>
                </div>
              </div>
              <span className="font-label-md text-label-md tabular-nums font-bold text-on-surface whitespace-nowrap">
                {formatVND(travelFee)}
              </span>
            </div>
          </div>
        )}

        <FeeGroup group="parts" items={partLines} editable={editable} onToggle={toggleItem} />
        <FeeGroup group="extra" items={extraLines} editable={editable} onToggle={toggleItem} />

        {/* Tổng báo giá */}
        <div className="p-space-md rounded-xl bg-surface-container-high/60 border border-surface-container flex items-center justify-between">
          <div>
            <span className="font-label-sm text-[11px] text-secondary uppercase font-bold block">
              Tổng báo giá gửi khách
            </span>
            <span className="font-label-sm text-[11px] text-tertiary font-semibold">
              Đúng giá niêm yết hệ thống Fix&amp;Go
            </span>
          </div>
          <span className="font-data-metric-lg text-primary font-extrabold">
            {formatVND(totalPrice)}
          </span>
        </div>
      </div>

      {/* Action triggers */}
      <div className="space-y-2 pt-2">
        {error && <ServerMessage variant="error">{error}</ServerMessage>}
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

            {canCancel && (
              <button
                type="button"
                onClick={onCancelOrder}
                className="w-full h-11 rounded-xl border border-error/40 text-error font-label-md font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
              >
                <span className="material-symbols-outlined text-[19px]">cancel</span>
                <span>TỪ CHỐI ĐƠN</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const GROUP_META: Record<Group, { title: string; subtitle: string; icon: string }> = {
  fixed: { title: 'Phí cố định', subtitle: 'Phí gọi thợ + dịch vụ khách đã chọn', icon: 'verified' },
  parts: { title: 'Linh kiện phụ tùng', subtitle: 'Vật tư thay thế (nếu có)', icon: 'build' },
  extra: { title: 'Phụ phí & ưu đãi', subtitle: 'Phụ phí phát sinh · khuyến mãi', icon: 'more_horiz' },
};

/** Một box nhóm phí: tiêu đề + subtotal + các dòng chọn/bỏ. */
const FeeGroup: React.FC<{ group: Group; items: Line[]; editable: boolean; onToggle: (id: string) => void }> = ({
  group,
  items,
  editable,
  onToggle,
}) => {
  if (items.length === 0) return null;
  const meta = GROUP_META[group];
  const subtotal = items.reduce((s, it) => (it.checked ? s + it.price : s), 0);
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-space-md py-2.5 bg-surface-container-low/60 border-b border-surface-container">
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined text-primary text-[18px]">{meta.icon}</span>
          <div className="min-w-0">
            <p className="font-label-md text-label-md text-on-surface font-bold leading-tight">{meta.title}</p>
            <p className="font-label-sm text-[11px] text-secondary truncate">{meta.subtitle}</p>
          </div>
        </div>
        <span className="font-label-md text-label-md tabular-nums font-bold text-on-surface whitespace-nowrap">
          {subtotal < 0 ? `-${formatVND(Math.abs(subtotal))}` : formatVND(subtotal)}
        </span>
      </div>
      <div className="p-space-sm space-y-2">
        {items.map((it) => (
          <div
            key={it.id}
            onClick={() => onToggle(it.id)}
            className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
              editable && !it.required ? 'cursor-pointer' : 'cursor-default'
            } ${it.checked ? 'bg-surface-container-low border-primary/20' : 'bg-surface-container border-transparent opacity-60'}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <input type="checkbox" checked={it.checked} readOnly className="w-4 h-4 rounded text-primary focus:ring-primary" />
              <span className="font-body-sm text-[13px] text-on-surface font-medium truncate">{it.name}</span>
            </div>
            <span
              className={`font-label-md text-label-md tabular-nums font-bold ${
                it.price < 0 ? 'text-tertiary' : 'text-on-surface'
              }`}
            >
              {it.price < 0 ? `-${formatVND(Math.abs(it.price))}` : formatVND(it.price)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
