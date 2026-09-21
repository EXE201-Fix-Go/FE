import React, { useState } from 'react';
import { ASSETS, DEFAULT_MECHANIC } from '../data';
import { Order } from '../api/orders';
import { formatVND } from '../domain/money';

interface CustomerCompletedProps {
  onBackToHome: () => void;
  onViewWarranty: () => void;
  /** Đơn thật từ backend (đã COMPLETED); không có → hiển thị mẫu. */
  order?: Order | null;
  /** Gửi đánh giá lên backend. */
  onSubmitReview?: (rating: number, feedback: string) => Promise<void>;
}

export const CustomerCompletedScreen: React.FC<CustomerCompletedProps> = ({
  onBackToHome,
  onViewWarranty,
  order,
  onSubmitReview,
}) => {
  const total = order?.quote?.totalAmount ?? order?.payment?.amount ?? 120000;
  const mechanicName = order?.partner?.fullName || DEFAULT_MECHANIC.name;
  const paid = order ? order.payment?.status === 'CONFIRMED' : true;
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Đến rất nhanh',
    'Giá đúng niêm yết',
  ]);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPdfDownloaded, setIsPdfDownloaded] = useState(false);

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
      if (onSubmitReview) {
        const text = [...selectedTags, feedbackText.trim()].filter(Boolean).join(' · ');
        await onSubmitReview(rating, text);
      }
      setIsSubmitted(true);
      setTimeout(() => onBackToHome(), 1000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không gửi được đánh giá.');
    }
  };


  const handleDownloadPdf = () => {
    setIsPdfDownloaded(true);
    setTimeout(() => setIsPdfDownloaded(false), 3000);
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

        {/* Warranty Certificate Chip */}
        <div
          onClick={onViewWarranty}
          className="mt-space-md w-full bg-surface-container-lowest rounded-lg p-space-sm flex items-center gap-space-sm text-left shadow-sm cursor-pointer hover:bg-surface-container-low transition-colors border border-surface-container"
        >
          <div className="w-8 h-8 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-label-sm text-label-sm text-on-surface font-bold">
                Bảo hành 30 ngày
              </span>
              <span className="bg-tertiary-container text-on-tertiary text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                Kích hoạt
              </span>
            </div>
            <p className="font-body-sm text-[12px] leading-tight text-secondary truncate">
              Phiếu bảo hành điện tử đã lưu vào mục Hồ sơ
            </p>
          </div>
          <span className="material-symbols-outlined text-secondary text-[18px]">
            chevron_right
          </span>
        </div>
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
            {order ? order.orderCode : '#FG-88294'}
          </span>
        </div>

        {/* Mechanic Profile Snapshot */}
        <div className="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-low border border-surface-container">
          <img
            className="w-12 h-12 rounded-full object-cover shadow-sm flex-shrink-0"
            alt={mechanicName}
            src={ASSETS.mechanicReceiptAvatar}
          />
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
            <span className="font-body-sm text-[12px] text-secondary">
              Kỹ thuật viên Fix&amp;Go • Đội Cứu Hộ Q.1
            </span>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="font-label-sm text-[11px] text-on-surface bg-surface-container-highest px-2 py-1 rounded font-bold">
              59-P1 888.88
            </span>
          </div>
        </div>

        {/* Breakdown Details Grid */}
        <div className="space-y-space-xs pt-space-xs divide-y divide-surface-container/40">
          <div className="flex justify-between items-center py-1">
            <span className="font-body-sm text-body-sm text-secondary">Hạng mục khắc phục</span>
            <span className="font-label-sm text-[13px] text-on-surface text-right font-medium">
              Vá nấm lốp không ruột cao cấp
            </span>
          </div>
          <div className="flex justify-between items-center py-1 pt-1.5">
            <span className="font-body-sm text-body-sm text-secondary">Thời gian xử lý</span>
            <span className="font-label-sm text-[13px] text-on-surface text-right">
              {order?.completedAt
                ? new Date(order.completedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
                : '22:45 • 18/10/2024'}
            </span>
          </div>
          <div className="flex justify-between items-center py-1 pt-1.5">
            <span className="font-body-sm text-body-sm text-secondary">Phương thức thanh toán</span>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${paid ? 'bg-tertiary' : 'bg-error'}`}></span>
              <span className="font-label-sm text-[13px] text-on-surface font-semibold">
                {order ? (paid ? 'Tiền mặt — thợ đã thu' : 'Tiền mặt — chờ thợ xác nhận') : 'MoMo QR (Thành công)'}
              </span>
            </div>
          </div>
        </div>

        {/* Total Amount Block */}
        <div className="pt-space-sm bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between border border-surface-container">
          <div>
            <span className="font-label-sm text-[11px] uppercase tracking-wider text-secondary font-bold block">
              Tổng cước phí niêm yết
            </span>
            <span className="font-label-sm text-[12px] text-tertiary flex items-center gap-0.5 font-medium">
              <span className="material-symbols-outlined text-[14px]">shield</span> Không phụ phí đêm
            </span>
          </div>
          <span className="font-data-metric-md text-primary font-extrabold tracking-tight">
            {formatVND(total)}
          </span>
        </div>

        {order && (
          <p className="font-label-sm text-[11px] text-center text-secondary">
            {paid
              ? `Thợ đã xác nhận thu ${formatVND(total)} tiền mặt khi hoàn tất.`
              : 'Thợ sẽ xác nhận thu tiền mặt khi hoàn tất sửa chữa.'}
          </p>
        )}
        {error && (
          <div role="alert" className="rounded-xl bg-error-container text-on-error-container font-body-sm px-[15px] py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
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
              placeholder="Để lại lời nhắn động viên thợ (Ví dụ: Thợ nhiệt tình, vá nhanh sạch sẽ)..."
              rows={3}
            ></textarea>
            <div className="flex justify-between items-center pt-1 text-secondary">
              <span className="material-symbols-outlined text-[18px] text-primary">favorite</span>
              <span className="font-label-sm text-[11px]">Ẩn danh đối với người khác</span>
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

        <div className="flex justify-center items-center">
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1 text-secondary hover:text-on-surface font-label-sm text-[12.5px] py-2 px-3 rounded-md transition-colors font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">
              download_for_offline
            </span>
            <span>
              {isPdfDownloaded
                ? '✓ Đã tải hóa đơn FG-88294.pdf'
                : 'Tải hóa đơn VAT (PDF)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
