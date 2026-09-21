import React, { useState, useEffect } from 'react';
import { ASSETS } from '../data';
import { Offer, PartnerProfile } from '../api/partner';
import { formatVND } from '../domain/money';
import { ORDER_STATUS_LABEL } from '../domain/status';

/** Dữ liệu thật từ backend; không có → chạy demo với đơn mẫu. */
export interface MechanicDashboardLive {
  profile: PartnerProfile | null;
  offers: Offer[];
  jobs: Offer[];
  error?: string | null;
  onAccept: (assignmentId: string) => Promise<void>;
  onDecline: (assignmentId: string) => Promise<void>;
  onOpenJob: (job: Offer) => void;
  onToggleReady: (ready: boolean) => Promise<void>;
}

interface MechanicDashboardProps {
  onAcceptJob: () => void;
  onLogout: () => void;
  live?: MechanicDashboardLive;
}

export const MechanicDashboardScreen: React.FC<MechanicDashboardProps> = ({
  onAcceptJob,
  onLogout,
  live,
}) => {
  const [isReady, setIsReady] = useState(true);
  const [timeLeft, setTimeLeft] = useState(12);
  const totalTime = 15;
  const [isJobRejected, setIsJobRejected] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [live]);
  const offer: Offer | null = live ? live.offers[0] ?? null : null;
  const showCard = live ? offer !== null : !isJobRejected;
  const secsLeft = offer?.expiresAt ? Math.max(0, Math.round((new Date(offer.expiresAt).getTime() - now) / 1000)) : timeLeft;
  const readyNow = live ? live.profile?.availability === 'ONLINE' : isReady;
  const displayName = live?.profile?.fullName || 'Nguyễn Văn Tuấn';
  const [isJobAccepting, setIsJobAccepting] = useState(false);

  useEffect(() => {
    if (isJobRejected || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isJobRejected, timeLeft]);

  const progressPercent = live ? Math.min(100, (secsLeft / 90) * 100) : Math.max(0, (timeLeft / totalTime) * 100);

  const handleAccept = async () => {
    setIsJobAccepting(true);
    setLiveError(null);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 200]);
    }
    if (live && offer) {
      try {
        await live.onAccept(offer.assignmentId);
      } catch (e: unknown) {
        setLiveError(e instanceof Error ? e.message : 'Không nhận được đơn.');
      } finally {
        setIsJobAccepting(false);
      }
      return;
    }
    setTimeout(() => {
      onAcceptJob();
    }, 800);
  };

  const handleDecline = () => {
    if (live && offer) {
      live.onDecline(offer.assignmentId).catch((e: unknown) =>
        setLiveError(e instanceof Error ? e.message : 'Không từ chối được.')
      );
      return;
    }
    setIsJobRejected(true);
  };

  const handleToggleReady = () => {
    if (live) {
      live.onToggleReady(!readyNow).catch((e: unknown) =>
        setLiveError(e instanceof Error ? e.message : 'Không đổi được trạng thái.')
      );
      return;
    }
    setIsReady(!isReady);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-surface pb-28">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 max-w-md mx-auto z-50 bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
        <div className="h-20 px-gutter flex flex-col justify-center gap-space-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <img
                alt="Brand logo"
                className="h-8 w-auto object-contain"
                src={ASSETS.logo}
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-lg text-label-lg text-on-surface leading-none font-bold">
                    {displayName}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-sm text-[10px] leading-none uppercase font-bold">
                    Đội 1 • Q.1
                  </span>
                </div>
                <span className="font-body-sm text-[12px] text-secondary leading-tight mt-0.5">
                  Kỹ thuật viên Fix&amp;Go
                </span>
              </div>
            </div>

            <div className="flex items-center gap-space-sm">
              <button
                aria-label="Trạng thái trực tuyến"
                onClick={handleToggleReady}
                className={`min-h-[40px] px-3 py-1.5 rounded-full flex items-center gap-1.5 active:scale-95 transition-all shadow-xs ${
                  readyNow
                    ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold'
                    : 'bg-surface-container text-secondary'
                }`}
                type="button"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    readyNow ? 'bg-tertiary animate-pulse' : 'bg-secondary'
                  }`}
                ></span>
                <span className="font-label-sm text-[11px] uppercase tracking-wide font-bold">
                  {readyNow ? 'Sẵn sàng' : 'Tạm nghỉ'}
                </span>
              </button>

              <button
                onClick={onLogout}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-on-primary hover:opacity-90 active:scale-95 transition-all shadow-sm"
                title="Đăng xuất"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col relative w-full pt-20 px-gutter gap-space-md mt-2">
        {(live?.error || liveError) && (
          <div role="alert" className="rounded-xl bg-error-container text-on-error-container font-body-sm px-[15px] py-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{live?.error || liveError}</span>
          </div>
        )}
        {live && live.jobs.length > 0 && (
          <section className="bg-surface-container-lowest rounded-xl p-[15px] shadow-sm border border-tertiary/30 flex flex-col gap-2">
            <h3 className="font-label-lg text-on-surface font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-tertiary">build_circle</span>
              Đơn đang thực hiện
            </h3>
            {live.jobs.map((j) => (
              <button
                key={j.assignmentId}
                type="button"
                onClick={() => live.onOpenJob(j)}
                className="w-full text-left rounded-lg bg-surface-container-low p-[15px] flex items-center justify-between gap-2 active:scale-[0.99]"
              >
                <div className="min-w-0">
                  <div className="font-label-md text-on-surface font-bold truncate">{j.serviceName}</div>
                  <div className="font-label-sm text-[11px] text-secondary font-mono">{j.orderCode}</div>
                  <div className="font-body-sm text-[12px] text-secondary truncate">{j.addressText}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-sm text-[11px] font-bold shrink-0">
                  {ORDER_STATUS_LABEL[j.orderStatus] ?? j.orderStatus}
                </span>
              </button>
            ))}
          </section>
        )}

        {/* Thống Kê Nhanh Hôm Nay (Bento Dashboard Grid) */}
        <section className="grid grid-cols-2 gap-space-sm">
          {/* Doanh thu & Cuốc hoàn thành */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between border border-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[11px] text-secondary uppercase tracking-wider font-bold">
                Hôm nay
              </span>
              <span className="p-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
              </span>
            </div>
            <div className="mt-space-sm">
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary block tracking-tight font-extrabold">
                480.000 ₫
              </span>
              <span className="font-body-sm text-[12px] text-secondary flex items-center gap-1 mt-0.5 font-medium">
                <span className="font-label-md text-label-md text-on-surface font-bold">6</span> cuốc hoàn tất
              </span>
            </div>
          </div>

          {/* Tỉ lệ nhận & Đánh giá sao */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between border border-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[11px] text-secondary uppercase tracking-wider font-bold">
                Hiệu suất
              </span>
              <span className="p-1 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[16px]">verified</span>
              </span>
            </div>
            <div className="mt-space-sm flex items-end justify-between">
              <div>
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface block tracking-tight font-extrabold">
                  98%
                </span>
                <span className="font-body-sm text-[12px] text-secondary">Tỷ lệ nhận</span>
              </div>
              <div className="text-right">
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface flex items-center justify-end gap-0.5 font-extrabold">
                  4.9
                  <span
                    className="material-symbols-outlined text-[18px] text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                </span>
                <span className="font-body-sm text-[12px] text-secondary">52 đánh giá</span>
              </div>
            </div>
          </div>
        </section>

        {/* Flash Card: Cuốc Cứu Hộ Khẩn Cấp Mới (Incoming Job Radar) */}
        {showCard ? (
          <section
            className="bg-surface-container-lowest rounded-xl p-space-md shadow-xl relative overflow-hidden transition-all duration-300 border border-primary/20"
            id="incoming-order-card"
          >
            {/* Thanh đếm lùi thời gian */}
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mb-space-md">
              <div
                className="bg-primary-container h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Header Đơn cứu hộ & Timer */}
            <div className="flex items-start justify-between gap-space-sm pb-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-primary-container text-on-primary-container shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-[28px] animate-bounce text-white">
                    e911_emergency
                  </span>
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-error rounded-full animate-ping"></span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-[11px] uppercase font-bold">
                      Khẩn cấp
                    </span>
                    <span className="font-label-sm text-[11px] text-secondary font-mono font-bold">
                      Mã: {offer ? offer.orderCode : '#HG-9021'}
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface mt-0.5 leading-snug font-bold">
                    {offer ? offer.serviceName : 'Vá lốp lưu động'}
                  </h2>
                </div>
              </div>

              {/* Vòng đếm giây */}
              <div className="flex flex-col items-center justify-center bg-surface-container-high px-2.5 py-1.5 rounded-xl shrink-0 border border-surface-container-highest">
                <span className="font-label-sm text-[10px] text-secondary uppercase leading-none font-bold">
                  Hết hạn
                </span>
                <div className="flex items-baseline gap-0.5 mt-0.5">
                  <span className="font-data-metric-md text-[20px] text-primary leading-none font-extrabold">
                    {secsLeft}
                  </span>
                  <span className="font-label-sm text-[11px] text-primary font-bold">s</span>
                </div>
              </div>
            </div>

            {/* Dự toán thu nhập nổi bật */}
            <div className="bg-surface-container-low rounded-xl p-[15px] flex items-center justify-between my-space-xs border border-surface-container">
              <div>
                <span className="font-body-sm text-[12px] text-secondary block font-medium">
                  Ước tính thu nhập
                </span>
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight font-extrabold">
                  {offer ? `${formatVND(offer.callOutFee)} + công` : '95.000 ₫ - 120.000 ₫'}
                </span>
              </div>
              <div className="text-right">
                <span className="font-label-sm text-[11px] text-tertiary font-bold bg-surface-container-lowest px-2 py-1 rounded shadow-xs block">
                  Đã gồm 30k phí di chuyển
                </span>
              </div>
            </div>

            {/* Thông tin lộ trình & Khoảng cách */}
            <div className="flex flex-col gap-space-sm py-space-sm">
              {/* Khoảng cách di chuyển */}
              <div className="flex items-center gap-space-sm bg-surface-container-high/40 p-space-sm rounded-lg border border-surface-container">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">near_me</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-label-lg text-label-lg text-on-surface font-bold">
                      {offer ? `Vòng phát ${offer.roundNo}` : '1.2 km'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-secondary"></span>
                    <span className="font-label-md text-label-md text-tertiary font-bold">
                      {offer ? 'trong bán kính của bạn' : '~4 phút xe máy'}
                    </span>
                  </div>
                  <p className="font-body-sm text-[12px] text-secondary truncate">
                    Tuyến nhanh nhất: Nguyễn Trãi ➔ Cống Quỳnh
                  </p>
                </div>
              </div>

              {/* Địa chỉ chi tiết */}
              <div className="flex items-start gap-space-sm pt-1">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-label-md text-label-md text-on-surface font-bold block">
                    {offer ? offer.addressText : '242 Cống Quỳnh, P. Phạm Ngũ Lão, Q.1'}
                  </span>
                  <span className="font-body-sm text-[12px] text-secondary block mt-0.5">
                    Vị trí nhận diện: Trước cửa hàng tiện lợi Circle K
                  </span>
                </div>
              </div>

              {/* Chi tiết phương tiện & Ghi chú khách */}
              <div className="flex items-start gap-space-sm">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">two_wheeler</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-label-md text-label-md text-on-surface font-bold block">
                    Honda Vision 2022 • Lốp không ruột (Tubeless)
                  </span>
                  <div className="mt-1 bg-surface-container-high/60 p-2.5 rounded-lg flex items-start gap-1.5 border border-surface-container">
                    <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">
                      chat
                    </span>
                    <p className="font-body-sm text-[12.5px] text-on-surface italic leading-snug">
                      "{offer ? offer.note || 'Không có ghi chú' : 'Bị cán đinh gần ngã 4, xe hết hơi xẹp lép không dắt được. Cần hỗ trợ vá nấm gấp ạ!'}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Khối Tác Vụ Cỡ Đại */}
            <div className="pt-space-sm flex items-center gap-space-sm">
              {/* Nút Từ chối */}
              <button
                onClick={handleDecline}
                className="min-h-[56px] px-space-md rounded-xl bg-surface-container text-on-surface font-label-lg text-label-lg active:scale-95 transition-transform flex items-center justify-center shrink-0 font-bold"
                type="button"
              >
                Từ chối
              </button>

              {/* Nút Nhận Đơn Khẩn Cấp */}
              <button
                onClick={handleAccept}
                disabled={isJobAccepting}
                className="flex-1 min-h-[56px] px-space-md rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg uppercase tracking-wider flex items-center justify-center gap-space-xs shadow-lg shadow-primary-container/30 active:scale-[0.98] transition-all font-bold"
                type="button"
              >
                {isJobAccepting ? (
                  <>
                    <span className="material-symbols-outlined text-[24px] animate-spin">
                      progress_activity
                    </span>
                    <span>Đang kết nối khách...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[24px]">electric_bolt</span>
                    <span>Nhận Đơn Ngay</span>
                  </>
                )}
              </button>
            </div>
          </section>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl p-space-md text-center space-y-2 border border-surface-container">
            <span className="material-symbols-outlined text-[36px] text-secondary">
              notifications_paused
            </span>
            <h3 className="font-headline-md text-on-surface font-bold">
              {live ? (readyNow ? 'Đang chờ đơn mới…' : 'Bạn đang tạm nghỉ') : 'Đã bỏ qua đơn này'}
            </h3>
            <p className="font-body-sm text-[12.5px] text-secondary">
              {live
                ? readyNow
                  ? 'Khi khách gần bạn đặt cứu hộ, đơn sẽ hiện ở đây (tự làm mới mỗi 3 giây).'
                  : 'Bật "Sẵn sàng" ở góc trên để nhận đơn.'
                : 'Hệ thống đang quét các sự cố tiếp theo xung quanh khu vực Quận 1.'}
            </p>
            {!live && (
              <button
                onClick={() => {
                  setIsJobRejected(false);
                  setTimeLeft(15);
                }}
                className="px-3 py-1.5 rounded-lg bg-primary-fixed text-on-primary-fixed font-label-sm text-[12px] font-bold"
              >
                Mô phỏng lại đơn mới
              </button>
            )}
          </div>
        )}

        {/* Bản Đồ Tải Nhiệt Cứu Hộ & Điểm Nóng (Heatmap Q1) */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-sm border border-surface-container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error animate-pulse"></div>
              <h3 className="font-label-lg text-label-lg text-on-surface font-bold">
                Bản đồ nhu cầu khu vực Q.1
              </h3>
            </div>
            <span className="font-label-sm text-[12px] text-primary uppercase font-bold">
              Nhu cầu cao
            </span>
          </div>

          <div
            className="w-full h-40 bg-cover bg-center rounded-xl relative overflow-hidden flex flex-col justify-end p-space-sm shadow-inner"
            style={{ backgroundImage: `url('${ASSETS.heatmapQ1}')` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent"></div>
            <div className="relative z-10 flex items-center justify-between text-inverse-on-surface">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-tertiary-fixed text-[18px]">
                  local_fire_department
                </span>
                <span className="font-label-sm text-[12px] font-medium">
                  Đang có 14 sự cố đang chờ điều phối
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-container-lowest/20 backdrop-blur-md text-inverse-on-surface font-label-sm text-[11px] font-bold">
                Bán kính 2.5 km
              </span>
            </div>
          </div>
        </section>

        {/* Checklist Dụng Cụ Cốp Xe Cần Kiểm Tra */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-md border border-surface-container">
          <div className="flex items-center justify-between pb-space-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">handyman</span>
              <h3 className="font-label-lg text-label-lg text-on-surface font-bold">
                Dụng cụ khuyến nghị cho ca trực
              </h3>
            </div>
            <span className="font-label-sm text-[11px] text-secondary font-bold">4/4 Sẵn sàng</span>
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            {/* Món 1: Dùi & Keo vá nấm */}
            <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center gap-2.5 border border-surface-container">
              <div className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <div className="min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface block truncate font-bold">
                  Vá nấm &amp; Cao su
                </span>
                <span className="font-body-sm text-[11px] text-secondary block">Đầy đủ 12 nút</span>
              </div>
            </div>

            {/* Món 2: Máy bơm điện 12V */}
            <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center gap-2.5 border border-surface-container">
              <div className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <div className="min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface block truncate font-bold">
                  Bơm lốp pin mini
                </span>
                <span className="font-body-sm text-[11px] text-secondary block">Pin 95%</span>
              </div>
            </div>

            {/* Món 3: Cáp kích bình */}
            <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center gap-2.5 border border-surface-container">
              <div className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <div className="min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface block truncate font-bold">
                  Bộ kích ắc quy
                </span>
                <span className="font-body-sm text-[11px] text-secondary block">12.6V chuẩn</span>
              </div>
            </div>

            {/* Món 4: Áo phản quang */}
            <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center gap-2.5 border border-surface-container">
              <div className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">check</span>
              </div>
              <div className="min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface block truncate font-bold">
                  Áo phản quang
                </span>
                <span className="font-body-sm text-[11px] text-secondary block">Cứu hộ đêm</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Mechanic Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 max-w-md mx-auto z-40 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-4px_16px_rgba(11,28,48,0.06)] border-t border-surface-container">
        <div className="flex justify-around items-center h-16 px-gutter max-w-md mx-auto">
          <button
            className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] text-primary font-bold active:scale-95"
            type="button"
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              build
            </span>
            <span className="font-label-sm text-[11px]">Cứu hộ</span>
          </button>

          <button
            onClick={() => alert('Thu nhập hôm nay: 480.000 ₫ • Tháng này: 12.450.000 ₫')}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] text-secondary hover:text-on-surface transition-colors active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            <span className="font-label-sm text-[11px]">Thu nhập</span>
          </button>

          <button
            onClick={() => alert('Đánh giá 4.9 sao • 52 đánh giá tích cực trong tháng')}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] text-secondary hover:text-on-surface transition-colors active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">star</span>
            <span className="font-label-sm text-[11px]">Đánh giá</span>
          </button>

          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] text-secondary hover:text-on-surface transition-colors active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[24px]">logout</span>
            <span className="font-label-sm text-[11px]">Đăng xuất</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
