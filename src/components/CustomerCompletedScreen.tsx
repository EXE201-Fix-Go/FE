import React, { useState } from 'react';
import { Order } from '../api/orders';
import { ServerMessage } from './ServerMessage';
import { formatVND } from '../domain/money';

interface CustomerCompletedProps {
  onBackToHome: () => void;
  /** Đơn thật từ backend (đã COMPLETED). */
  order: Order;
  /** Gửi đánh giá lên backend. */
  onSubmitReview: (rating: number, feedback: string) => Promise<void>;
}

export const CustomerCompletedScreen: React.FC<CustomerCompletedProps> = ({
  onBackToHome,
  order,
  onSubmitReview,
}) => {
  const total = order.quote?.totalAmount ?? order.payment?.amount ?? order.callOutFee;
  const mechanicName = order.partner?.fullName || 'Thợ Fix&Go';
  const paid = order.payment?.status === 'CONFIRMED';
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const tags = [
    { id: 'Đến rất nhanh', label: 'Đến rất nhanh', icon: 'bolt' },
    { id: 'Giá đúng niêm yết', label: 'Giá đúng niêm yết', icon: 'sell' },
    { id: 'Thân thiện', label: 'Thân thiện', icon: 'mood' },
    { id: 'Tay nghề giỏi', label: 'Tay nghề giỏi', icon: 'handyman' },
  ];

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const text = [...selectedTags, feedbackText.trim()].filter(Boolean).join(' · ');
      await onSubmitReview(rating, text);
      setIsSubmitted(true);
      setTimeout(() => onBackToHome(), 1000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không gửi được đánh giá.');
    }
  };


  return (
    <div className="flex flex-col w-full px-gutter pb-space-xl space-y-space-md pt-2">
      {/* Success Celebration Banner */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-lg shadow-sm flex flex-col items-center text-center mt-space-sm border border-surface-container">
        <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-tertiary-container/10 pointer-events-none"></div>
        <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-primary-container/10 pointer-events-none"></div>

        {/* Animated Badge */}
        <div className="relative mb-space-sm">
          <div className="w-16 h-16 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center shadow-md">
            <span
              className="material-symbols-outlined text-[36px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-surface-container-lowest text-primary p-0.5 rounded-full shadow-sm flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">two_wheeler</span>
          </div>
        </div>

        <span className="font-label-sm text-[11px] uppercase tracking-widest text-tertiary font-bold mb-1">
          Dịch vụ đã hoàn tất
        </span>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-extrabold mb-1">
          Cứu hộ thành công!
        </h1>
        <p className="font-body-sm text-[13px] text-secondary max-w-[280px]">
          Xe của bạn đã được khắc phục hoàn chỉnh, sẵn sàng tiếp tục hành trình an toàn.
        </p>

      </div>

      {/* Mechanic & Receipt Summary Card */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md border border-surface-container">
        {/* Receipt Header */}
        <div className="flex items-center justify-between pb-space-xs border-b border-surface-container/60">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
            <span className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">
              Hóa đơn điện tử
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded font-mono font-bold">
            {order.orderCode}
          </span>
        </div>

        {/* Mechanic Profile Snapshot */}
        <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low border border-surface-container">
          <div
            aria-hidden
            className="w-12 h-12 rounded-full flex-shrink-0 bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-label-lg font-bold"
          >
            {mechanicName.trim().charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-label-md text-label-md text-on-surface font-bold truncate">
                {mechanicName}
              </span>
              <span
                className="material-symbols-outlined text-tertiary text-[16px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <span className="font-body-sm text-[12px] text-secondary">Thợ cứu hộ Fix&amp;Go</span>
          </div>
        </div>

        {/* Breakdown Details Grid */}
        <div className="space-y-space-xs pt-space-xs divide-y divide-surface-container/40">
          <div className="flex justify-between items-center py-1">
            <span className="font-body-sm text-body-sm text-secondary">Hạng mục khắc phục</span>
            <span className="font-label-sm text-[13px] text-on-surface text-right font-medium">
              {order.serviceName}
            </span>
          </div>
          <div className="flex justify-between items-center py-1 pt-1.5">
            <span className="font-body-sm text-body-sm text-secondary">Thời gian xử lý</span>
            <span className="font-label-sm text-[13px] text-on-surface text-right">
              {order.completedAt
                ? new Date(order.completedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
                : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center py-1 pt-1.5">
            <span className="font-body-sm text-body-sm text-secondary">Phương thức thanh toán</span>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${paid ? 'bg-tertiary' : 'bg-error'}`}></span>
              <span className="font-label-sm text-[13px] text-on-surface font-semibold">
                {paid ? 'Tiền mặt — thợ đã thu' : 'Tiền mặt — chờ thợ xác nhận'}
              </span>
            </div>
          </div>
        </div>

        {/* Total Amount Block */}
        <div className="pt-space-sm bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between border border-surface-container">
          <div>
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-bold block">
              Tổng thanh toán
            </span>
          </div>
          <span className="font-data-metric-md text-primary font-extrabold tracking-tight">
            {formatVND(total)}
          </span>
        </div>

        <p className="font-label-sm text-[11px] text-center text-secondary">
          {paid
            ? `Thợ đã xác nhận thu ${formatVND(total)} tiền mặt khi hoàn tất.`
            : 'Thợ sẽ xác nhận thu tiền mặt khi hoàn tất sửa chữa.'}
        </p>
        {error && (
          <ServerMessage variant="error">{error}</ServerMessage>
        )}
      </div>

      {/* Interactive Rating Card */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md border border-surface-container">
        <div className="text-center space-y-1">
          <span className="font-label-sm text-[11px] uppercase tracking-wider text-primary font-bold">
            Đánh giá trải nghiệm
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
            Bạn thấy dịch vụ của {mechanicName} thế nào?
          </h2>
          <p className="font-body-sm text-[13px] text-secondary">
            Góp ý của bạn giúp cải thiện an toàn cho cả cộng đồng tài xế.
          </p>
        </div>

        {/* Star Selector */}
        <div
          aria-label="Đánh giá số sao"
          className="flex justify-center items-center gap-2 py-space-xs"
          role="radiogroup"
        >
          {[1, 2, 3, 4, 5].map((starVal) => {
            const isFilled = starVal <= rating;
            return (
              <button
                key={starVal}
                onClick={() => setRating(starVal)}
                className="star-btn p-1 text-[#f59e0b] focus:outline-none transition-transform active:scale-90 hover:scale-110"
                type="button"
              >
                <span
                  className={`material-symbols-outlined text-[36px] ${
                    isFilled ? 'text-[#f59e0b]' : 'text-secondary-fixed-dim'
                  }`}
                  style={{ fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Feedback Tags */}
        <div className="space-y-space-xs">
          <span className="font-label-sm text-[12px] text-secondary font-semibold block text-center">
            Điểm cộng nổi bật:
          </span>
          <div className="flex flex-wrap justify-center gap-space-xs">
            {tags.map((tag) => {
              const active = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`tag-chip h-9 px-3 rounded-full font-label-sm text-[12px] flex items-center gap-1 transition-all ${
                    active
                      ? 'bg-primary-fixed text-on-primary-fixed font-bold'
                      : 'bg-surface-container text-secondary hover:text-on-surface'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">{tag.icon}</span>
                  <span>{tag.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Textarea */}
        <div className="space-y-1">
          <div className="relative bg-surface-container-low rounded-lg p-space-sm border border-surface-container">
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-secondary/70 resize-none outline-none"
              placeholder="Để lại lời nhắn cho thợ..."
              rows={3}
            ></textarea>
            <div className="flex justify-between items-center pt-1 text-secondary">
              <span className="material-symbols-outlined text-[18px] text-primary">favorite</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Interactive CTA Zone */}
      <div className="space-y-space-sm pt-space-xs">
        <button
          onClick={handleSubmit}
          className="w-full h-14 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-space-xs shadow-md active:translate-y-0.5 hover:opacity-95 transition-all font-bold"
          type="button"
        >
          {isSubmitted ? (
            <>
              <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
              <span>Cảm ơn bạn! Đang chuyển về trang chủ...</span>
            </>
          ) : (
            <>
              <span>Gửi đánh giá &amp; Về trang chủ</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
