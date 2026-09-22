import React, { useEffect, useState } from 'react';
import { ASSETS } from '../data';
import { EntryDestination } from '../types';
import { ServerMessage } from './ServerMessage';

interface AuthOtpScreenProps {
  phone: string;
  dest?: EntryDestination;
  onBack: () => void;
  /** Gọi backend xác minh mã; ném lỗi nếu sai/hết hạn → màn tự báo và cho nhập lại. */
  onVerify: (code: string) => Promise<void>;
  /** Mã OTP do backend trả khi chạy OTP_DEV_ECHO — chỉ xuất hiện trong môi trường dev. */
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

export const AuthOtpScreen: React.FC<AuthOtpScreenProps> = ({
  phone,
  dest = 'customer',
  onBack,
  onVerify,
  devCode,
  onResend,
}) => {
  const [pin, setPin] = useState('');
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPartner = dest !== 'customer';
  const isComplete = pin.length === OTP_LENGTH;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const verifyCode = async () => {
    if (!isComplete || verifying) return;
    setVerifying(true);
    setError(null);
    try {
      await onVerify(pin);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Mã không đúng hoặc đã hết hạn.');
      setPin('');
    } finally {
      setVerifying(false);
    }
  };

  // Giữ trải nghiệm nhanh: nhập đủ 6 số là xác minh ngay.
  useEffect(() => {
    if (isComplete) void verifyCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const resend = async () => {
    if (countdown > 0 || !onResend) return;
    setPin('');
    setError(null);
    setCountdown(RESEND_SECONDS);
    try {
      await onResend();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không gửi lại được mã.');
    }
  };

  const heading = isPartner ? 'Xác minh tài khoản đối tác' : 'Xác minh tài khoản';
  const buttonLabel = isPartner ? 'Vào trang đối tác' : 'Vào Fix&Go';

  return (
    <div className="min-h-screen bg-white text-on-surface">
      <main className="min-h-screen px-6 pb-8 flex flex-col items-center">
        <div className="w-full max-w-[420px] flex-1 flex flex-col">
          <header className="pt-safe pt-6 flex items-center justify-between">
            <button
              type="button"
              aria-label="Đổi số điện thoại"
              onClick={onBack}
              className="w-11 h-11 -ml-2 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-low active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[25px]">arrow_back</span>
            </button>
            <div className="w-11" aria-hidden="true" />
          </header>

          <section className="mt-12 text-center">
            <div className="mx-auto mb-5 flex items-center justify-center">
              <img src={ASSETS.logo} alt="Fix&Go" className="h-14 w-auto object-contain" />
            </div>
            <h1 className="font-headline-xl text-on-surface">{heading}</h1>
            <p className="mt-3 font-body-md text-on-surface-variant max-w-[340px] mx-auto">
              Nhập mã 6 số đã gửi đến số điện thoại
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-2">
              <span className="font-label-lg text-on-surface">+84 {formatPhone(phone)}</span>
              <button
                type="button"
                onClick={onBack}
                className={`material-symbols-outlined text-[18px] ${isPartner ? 'text-tertiary' : 'text-primary'} hover:opacity-70`}
                aria-label="Sửa số điện thoại"
              >
                edit
              </button>
            </div>
          </section>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void verifyCode();
            }}
            className="mt-10 flex flex-col gap-4"
          >
            <label htmlFor="otp" className="font-label-lg text-on-surface">
              Mã xác thực
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={OTP_LENGTH}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
              placeholder="000000"
              className={`h-[68px] w-full rounded-2xl border-2 bg-white text-center font-data-metric-md tracking-[0.55em] pl-[0.55em] outline-none transition-colors placeholder:text-on-surface-variant/25 focus:ring-4 ${
                isPartner
                  ? 'border-tertiary/35 focus:border-tertiary focus:ring-tertiary/10'
                  : 'border-primary/25 focus:border-primary focus:ring-primary/10'
              }`}
              aria-describedby="otp-help"
            />
            <p id="otp-help" className="font-body-sm text-on-surface-variant">
              Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với người khác.
            </p>

            {error && <ServerMessage variant="error">{error}</ServerMessage>}

            {devCode && (
              <button
                type="button"
                onClick={() => setPin(devCode.slice(0, OTP_LENGTH))}
                className="rounded-xl bg-tertiary-container/15 text-tertiary px-4 py-3 text-left font-body-sm"
              >
                Mã dev (chưa có SMS): <strong className="font-label-lg tracking-widest">{devCode}</strong>
              </button>
            )}

            <button
              type="submit"
              disabled={!isComplete || verifying}
              className={`mt-2 h-[58px] rounded-2xl font-label-lg text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                isComplete
                  ? isPartner
                    ? 'bg-tertiary hover:bg-tertiary-container active:scale-[0.99]'
                    : 'bg-primary hover:bg-primary-container active:scale-[0.99]'
                  : 'bg-outline-variant/60 text-on-surface-variant cursor-not-allowed shadow-none'
              }`}
            >
              {verifying ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác minh…</span>
                </>
              ) : (
                <>
                  <span>{buttonLabel}</span>
                  <span className="material-symbols-outlined text-[21px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            {countdown > 0 ? (
              <p className="font-body-sm text-on-surface-variant">
                Gửi lại mã sau <strong className={`font-label-md ${isPartner ? 'text-tertiary' : 'text-primary'}`}>{countdown}s</strong>
              </p>
            ) : (
              <button
                type="button"
                onClick={resend}
                className={`font-label-md underline underline-offset-4 ${isPartner ? 'text-tertiary' : 'text-primary'}`}
              >
                Gửi lại mã
              </button>
            )}
            <button type="button" onClick={onBack} className="font-body-sm text-on-surface-variant underline underline-offset-4">
              Dùng số điện thoại khác
            </button>
          </div>

          <p className="mt-auto pt-10 text-center font-body-sm text-on-surface-variant/70">
            Nếu bạn không nhận được mã, vui lòng kiểm tra lại số điện thoại hoặc thử gửi lại.
          </p>
        </div>
      </main>
    </div>
  );
};
