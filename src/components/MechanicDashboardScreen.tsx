import React, { useState, useEffect } from 'react';
import { ASSETS } from '../data';
import { Offer, PartnerProfile, PartnerStats } from '../api/partner';
import { ServerMessage } from './ServerMessage';
import { formatVND } from '../domain/money';
import { PARTNER_ORDER_STATUS_LABEL } from '../domain/status';
import { MechanicBottomNav } from './MechanicBottomNav';

/** Dữ liệu thật từ backend (hồ sơ, lời mời, đơn đang làm, thống kê). */
export interface MechanicDashboardLive {
  profile: PartnerProfile | null;
  stats: PartnerStats | null;
  offers: Offer[];
  jobs: Offer[];
  error?: string | null;
  onAccept: (assignmentId: string) => Promise<void>;
  onDecline: (assignmentId: string) => Promise<void>;
  onOpenJob: (job: Offer) => void;
  onToggleReady: (ready: boolean) => Promise<void>;
}

interface MechanicDashboardProps {
  onOpenIncome: () => void;
  onOpenReviews: () => void;
  onOpenProfile: () => void;
  live: MechanicDashboardLive;
}

export const MechanicDashboardScreen: React.FC<MechanicDashboardProps> = ({
  onOpenIncome,
  onOpenReviews,
  onOpenProfile,
  live,
}) => {
  const [isTogglingReady, setIsTogglingReady] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const offer: Offer | null = live.offers[0] ?? null;
  const secsLeft = offer?.expiresAt ? Math.max(0, Math.round((new Date(offer.expiresAt).getTime() - now) / 1000)) : 0;
  const readyNow = live.profile?.availability === 'ONLINE';
  const displayName = live.profile?.fullName || 'Đối tác Fix&Go';
  const [isJobAccepting, setIsJobAccepting] = useState(false);

  const progressPercent = Math.min(100, (secsLeft / 90) * 100);

  const handleAccept = async () => {
    if (!offer) return;
    setIsJobAccepting(true);
    setLiveError(null);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 200]);
    }
    try {
      await live.onAccept(offer.assignmentId);
    } catch (e: unknown) {
      setLiveError(e instanceof Error ? e.message : 'Không nhận được đơn.');
    } finally {
      setIsJobAccepting(false);
    }
  };

  const handleDecline = () => {
    if (!offer) return;
    live.onDecline(offer.assignmentId).catch((e: unknown) =>
      setLiveError(e instanceof Error ? e.message : 'Không từ chối được.')
    );
  };

  const handleToggleReady = async () => {
    if (isTogglingReady) return;
    setIsTogglingReady(true);
    setLiveError(null);
    try {
      await live.onToggleReady(!readyNow);
    } catch (e: unknown) {
      setLiveError(e instanceof Error ? e.message : 'Không đổi được trạng thái.');
    } finally {
      setIsTogglingReady(false);
    }
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
                className="h-9 w-auto object-contain"
                src={ASSETS.logo}
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs">
                  <span className="font-label-lg text-label-lg text-on-surface leading-none font-bold">
                    {displayName}
                  </span>
                </div>
                <span className="font-body-sm text-[12px] text-secondary leading-tight mt-0.5">
                  Đối tác Fix&amp;Go
                </span>
              </div>
            </div>

            <div className="flex items-center gap-space-sm">
              <div className="flex flex-col items-center gap-0.5">
                <button
                  aria-label={readyNow ? 'Đang online, tắt trạng thái trực tuyến' : 'Đang offline, bật trạng thái trực tuyến'}
                  aria-pressed={readyNow}
                  aria-busy={isTogglingReady}
                  disabled={isTogglingReady}
                  onClick={handleToggleReady}
                  className={`relative h-8 w-14 shrink-0 rounded-full p-1 active:scale-95 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-wait ${
                    readyNow
                      ? 'bg-emerald-500'
                      : 'bg-surface-container-high'
                  }`}
                  title={readyNow ? 'Đang online' : 'Đang offline'}
                  type="button"
                >
                  <span
                    className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.22)] transition-transform duration-200 ease-out ${
                      readyNow ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></span>
                  {isTogglingReady && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/10">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                    </span>
                  )}
                </button>
                <span className={`font-label-sm text-[9px] uppercase tracking-wide font-bold ${readyNow ? 'text-emerald-600' : 'text-secondary'}`}>
                  {readyNow ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              <button
                onClick={onOpenProfile}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 text-on-primary hover:opacity-90 active:scale-95 transition-all shadow-sm"
                title="Mở tài khoản"
                aria-label="Mở trang tài khoản"
              >
                <span className="material-symbols-outlined text-[21px]">account_circle</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col relative w-full pt-20 px-gutter gap-space-md mt-2">
        {(live.error || liveError) && (
          <ServerMessage variant="error">{live.error || liveError}</ServerMessage>
        )}
        {live.jobs.length > 0 && (
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
                  {PARTNER_ORDER_STATUS_LABEL[j.orderStatus] ?? j.orderStatus}
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
                {formatVND(live.stats?.earnedToday ?? 0)}
              </span>
              <span className="font-body-sm text-[12px] text-secondary flex items-center gap-1 mt-0.5 font-medium">
                <span className="font-label-md text-label-md text-on-surface font-bold">{live.stats?.completedToday ?? 0}</span> cuốc hoàn tất
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
                  {live.stats?.completedTotal ?? 0}
                </span>
                <span className="font-body-sm text-[12px] text-secondary">Tổng cuốc</span>
              </div>
              <div className="text-right">
                <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface flex items-center justify-end gap-0.5 font-extrabold">
                  {live.stats?.averageRating != null ? live.stats.averageRating.toFixed(1) : '—'}
                  <span
                    className="material-symbols-outlined text-[18px] text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                </span>
                <span className="font-body-sm text-[12px] text-secondary">{`${live.stats?.reviewCount ?? 0} đánh giá`}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Flash Card: Cuốc Cứu Hộ Khẩn Cấp Mới (Incoming Job Radar) */}
        {offer ? (
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
                      Mã: {offer.orderCode}
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-on-surface mt-0.5 leading-snug font-bold">
                    {offer.serviceName}
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
                  {`${formatVND(offer.callOutFee)} + công`}
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
                      {`Vòng phát ${offer.roundNo}`}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-secondary"></span>
                    <span className="font-label-md text-label-md text-tertiary font-bold">
                      trong bán kính của bạn
                    </span>
                  </div>
                </div>
              </div>

              {/* Địa chỉ chi tiết */}
              <div className="flex items-start gap-space-sm pt-1">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">location_on</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-label-md text-label-md text-on-surface font-bold block">
                    {offer.addressText}
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
                    Ghi chú của khách
                  </span>
                  <div className="mt-1 bg-surface-container-high/60 p-2.5 rounded-lg flex items-start gap-1.5 border border-surface-container">
                    <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">
                      chat
                    </span>
                    <p className="font-body-sm text-[12.5px] text-on-surface italic leading-snug">
                      "{offer.note || 'Không có ghi chú'}"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ảnh hiện trường khách gửi (BR05) */}
            {offer.photoUrls && offer.photoUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {offer.photoUrls.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noreferrer" className="shrink-0">
                    <img src={u} alt="Ảnh hiện trường" className="w-20 h-20 rounded-lg object-cover border border-surface-container" />
                  </a>
                ))}
              </div>
            )}

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
              {readyNow ? 'Đang chờ đơn mới…' : 'Bạn đang tạm nghỉ'}
            </h3>
            <p className="font-body-sm text-[12.5px] text-secondary">
              {readyNow
                ? 'Khi khách gần bạn đặt cứu hộ, đơn sẽ hiện ở đây (tự làm mới mỗi 3 giây).'
                : 'Bật "Sẵn sàng" ở góc trên để nhận đơn.'}
            </p>
          </div>
        )}

      </main>

      <MechanicBottomNav
        activeTab="rescue"
        onRescue={() => undefined}
        onIncome={onOpenIncome}
        onReviews={onOpenReviews}
        onProfile={onOpenProfile}
      />
    </div>
  );
};
