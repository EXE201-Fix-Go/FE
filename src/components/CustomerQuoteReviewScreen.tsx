import React, { useState } from 'react';
import { ASSETS, DEFAULT_MECHANIC } from '../data';
import { Quote } from '../api/orders';
import { formatVND } from '../domain/money';

interface CustomerQuoteReviewProps {
  /** Duyệt/từ chối trên backend; ném lỗi nếu thất bại. */
  onAccept: () => Promise<void> | void;
  onDecline: () => Promise<void> | void;
  /** Báo giá thật từ backend; không có → hiển thị mẫu. */
  quote?: Quote | null;
  orderCode?: string;
  mechanicName?: string | null;
}

const ITEM_TYPE_LABEL: Record<string, string> = {
  LABOR: 'Tiền công',
  PART: 'Linh kiện / vật tư',
  SURCHARGE: 'Phụ phí',
  DISCOUNT: 'Giảm giá',
  SUPPORT: 'Hỗ trợ (dắt / kéo / gửi xe)',
};

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
  const total = quote ? quote.totalAmount : 120000;
  const callOutFee = quote ? quote.callOutFeeAmount : 30000;
  const displayName = mechanicName || DEFAULT_MECHANIC.name;

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
        <span className="font-label-sm text-[12px] text-secondary flex items-center gap-1 font-semibold">
          <span className="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
          Bảo hộ giá 100%
        </span>
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
          <div className="relative flex-shrink-0">
            <img
              alt={`Thợ sửa xe ${displayName}`}
              className="w-14 h-14 rounded-full object-cover shadow-sm"
              src={DEFAULT_MECHANIC.avatar}
            />
            <div className="absolute -bottom-1 -right-1 bg-tertiary text-on-tertiary rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-bold shadow-sm">
              ✓
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface truncate font-bold">
                {displayName}
              </h3>
              <span className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm font-bold">
                <span
                  className="material-symbols-outlined text-[14px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                4.9
              </span>
            </div>
            <p className="font-body-sm text-[12px] text-secondary flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[15px] text-primary">verified</span>
              {DEFAULT_MECHANIC.team}
            </p>
          </div>
        </div>

        {/* Diagnostic result card */}
        <div className="px-space-md py-2.5 rounded-lg bg-surface-container-low flex items-start gap-2.5 border border-surface-container">
          <span className="material-symbols-outlined text-primary text-[20px] flex-shrink-0 mt-0.5">
            build_circle
          </span>
          <div className="text-on-surface min-w-0">
            <span className="font-label-sm text-[11px] text-on-surface-variant block uppercase tracking-wide font-bold">
              Chẩn đoán sự cố:
            </span>
            <span className="font-body-sm text-[13px] text-on-surface font-semibold">
              Thủng lốp do đinh tán • Cần vá nấm chịu lực chuyên dụng
            </span>
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
            {orderCode ? `Mã đơn: ${orderCode}` : 'Mã dịch vụ: #FG-8821'}
          </span>
        </div>

        {quote ? (
          <div className="space-y-3 font-body-sm text-body-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <span className="w-5 h-5 rounded-full bg-surface-container text-secondary flex items-center justify-center font-label-sm text-[11px] flex-shrink-0 mt-0.5 font-bold">
                  0
                </span>
                <div>
                  <p className="text-on-surface font-medium leading-snug">Phí gọi thợ (đã xác nhận)</p>
                  <p className="font-label-sm text-[11px] text-secondary">Điều phối &amp; di chuyển tận nơi</p>
                </div>
              </div>
              <span className="font-label-md text-label-md text-on-surface tabular-nums whitespace-nowrap font-bold">
                {formatVND(quote.callOutFeeAmount)}
              </span>
            </div>
            {quote.items.map((it) => {
              const discount = it.itemType === 'DISCOUNT';
              return (
                <div
                  key={it.id}
                  className={`flex items-center justify-between gap-2 ${
                    discount ? 'p-2.5 rounded-lg bg-surface-container-low border border-surface-container' : ''
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-surface-container text-secondary flex items-center justify-center font-label-sm text-[11px] flex-shrink-0 mt-0.5 font-bold">
                      {it.lineNo}
                    </span>
                    <div className="min-w-0">
                      <p className="text-on-surface font-medium leading-snug">{it.description}</p>
                      <p className="font-label-sm text-[11px] text-secondary">
                        {ITEM_TYPE_LABEL[it.itemType] ?? it.itemType}
                        {it.quantity !== 1 ? ` · ${it.quantity} × ${formatVND(it.unitPrice)}` : ''}
                      </p>
                    </div>
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
        ) : (
        <div className="space-y-3 font-body-sm text-body-sm">
          {/* Item 1 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <span className="w-5 h-5 rounded-full bg-surface-container text-secondary flex items-center justify-center font-label-sm text-[11px] flex-shrink-0 mt-0.5 font-bold">
                1
              </span>
              <div>
                <p className="text-on-surface font-medium leading-snug">Phí xuất phát cứu hộ</p>
                <p className="font-label-sm text-[11px] text-secondary">Điều phối &amp; di chuyển tận nơi</p>
              </div>
            </div>
            <span className="font-label-md text-label-md text-on-surface tabular-nums whitespace-nowrap font-bold">
              30.000 ₫
            </span>
          </div>

          {/* Item 2 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <span className="w-5 h-5 rounded-full bg-surface-container text-secondary flex items-center justify-center font-label-sm text-[11px] flex-shrink-0 mt-0.5 font-bold">
                2
              </span>
              <div>
                <p className="text-on-surface font-medium leading-snug">Tiền công kiểm tra &amp; sửa chữa</p>
                <p className="font-label-sm text-[11px] text-secondary">
                  Rút đinh, làm sạch bề mặt &amp; bơm áp suất
                </p>
              </div>
            </div>
            <span className="font-label-md text-label-md text-on-surface tabular-nums whitespace-nowrap font-bold">
              40.000 ₫
            </span>
          </div>

          {/* Item 3 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <span className="w-5 h-5 rounded-full bg-surface-container text-secondary flex items-center justify-center font-label-sm text-[11px] flex-shrink-0 mt-0.5 font-bold">
                3
              </span>
              <div>
                <p className="text-on-surface font-medium leading-snug">Miếng vá nấm chịu lực cao cấp</p>
                <p className="font-label-sm text-[11px] text-secondary">
                  Chống rò rỉ áp suất lốp không ruột (Japan Tech)
                </p>
              </div>
            </div>
            <span className="font-label-md text-label-md text-on-surface tabular-nums whitespace-nowrap font-bold">
              50.000 ₫
            </span>
          </div>

          {/* Item 4 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <span className="w-5 h-5 rounded-full bg-surface-container text-secondary flex items-center justify-center font-label-sm text-[11px] flex-shrink-0 mt-0.5 font-bold">
                4
              </span>
              <div>
                <p className="text-on-surface font-medium leading-snug">Phụ phí cứu hộ ban đêm</p>
                <p className="font-label-sm text-[11px] text-secondary">Khung giờ an toàn sau 22:00</p>
              </div>
            </div>
            <span className="font-label-md text-label-md text-on-surface tabular-nums whitespace-nowrap font-bold">
              20.000 ₫
            </span>
          </div>

          {/* Item 5 (Discount) */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-tertiary text-[20px] flex-shrink-0">
                sell
              </span>
              <div className="truncate">
                <p className="text-on-surface font-medium leading-snug truncate">
                  Mã giảm giá Fix&amp;Go Thành viên mới
                </p>
                <p className="font-label-sm text-[11px] text-tertiary font-bold">
                  Ưu đãi đồng hành an tâm
                </p>
              </div>
            </div>
            <span className="font-label-lg text-label-lg text-tertiary tabular-nums whitespace-nowrap font-extrabold">
              -20.000 ₫
            </span>
          </div>
        </div>
        )}

        {/* Divider Pill */}
        <div className="w-full h-px bg-surface-container-high my-space-sm"></div>

        {/* Total Price Highlight Box */}
        <div className="p-space-md rounded-xl bg-surface-container-high/60 flex items-center justify-between gap-3 border border-surface-container">
          <div>
            <span className="font-label-sm text-[11px] text-secondary uppercase tracking-wider block font-bold">
              Tổng thanh toán (đã gồm VAT)
            </span>
            <span className="font-body-sm text-[12px] text-on-surface-variant font-medium">
              Không phát sinh bất kỳ chi phí nào
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
            xong và chạy thử. Miễn phí bảo hành vết vá <strong>30 ngày</strong> trên toàn hệ thống Fix&amp;Go.
          </p>
        </div>
      </div>

      {/* Interactive Action Confirmation Deck */}
      <div className="pt-space-xs space-y-space-sm">
        {error && (
          <div role="alert" className="rounded-xl bg-error-container text-on-error-container font-body-sm px-[15px] py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}
        <div className="flex items-center gap-space-sm w-full">
          {/* Decline Secondary Button (32%) */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  `Bạn muốn từ chối báo giá này? Bạn sẽ chỉ thanh toán ${formatVND(callOutFee)} chi phí kiểm tra và di chuyển cho thợ.`
                )
              ) {
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

        {/* Safety Microcopy */}
        <p className="font-label-sm text-[11px] text-center text-secondary">
          Sau khi bấm Đồng ý, thợ sẽ tiến hành thi công vá nấm trong ~10-15 phút.
        </p>
      </div>
    </div>
  );
};
