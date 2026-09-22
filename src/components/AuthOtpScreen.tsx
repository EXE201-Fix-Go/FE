import React, { useEffect, useState } from 'react';
import { ASSETS } from '../data';
import { ServerMessage } from './ServerMessage';

interface AuthOtpScreenProps {
  phone: string;
  onBack: () => void;
  /** Gọi backend xác minh mã; ném lỗi nếu sai/hết hạn → màn tự báo và cho nhập lại. */
  onVerify: (code: string) => Promise<void>;
  /** Mã OTP do backend trả khi chạy dev (OTP_DEV_ECHO) — chưa có SMS. */
  devCode?: string | null;
  onResend?: () => Promise<void>;
}

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

function formatPhone(raw: string): string {
  const c = raw.replace(/\D/g, '');
  if (c.length <= 4) return c;
  if (c.length <= 7) return `${c.slice(0, 4)} ${c.slice(4)}`;
  return `${c.slice(0, 4)} ${c.slice(4, 7)} ${c.slice(7, 10)}`;
}

/** Một phím bàn phím số */
const Key: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  sub?: string;
  variant?: 'num' | 'util';
  ariaLabel?: string;
}> = ({ onClick, children, sub, variant = 'num', ariaLabel }) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={onClick}
    className={`h-16 rounded-2xl flex flex-col items-center justify-center active:scale-95 transition-all ${
      variant === 'num'
        ? 'bg-surface-container-lowest hover:bg-surface-container text-on-surface shadow-sm'
        : 'bg-surface-container-high hover:bg-surface-container text-on-surface'
    }`}
  >
    <span className="font-data-metric-md leading-none">{children}</span>
    {sub && (
      <span className="text-[10px] text-secondary tracking-widest leading-none mt-1">
        {sub}
      </span>
    )}
  </button>
);

/**
 * Màn 2 — Nhập OTP (theo mock Stitch).
 * Ô mã dạng deck 6 ô + bàn phím số tùy chỉnh. Tự xác minh khi đủ 6 số.
 */
