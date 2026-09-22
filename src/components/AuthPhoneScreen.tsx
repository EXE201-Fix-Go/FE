import React, { useState } from 'react';
import { ASSETS } from '../data';
import { EntryDestination } from '../types';
import { ServerMessage } from './ServerMessage';

interface AuthPhoneScreenProps {
  /** Gửi OTP; ném lỗi (vd quá số lần) → hiện ngay dưới nút. */
  onSubmit: (phone: string) => Promise<void> | void;
  onBack?: () => void;
  dest?: EntryDestination;
}

const SIM_NUMBER = '0908123456';

const DEST_LABEL: Record<EntryDestination, string> = {
  customer: 'Khách hàng',
  mechanic: 'Thợ độc lập',
  shop: 'Chủ tiệm',
  staff: 'Nhân viên tiệm',
  register: 'Đăng ký đối tác',
};

/** Định dạng 0908 123 456 */
function formatPhone(raw: string): string {
  const c = raw.replace(/\D/g, '');
  if (c.length <= 4) return c;
  if (c.length <= 7) return `${c.slice(0, 4)} ${c.slice(4)}`;
  return `${c.slice(0, 4)} ${c.slice(4, 7)} ${c.slice(7, 10)}`;
}

/** Một phím trên bàn phím số */
const Key: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  sub?: string;
  ariaLabel?: string;
}> = ({ onClick, children, sub, ariaLabel }) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={onClick}
    className="h-16 rounded-2xl bg-surface-container-low hover:bg-surface-container active:bg-surface-container-high active:scale-95 transition-all flex flex-col items-center justify-center shadow-sm"
  >
    <span className="font-headline-md text-on-surface leading-none">{children}</span>
    {sub && (
      <span className="text-[10px] text-secondary tracking-widest leading-none mt-1">
        {sub}
      </span>
    )}
  </button>
);

/**
 * Màn 1 — Nhập số điện thoại (theo mock Stitch).
 * Bàn phím số tùy chỉnh: nút to, thao tác một tay, bối cảnh khẩn cấp.
 */
