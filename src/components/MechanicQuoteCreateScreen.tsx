import React, { useRef, useState } from 'react';
import { useCatalog } from '../catalog/CatalogProvider';
import { ServiceItem } from '../types';
import { QuoteLineInput } from '../api/partner';
import type { QuoteItem } from '../api/orders';
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
  /** Hạng mục thợ tự thêm (mô tả + giá thợ nhập) — được phép xoá. */
  custom?: boolean;
};

/** Dòng báo giá sinh từ đơn thật: phí gọi thợ + dịch vụ chính + dịch vụ phụ khách chọn (giá niêm yết của hệ thống). */
function linesFromOrder(
  callOutFee: number,
  serviceId: string,
  extraServiceIds: string[],
  svc: (code: string) => ServiceItem | undefined,
): Line[] {
  const main = svc(serviceId);
  const lines: Line[] = [
    { id: 'callout', name: 'Phí gọi thợ (khách đã xác nhận)', price: callOutFee, checked: true, required: true, type: 'SURCHARGE', group: 'fixed' },
    { id: `svc:${serviceId}`, name: main?.name ?? serviceId, price: main?.price ?? 0, checked: true, required: true, type: 'LABOR', group: 'fixed' },
    ...extraServiceIds.map((code) => {
      const e = svc(code);
      return { id: `svc:${code}`, name: `${e?.name ?? code} (khách chọn thêm)`, price: e?.price ?? 0, checked: true, required: false, type: 'LABOR' as const, group: 'fixed' as const };
    }),
  ];
  return lines;
}

/**
 * Báo giá bổ sung chứa TOÀN BỘ giá trị đơn (RB-42), không phải phần chênh lệch: điền sẵn các dòng của bản khách đã duyệt
 * để thợ chỉ việc thêm phần phát sinh. Phí gọi thợ và phí di chuyển do backend tự cộng nên không nằm trong danh sách gửi đi.
 */
function linesFromApproved(callOutFee: number, approved: QuoteItem[]): Line[] {
  const kept = approved
    .filter((i) => i.itemType !== 'TRAVEL')
    .map((i): Line => ({
      id: i.serviceId ? `svc:${i.serviceId}` : `q:${i.lineNo}`,
      name: i.description,
      price: i.itemType === 'DISCOUNT' ? -i.lineAmount : i.lineAmount,
      checked: true,
      required: false,
      type: i.itemType,
      group: i.itemType === 'PART' ? 'parts' : i.itemType === 'SURCHARGE' || i.itemType === 'DISCOUNT' ? 'extra' : 'fixed',
    }));
  return [
    { id: 'callout', name: 'Phí gọi thợ (khách đã xác nhận)', price: callOutFee, checked: true, required: true, type: 'SURCHARGE', group: 'fixed' },
    ...kept,
  ];
}

interface MechanicQuoteCreateProps {
  /** Gửi các dòng báo giá (không gồm phí gọi thợ — backend tự cộng). */
  onQuoteSent: (items: QuoteLineInput[]) => Promise<void> | void;
  onJobFinished: () => Promise<void> | void;
  /** Từ chối/hủy đơn sau khi đối tác đã nhận nhưng chưa hoàn tất. */
  onCancelOrder: () => Promise<void> | void;
  onBackToNavigation: () => void;
  /** Đơn thật: trạng thái để biết khách đã duyệt chưa; dịch vụ để sinh dòng báo giá. */
  live: {
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
    /** Các dòng của bản báo giá khách đã duyệt (nếu có) — nền cho báo giá bổ sung. */
    approvedItems?: QuoteItem[] | null;
  };
}