export const AuthOtpScreen: React.FC<AuthOtpScreenProps> = ({
  phone,
  onBack,
  onVerify,
  devCode,
  onResend,
}) => {
  const [pin, setPin] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isComplete = pin.length === OTP_LENGTH;

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Tự xác minh khi đủ 6 số — gọi backend thật
  useEffect(() => {
    if (!isComplete || verifying) return;
    let cancelled = false;
    setVerifying(true);
    setError(null);
    onVerify(pin.join(''))
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Mã không đúng hoặc đã hết hạn.');
        setPin([]);
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const push = (d: string) => setPin((p) => (p.length < OTP_LENGTH ? [...p, d] : p));
  const backspace = () => setPin((p) => p.slice(0, -1));
  const clear = () => setPin([]);
  const resend = () => {
    if (countdown > 0) return;
    setPin([]);
    setError(null);
    setCountdown(RESEND_SECONDS);
    onResend?.().catch((e: unknown) => setError(e instanceof Error ? e.message : 'Không gửi lại được mã.'));
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface">
      {/* App bar */}
      <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-gutter flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <button
              type="button"
              aria-label="Quay lại"
              onClick={onBack}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <img src={ASSETS.logo} alt="Fix&Go" className="h-8 w-auto object-contain" />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-label-sm uppercase tracking-wider text-primary">
                Fix&amp;Go
              </span>
              <h1 className="font-headline-md text-on-surface truncate">Xác thực OTP</h1>
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </div>
        </div>
      </header>

      {/* Nội dung */}
      <main className="flex-1 flex flex-col px-gutter pt-space-md pb-space-xl gap-space-lg select-none">
        {/* Badge + tiêu đề */}
        <div>
          <div className="flex items-center gap-space-xs mb-space-sm">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-fixed text-on-primary-fixed">
              <span className="material-symbols-outlined text-[16px]">lock_reset</span>
            </span>
            <span className="font-label-sm uppercase tracking-wider text-primary">
              Bảo mật tức thì
            </span>
          </div>
          <h2 className="font-headline-lg-mobile text-on-surface mb-space-xs">
            Nhập mã xác thực
          </h2>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
            <span className="font-body-md text-on-surface-variant">Mã 6 số gửi đến</span>
            <span className="font-label-lg text-on-surface bg-surface-container-high px-2 py-0.5 rounded-lg">
              {formatPhone(phone) || phone}
            </span>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-0.5 text-primary hover:text-primary-container font-label-md transition-colors"
            >
              <span>Đổi số</span>
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          </div>
        </div>

        {/* Deck ô mã + gửi lại */}
        <section className="bg-surface-container-lowest rounded-2xl p-[15px] shadow-sm flex flex-col items-center gap-space-md">
          <div className="flex items-center justify-between w-full max-w-[320px] gap-2">
            {Array.from({ length: OTP_LENGTH }).map((_, idx) => {
              const filled = idx < pin.length;
              const active = idx === pin.length && !verifying;
              return (
                <div
                  key={idx}
                  className={`flex-1 h-16 rounded-xl flex items-center justify-center shadow-sm transition-all ${
                    active ? 'bg-primary-fixed' : 'bg-surface-container-low'
                  }`}
                >
                  {filled ? (
                    <span className="font-data-metric-md text-on-surface">{pin[idx]}</span>
                  ) : active ? (
                    <div className="w-0.5 h-6 bg-primary animate-pulse rounded-full" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-outline-variant" />
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <ServerMessage variant="error" className="w-full">{error}</ServerMessage>
          )}
          {devCode && (
            <button
              type="button"
              onClick={() => setPin(devCode.split(''))}
              className="w-full rounded-xl bg-tertiary-container text-on-tertiary-container font-body-sm px-space-sm py-2 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">bug_report</span>
              <span>
                Mã OTP (dev, chưa có SMS): <strong className="font-label-lg tracking-widest">{devCode}</strong> — bấm để điền
              </span>
            </button>
          )}

          <div className="flex flex-col items-center gap-space-sm w-full">
            <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm">
              <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
              {countdown > 0 ? (
                <span>
                  Gửi lại mã sau{' '}
                  <strong className="font-label-md text-primary">{countdown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={resend}
                  className="font-label-md text-primary underline"
                >
                  Gửi lại mã ngay
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 font-label-sm text-secondary hover:text-on-surface transition-colors py-1.5 px-space-sm rounded-lg bg-surface-container"
              >
                <span className="material-symbols-outlined text-[16px]">support_agent</span>
                <span>Gọi đọc mã Zalo</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 font-label-sm text-secondary hover:text-on-surface transition-colors py-1.5 px-space-sm rounded-lg bg-surface-container"
              >
                <span className="material-symbols-outlined text-[16px]">sms</span>
                <span>SMS khẩn cấp</span>
              </button>
            </div>
          </div>
        </section>

        {/* CTA xác nhận */}
        <button
          type="button"
          disabled={!isComplete || verifying}
          onClick={() => {}}
          className={`w-full min-h-[58px] rounded-2xl font-label-lg uppercase tracking-wider flex items-center justify-center gap-space-sm shadow-md transition-all ${
            isComplete
              ? 'bg-primary-container hover:bg-primary text-on-primary active:translate-y-0.5'
              : 'bg-surface-container-highest text-on-surface-variant/50 cursor-not-allowed'
          }`}
        >
          {verifying ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Đang xác minh…</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[24px]">bolt</span>
              <span>Xác nhận &amp; Tìm thợ cứu hộ</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </>
          )}
        </button>

        {/* Bàn phím số */}
        <section className="bg-surface-container-low rounded-2xl p-[15px] shadow-sm grid grid-cols-3 gap-space-sm">
          <Key onClick={() => push('1')}>1</Key>
          <Key onClick={() => push('2')} sub="ABC">2</Key>
          <Key onClick={() => push('3')} sub="DEF">3</Key>
          <Key onClick={() => push('4')} sub="GHI">4</Key>
          <Key onClick={() => push('5')} sub="JKL">5</Key>
          <Key onClick={() => push('6')} sub="MNO">6</Key>
          <Key onClick={() => push('7')} sub="PQRS">7</Key>
          <Key onClick={() => push('8')} sub="TUV">8</Key>
          <Key onClick={() => push('9')} sub="WXYZ">9</Key>
          <button
            type="button"
            aria-label="Xóa hết"
            onClick={clear}
            className="h-16 rounded-2xl bg-surface-container-high hover:bg-surface-container text-secondary flex items-center justify-center active:scale-95 transition-all font-label-sm uppercase"
          >
            C
          </button>
          <Key onClick={() => push('0')}>0</Key>
          <button
            type="button"
            aria-label="Xóa ký tự vừa nhập"
            onClick={backspace}
            className="h-16 rounded-2xl bg-surface-container-high hover:bg-surface-container text-on-surface flex items-center justify-center active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">backspace</span>
          </button>
        </section>

        {/* Tổng đài */}
        <div className="bg-surface-container rounded-2xl p-[15px] flex items-center justify-between gap-space-sm shadow-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-10 h-10 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">phone_in_talk</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm uppercase tracking-wider text-error">
                Hỗ trợ khẩn cấp 24/7
              </span>
              <span className="font-body-sm text-on-surface-variant truncate">
                Không nhận được mã xác nhận?
              </span>
            </div>
          </div>
          <a
            href="tel:19006868"
            className="inline-flex items-center gap-1 bg-surface-container-lowest text-primary font-label-md px-space-sm py-2 rounded-lg shadow-sm hover:bg-primary-fixed transition-colors shrink-0"
          >
            <span>1900 6868</span>
            <span className="material-symbols-outlined text-[16px]">call</span>
          </a>
        </div>

        {/* Dòng tin cậy */}
        <div className="flex items-center justify-center gap-space-xs text-secondary font-label-sm text-center">
          <span className="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
          <span>Hệ thống điều phối cứu hộ xe máy chuẩn đô thị Fix&amp;Go</span>
        </div>
      </main>
    </div>
  );
};