export const AuthPhoneScreen: React.FC<AuthPhoneScreenProps> = ({
  onSubmit,
  onBack,
  dest,
}) => {
  const [raw, setRaw] = useState('');

  const isValid = raw.length >= 9 && raw.length <= 11;
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (!isValid || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSubmit(raw);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không gửi được mã OTP.');
    } finally {
      setSending(false);
    }
  };

  const push = (d: string) => setRaw((p) => (p.length < 11 ? p + d : p));
  const backspace = () => setRaw((p) => p.slice(0, -1));
  const clear = () => setRaw('');
  const useSim = () => setRaw(SIM_NUMBER);

  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface">
      {/* App bar */}
      <header className="sticky top-0 z-20 bg-surface/90 backdrop-blur-xl pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-gutter flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-xs min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Quay lại chọn vai trò"
                className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[24px]">arrow_back</span>
              </button>
            )}
            {!onBack && (
              <img src={ASSETS.logo} alt="Fix&Go" className="h-8 w-auto object-contain" />
            )}
            <div className="flex flex-col leading-tight ml-1 min-w-0">
              <span className="font-label-sm uppercase tracking-wider text-primary">
                Fix&amp;Go
              </span>
              <h1 className="font-headline-md text-on-surface truncate">Đăng nhập</h1>
            </div>
          </div>
          <div className="flex items-center gap-space-xs flex-shrink-0">
            <a
              href="tel:19006868"
              aria-label="Gọi khẩn cấp SOS"
              className="w-11 h-11 rounded-full bg-error text-on-error flex items-center justify-center shadow-[0_4px_12px_rgba(186,26,26,0.3)] active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[22px]">e911_emergency</span>
            </a>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Nội dung */}
      <main className="flex-1 flex flex-col px-gutter pt-space-md pb-space-xl gap-space-md select-none">
        {/* 1. Hero card */}
        <section className="bg-surface-container-lowest rounded-2xl p-[15px] shadow-sm">
          <div className="flex items-center justify-between gap-space-sm mb-space-md">
            <div className="inline-flex items-center gap-space-xs bg-error-container text-on-error-container px-space-sm py-1 rounded-full">
              <span
                className="material-symbols-outlined text-[18px] text-error"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                emergency
              </span>
              <span className="font-label-sm tracking-wide">SOS 1 BƯỚC DUY NHẤT</span>
            </div>
            <div className="flex items-center gap-1.5 text-tertiary">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-tertiary-container animate-ping" />
              <span className="font-label-sm font-semibold">12 Thợ sẵn sàng</span>
            </div>
          </div>
          <h2 className="font-headline-lg-mobile text-on-surface mb-space-xs">
            Số điện thoại của bạn là gì?
          </h2>
          <p className="font-body-sm text-secondary">
            Mã xác thực OTP sẽ gửi qua{' '}
            <strong className="text-primary font-bold">SMS/Zalo</strong> để xác minh trước
            khi kết nối thợ cứu hộ gần nhất.
          </p>
          {dest && (
            <div className="mt-space-sm inline-flex items-center gap-1.5 bg-surface-container-high px-space-sm py-1 rounded-full self-start">
              <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
              <span className="text-[12px] font-bold text-on-surface">
                Vai trò: {DEST_LABEL[dest]}
              </span>
            </div>
          )}
        </section>

        {/* 2. SIM tự điền */}
        <div className="bg-surface-container-high rounded-2xl p-[15px] flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary flex-shrink-0">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                phonelink_ring
              </span>
            </div>
            <div className="min-w-0">
              <div className="font-label-sm text-on-secondary-container">SIM trên máy</div>
              <div className="font-label-md text-on-surface truncate">0908 ••• 456</div>
            </div>
          </div>
          <button
            type="button"
            onClick={useSim}
            className="bg-primary hover:bg-primary-container text-on-primary px-space-md py-2.5 rounded-xl font-label-md active:scale-95 transition-all flex items-center gap-1 flex-shrink-0 shadow-sm"
          >
            <span>Dùng số này</span>
            <span className="material-symbols-outlined text-[18px]">bolt</span>
          </button>
        </div>

        {/* 3. Ô hiển thị số */}
        <section className="bg-surface-container-lowest rounded-2xl p-[15px] shadow-sm">
          <label className="font-label-sm text-secondary block uppercase tracking-wider mb-space-sm">
            Số điện thoại nhận cuộc gọi cứu hộ
          </label>
          <div className="flex items-center bg-surface-container-low rounded-xl px-space-sm py-2.5 min-h-[64px] gap-space-sm">
            <div className="flex items-center gap-1 bg-surface-container-lowest px-space-sm py-2 rounded-lg flex-shrink-0 shadow-sm">
              <span className="text-[20px] leading-none">🇻🇳</span>
              <span className="font-label-md text-on-surface font-bold">+84</span>
            </div>
            <div className="flex-1 flex items-center overflow-hidden px-1">
              {raw ? (
                <span className="font-data-metric-lg text-on-surface tracking-wider truncate">
                  {formatPhone(raw)}
                </span>
              ) : (
                <span className="font-data-metric-lg text-on-surface/25 tracking-wider">
                  0--- --- ---
                </span>
              )}
              <span className="w-0.5 h-7 bg-primary ml-1 animate-pulse" />
            </div>
            <button
              type="button"
              aria-label="Xóa tất cả số"
              onClick={clear}
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface active:scale-95 transition-all flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </section>

        {/* 4. Bàn phím số */}
        <section className="bg-surface-container-lowest rounded-2xl p-[15px] shadow-sm">
          <div className="grid grid-cols-3 gap-space-sm">
            <Key onClick={() => push('1')} sub="SOS">1</Key>
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
              aria-label="Định vị"
              onClick={() => {}}
              className="h-16 rounded-2xl bg-surface-container-low hover:bg-surface-container active:scale-95 transition-all flex items-center justify-center text-primary shadow-sm"
            >
              <span className="material-symbols-outlined text-[24px]">my_location</span>
            </button>
            <Key onClick={() => push('0')} sub="+">0</Key>
            <button
              type="button"
              aria-label="Xóa ký tự vừa nhập"
              onClick={backspace}
              className="h-16 rounded-2xl bg-surface-container-low hover:bg-surface-container active:scale-95 transition-all flex items-center justify-center text-on-surface shadow-sm"
            >
              <span className="material-symbols-outlined text-[24px]">backspace</span>
            </button>
          </div>
        </section>

        {/* 5. CTA + dòng tin cậy */}
        <div className="flex flex-col gap-space-sm pt-space-xs">
          {error && (
            <ServerMessage variant="error">{error}</ServerMessage>
          )}
          <button
            type="button"
            disabled={!isValid || sending}
            onClick={submit}
            className={`w-full min-h-[58px] rounded-2xl font-label-lg uppercase tracking-wider flex items-center justify-between px-space-md shadow-md transition-all ${
              isValid
                ? 'bg-primary hover:bg-primary-container text-on-primary active:translate-y-0.5'
                : 'bg-surface-container-highest text-on-surface-variant/50 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[24px]">sms</span>
              <span>Tiếp tục • Gửi mã OTP</span>
            </span>
            <span className="material-symbols-outlined text-[22px]">arrow_forward</span>
          </button>
          <div className="flex items-center justify-center gap-space-xs text-center px-space-sm">
            <span
              className="material-symbols-outlined text-[16px] text-tertiary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              verified_user
            </span>
            <p className="font-body-sm text-secondary">
              Xác thực tức thì • Bảo mật thông tin • Báo giá minh bạch trước khi sửa
            </p>
          </div>
        </div>

        {/* 6. Tổng đài */}
        <footer className="bg-surface-container-low rounded-2xl p-[15px] flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-10 h-10 rounded-full bg-error text-on-error flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">support_agent</span>
            </div>
            <div className="min-w-0">
              <div className="font-label-sm text-on-surface font-semibold">
                Cần hỗ trợ trực tiếp từ tổng đài?
              </div>
              <div className="font-body-sm text-[12px] text-secondary">
                Hỗ trợ khẩn cấp 24/7 toàn quốc
              </div>
            </div>
          </div>
          <a
            href="tel:19006868"
            className="bg-surface-container-lowest text-error px-space-sm py-2 rounded-xl font-label-md font-bold shadow-sm hover:bg-error-container flex items-center gap-1 flex-shrink-0 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">call</span>
            <span>1900 6868</span>
          </a>
        </footer>
      </main>
    </div>
  );
};
