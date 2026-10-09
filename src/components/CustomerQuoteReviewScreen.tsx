import React, { useState } from 'react';
import { Quote } from '../api/orders';
import { formatVND } from '../domain/money';
import { ServerMessage } from './ServerMessage';
import { QuoteBreakdown } from './QuoteBreakdown';
import { confirmDialog } from './notify';

interface CustomerQuoteReviewProps {
  /** Duyệt/từ chối trên backend; ném lỗi nếu thất bại. */
  onAccept: () => Promise<void> | void;
  onDecline: () => Promise<void> | void;
  /** Báo giá thật từ backend (đang chờ khách duyệt). */
  quote: Quote;
  orderCode?: string;
  mechanicName?: string | null;
}


export const CustomerQuoteReviewScreen: React.FC<CustomerQuoteReviewProps> = ({
  onAccept,
  onDecline,
  quote,
  orderCode,
  mechanicName,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = quote.totalAmount;
  const callOutFee = quote.callOutFeeAmount;
  const displayName = mechanicName || 'Thợ Fix&Go';

  const handleAcceptClick = async () => {
    setIsAccepting(true);
    setError(null);
    try {
      await onAccept();
      setIsAccepted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không duyệt được báo giá.');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="flex flex-col w-full px-gutter pb-space-xl space-y-space-md pt-2">
      {/* Status Chip & Reassurance Header */}
      <div className="flex items-center justify-between pt-space-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-container/15 text-tertiary">
          <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
          <span className="font-label-sm text-[11px] uppercase tracking-wider font-bold">
            Đã hoàn tất giám định tại chỗ
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-extrabold">
          Báo giá minh bạch
        </h2>
        <p className="font-body-sm text-[13px] text-secondary">
          Kiểm tra hoàn tất. Vui lòng xác nhận bảng kê chi tiết trước khi thợ tiến hành thay thế &amp; sửa chữa.
        </p>
      </div>

      {/* Dispatched Mechanic Profile Snippet */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm border border-surface-container">
        <div className="flex items-center gap-space-md">
          <div
            aria-hidden
            className="w-14 h-14 rounded-full flex-shrink-0 bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-headline-md text-[22px] font-bold"
          >
            {displayName.trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-headline-md text-headline-md text-on-surface truncate font-bold">
              {displayName}
            </h3>
            <p className="font-body-sm text-[12px] text-secondary mt-0.5">Thợ cứu hộ Fix&amp;Go</p>
          </div>
        </div>

      </div>

      {/* Itemized Breakdown Receipt */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md border border-surface-container">
        <div className="flex items-center justify-between pb-1 border-b border-surface-container/60">
          <span className="font-label-md text-label-md text-on-surface font-bold">
            Bảng kê chi tiết hạng mục
          </span>
          <span className="font-label-sm text-[11px] text-secondary bg-surface-container px-2 py-0.5 rounded font-mono font-bold">
            {orderCode ? `Mã đơn: ${orderCode}` : ''}
          </span>
        </div>

        <QuoteBreakdown quote={quote} />

        {/* Divider Pill */}
        <div className="w-full h-px bg-surface-container-high my-space-sm"></div>

        {/* Total Price Highlight Box */}
        <div className="p-space-md rounded-xl bg-surface-container-high/60 flex items-center justify-between gap-3 border border-surface-container">
          <div>
            <span className="font-label-sm text-[11px] text-secondary uppercase tracking-wider block font-bold">
              Tổng thanh toán
            </span>
          </div>
          <div className="text-right">
            <span className="font-data-metric-lg text-primary tracking-tight tabular-nums block font-extrabold">
              {formatVND(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Guarantee & Warranty Badge */}
      <div className="p-space-md rounded-xl bg-tertiary-container/10 flex items-start gap-3 border border-tertiary-container/20">
        <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-on-tertiary-container text-[22px]">
            verified
          </span>
        </div>
        <div className="space-y-0.5">
          <h4 className="font-label-md text-label-md text-tertiary font-bold">
            Cam kết minh bạch giá chuẩn
          </h4>
          <p className="font-body-sm text-[12.5px] text-on-surface leading-snug">
            Chỉ thanh toán đúng <strong className="font-bold text-on-surface">{formatVND(total)}</strong> sau khi xe sửa
            xong. Mọi hạng mục phát sinh thêm đều cần bạn đồng ý bằng một báo giá mới.
          </p>
        </div>
      </div>

      {/* Interactive Action Confirmation Deck */}
      <div className="pt-space-xs space-y-space-sm">
        {error && <ServerMessage variant="error">{error}</ServerMessage>}
        <div className="flex items-center gap-space-sm w-full">
          {/* Decline Secondary Button (32%) */}
          <button
            onClick={async () => {
              const ok = await confirmDialog(
                `Bạn muốn từ chối báo giá này? Bạn sẽ chỉ thanh toán ${formatVND(callOutFee)} chi phí kiểm tra và di chuyển cho thợ.`,
                { okText: 'Từ chối', cancelText: 'Giữ lại', danger: true }
              );
              if (ok) {
                Promise.resolve(onDecline()).catch((e: unknown) =>
                  setError(e instanceof Error ? e.message : 'Không từ chối được báo giá.')
                );
              }
            }}
            className="w-[32%] h-14 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md flex flex-col items-center justify-center active:bg-surface-container-high transition-all shadow-sm font-bold"
            type="button"
          >
            <span>Từ chối</span>
            <span className="font-label-sm text-[11px] text-secondary font-normal">Phí: {formatVND(callOutFee)}</span>
          </button>

          {/* Primary Accept CTA (68%) */}
          <button
            disabled={isAccepting || isAccepted}
            onClick={handleAcceptClick}
            className={`flex-1 h-14 rounded-xl text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(204,73,0,0.35)] active:scale-[0.98] transition-all font-bold ${
              isAccepted
                ? 'bg-tertiary-container'
                : 'bg-primary-container hover:opacity-95'
            }`}
            type="button"
          >
            {isAccepting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">
                  progress_activity
                </span>
                <span>Đang kích hoạt quy trình...</span>
              </>
            ) : isAccepted ? (
              <>
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
                <span>Đã xác nhận - Bắt đầu sửa</span>
              </>
            ) : (
              <>
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span>ĐỒNG Ý ({formatVND(total)})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
