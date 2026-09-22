import React from 'react';
import { Quote, QuoteItem } from '../api/orders';
import { formatVND } from '../domain/money';

const ITEM_TYPE_LABEL: Record<string, string> = {
  LABOR: 'Tiền công',
  PART: 'Linh kiện / vật tư',
  SURCHARGE: 'Phụ phí',
  DISCOUNT: 'Giảm giá',
  SUPPORT: 'Hỗ trợ (dắt / kéo / gửi xe)',
  TRAVEL: 'Phí di chuyển',
};

/** Box read-only cho một nhóm phí. */
const ReceiptGroup: React.FC<{
  title: string;
  subtitle: string;
  icon: string;
  subtotal: number;
  items: QuoteItem[];
  lead?: { label: string; hint: string; amount: number };
}> = ({ title, subtitle, icon, subtotal, items, lead }) => (
  <div className="bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-space-md py-2.5 bg-surface-container-low/60 border-b border-surface-container">
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
        <div className="min-w-0">
          <p className="font-label-md text-label-md text-on-surface font-bold leading-tight">{title}</p>
          <p className="font-label-sm text-[11px] text-secondary truncate">{subtitle}</p>
        </div>
      </div>
      <span className="font-label-md text-label-md tabular-nums font-bold text-on-surface whitespace-nowrap">
        {subtotal < 0 ? `-${formatVND(Math.abs(subtotal))}` : formatVND(subtotal)}
      </span>
    </div>
    <div className="px-space-md py-2.5 space-y-2.5 font-body-sm text-body-sm">
      {lead && (
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-on-surface font-medium leading-snug">{lead.label}</p>
            <p className="font-label-sm text-[11px] text-secondary">{lead.hint}</p>
          </div>
          <span className="font-label-md text-label-md text-on-surface tabular-nums whitespace-nowrap font-bold">
            {formatVND(lead.amount)}
          </span>
        </div>
      )}
      {items.map((it) => {
        const discount = it.itemType === 'DISCOUNT';
        return (
          <div key={it.id} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className={`font-medium leading-snug ${discount ? 'text-tertiary' : 'text-on-surface'}`}>{it.description}</p>
              <p className="font-label-sm text-[11px] text-secondary">
                {ITEM_TYPE_LABEL[it.itemType] ?? it.itemType}
                {it.quantity !== 1 ? ` · ${it.quantity} × ${formatVND(it.unitPrice)}` : ''}
              </p>
            </div>
            <span
              className={`font-label-md text-label-md tabular-nums whitespace-nowrap font-bold ${
                discount ? 'text-tertiary' : 'text-on-surface'
              }`}
            >
              {discount ? '-' : ''}
              {formatVND(it.lineAmount)}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

/**
 * Bảng kê phí theo 4 nhóm (cố định · di chuyển · linh kiện · phụ phí & ưu đãi) từ báo giá.
 * Dùng chung ở màn khách duyệt giá và màn chi tiết đơn.
 */
export const QuoteBreakdown: React.FC<{ quote: Quote }> = ({ quote }) => {
  const laborItems = quote.items.filter((i) => i.itemType === 'LABOR' || i.itemType === 'SUPPORT');
  const travelItems = quote.items.filter((i) => i.itemType === 'TRAVEL');
  const partItems = quote.items.filter((i) => i.itemType === 'PART');
  const extraItems = quote.items.filter((i) => i.itemType === 'SURCHARGE' || i.itemType === 'DISCOUNT');
  return (
    <div className="space-y-space-sm">
      <ReceiptGroup
        title="Phí cố định"
        subtitle="Phí gọi thợ + dịch vụ khách đã chọn"
        icon="verified"
        subtotal={quote.callOutFeeAmount + quote.laborAmount}
        lead={{ label: 'Phí gọi thợ (đã xác nhận)', hint: 'Điều phối & di chuyển tận nơi', amount: quote.callOutFeeAmount }}
        items={laborItems}
      />
      {travelItems.length > 0 && (
        <ReceiptGroup
          title="Phí di chuyển"
          subtitle="Tính theo quãng đường thực tế · đơn giá hệ thống"
          icon="two_wheeler"
          subtotal={quote.travelAmount}
          items={travelItems}
        />
      )}
      {partItems.length > 0 && (
        <ReceiptGroup title="Linh kiện phụ tùng" subtitle="Vật tư thay thế" icon="build" subtotal={quote.partsAmount} items={partItems} />
      )}
      {extraItems.length > 0 && (
        <ReceiptGroup
          title="Phụ phí & ưu đãi"
          subtitle="Phụ phí phát sinh · khuyến mãi"
          icon="more_horiz"
          subtotal={quote.surchargeAmount - quote.discountAmount}
          items={extraItems}
        />
      )}
    </div>
  );
};