export const MechanicQuoteCreateScreen: React.FC<MechanicQuoteCreateProps> = ({
  onQuoteSent,
  onJobFinished,
  onCancelOrder,
  onBackToNavigation,
  live,
}) => {
  const { findService } = useCatalog();
  const [items, setItems] = useState<Line[]>(() =>
    live.approvedItems && live.approvedItems.length > 0
      ? linesFromApproved(live.callOutFee, live.approvedItems)
      : linesFromOrder(live.callOutFee, live.serviceId, live.extraServiceIds, findService)
  );

  // Hạng mục thợ tự thêm: mô tả + giá do thợ nhập (không có giá gợi ý cố định).
  const [draftType, setDraftType] = useState<'PART' | 'SURCHARGE' | 'DISCOUNT'>('PART');
  const [draftName, setDraftName] = useState('');
  const [draftAmount, setDraftAmount] = useState('');
  const customCounter = useRef(0);
  const draftValue = Number(draftAmount);
  const canAddDraft = draftName.trim().length > 0 && Number.isFinite(draftValue) && draftValue > 0;
  const addDraft = () => {
    if (!canAddDraft) return;
    const group: Group = draftType === 'PART' ? 'parts' : 'extra';
    const price = draftType === 'DISCOUNT' ? -Math.round(draftValue) : Math.round(draftValue);
    customCounter.current += 1;
    setItems((prev) => [
      ...prev,
      { id: `x:${customCounter.current}`, name: draftName.trim(), price, checked: true, required: false, type: draftType, group, custom: true },
    ]);
    setDraftName('');
    setDraftAmount('');
  };
  const removeCustom = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const [isSent, setIsSent] = useState(live.status !== 'CHECKING');
  const [isFixing, setIsFixing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Đang soạn báo giá bổ sung (revision mới) sau khi khách đã duyệt bản trước (BR03 / C-02). */
  const [revising, setRevising] = useState(false);
  const approved = live.status === 'IN_PROGRESS' || live.status === 'PAUSED';
  const waiting = live.status === 'WAITING_FOR_APPROVAL' || live.status === 'ADDITIONAL_QUOTE';
  const canCancel = ['ARRIVED', 'CHECKING', 'WAITING_FOR_APPROVAL', 'ADDITIONAL_QUOTE', 'PAUSED'].includes(live.status);
  // Bản đã gửi là bất biến: chỉ sửa được khi chưa gửi hoặc đang soạn revision mới.
  const editable = !isSent || revising;

  const toggleItem = (id: string) => {
    if (!editable) return;
    setItems((prev) =>
      prev.map((it) => (it.id === id && !it.required ? { ...it, checked: !it.checked } : it))
    );
  };

  const travelKm = live.travelDistanceKm ?? 0;
  const travelFee = live.travelFee ?? 0;
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
            {`${live.contactName || 'Khách hàng'} (${live.contactPhone || live.orderCode})`}
          </h3>
          <span className="font-body-sm text-[12px] text-secondary">{live.orderCode}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold">
          ✓
        </div>
      </div>

      {/* Bảng kê chi phí — gom thành các box theo nhóm */}
      <div className="space-y-space-sm">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-label-md text-label-md text-on-surface font-bold">
            Bảng kê chi phí sửa chữa
          </h3>
          <span className="font-label-sm text-[11px] text-secondary">
            {editable ? 'Bấm để chọn/bỏ' : `Đã gửi${live.quoteRevision ? ` (bản ${live.quoteRevision})` : ''} — không sửa được`}
          </span>
        </div>

        <FeeGroup group="fixed" items={fixedLines} editable={editable} onToggle={toggleItem} onRemove={removeCustom} />

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

        <FeeGroup group="parts" items={partLines} editable={editable} onToggle={toggleItem} onRemove={removeCustom} />
        <FeeGroup group="extra" items={extraLines} editable={editable} onToggle={toggleItem} onRemove={removeCustom} />

        {editable && (
          <div className="bg-surface-container-lowest rounded-xl border border-dashed border-primary/40 p-space-sm space-y-2">
            <p className="font-label-md text-label-md text-on-surface font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">add_circle</span>
              Thêm hạng mục
            </p>
            <div className="flex gap-1.5">
              {([
                ['PART', 'Linh kiện'],
                ['SURCHARGE', 'Phụ phí'],
                ['DISCOUNT', 'Giảm giá'],
              ] as const).map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDraftType(t)}
                  className={`flex-1 h-9 rounded-lg font-label-sm text-[12px] font-bold border ${
                    draftType === t ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Mô tả hạng mục (vd: Ruột xe 90/90-14)"
              className="w-full h-10 rounded-lg bg-surface-container-low border border-surface-container px-3 text-body-sm text-on-surface outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <input
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                placeholder="Số tiền (₫)"
                className="flex-1 h-10 rounded-lg bg-surface-container-low border border-surface-container px-3 text-body-sm text-on-surface outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={addDraft}
                disabled={!canAddDraft}
                className="px-4 h-10 rounded-lg bg-primary text-on-primary font-label-md font-bold disabled:opacity-40"
              >
                Thêm
              </button>
            </div>
          </div>
        )}

        {/* Tổng báo giá */}
        <div className="p-space-md rounded-xl bg-surface-container-high/60 border border-surface-container flex items-center justify-between">
          <div>
            <span className="font-label-sm text-[11px] text-secondary uppercase font-bold block">
              Tổng báo giá gửi khách
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
                  Khách đã chấp thuận báo giá{live.approvedTotal ? ` ${live.approvedTotal.toLocaleString('vi-VN')} ₫` : ''} trên ứng dụng!
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

            {approved && (
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
                  <span>Đang ghi nhận kết quả...</span>
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
                <span>HỦY ĐƠN</span>
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
const FeeGroup: React.FC<{
  group: Group;
  items: Line[];
  editable: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}> = ({ group, items, editable, onToggle, onRemove }) => {
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
            <span className="flex items-center gap-2 shrink-0">
              <span
                className={`font-label-md text-label-md tabular-nums font-bold ${
                  it.price < 0 ? 'text-tertiary' : 'text-on-surface'
                }`}
              >
                {it.price < 0 ? `-${formatVND(Math.abs(it.price))}` : formatVND(it.price)}
              </span>
              {editable && it.custom && (
                <button
                  type="button"
                  aria-label={`Xoá ${it.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(it.id);
                  }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
