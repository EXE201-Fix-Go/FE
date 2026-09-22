import React, { FormEvent, useState } from 'react';
import { ASSETS } from '../data';
import { EntryDestination } from '../types';
import { ServerMessage } from './ServerMessage';

interface AuthPhoneScreenProps {
  /** Gửi OTP; ném lỗi nếu số bị giới hạn hoặc backend chưa sẵn sàng. */
  onSubmit: (phone: string) => Promise<void> | void;
  dest?: EntryDestination;
  /** Đổi nhóm đối tác ngay trên màn hình nhập số điện thoại. */
  onDestChange?: (dest: EntryDestination) => void;
}

function authPath(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path}` || '/';
}

/**
 * Entry screen shared by the customer and partner URLs.
 * The visual context changes by role, but the only credential requested is a phone number.
 */
export const AuthPhoneScreen: React.FC<AuthPhoneScreenProps> = ({
  onSubmit,
  dest = 'customer',
  onDestChange,
}) => {
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPartner = dest !== 'customer';
  const isPartnerLogin = dest === 'mechanic' || dest === 'shop' || dest === 'staff';
  const isShopLogin = dest === 'shop' || dest === 'staff';
  const isValid = phone.length >= 9 && phone.length <= 11;

  const title = isPartner ? 'Đăng nhập đối tác' : 'Đăng nhập khách hàng';
  const subtitle = isPartner
    ? isShopLogin
      ? 'Quản lý tiệm hoặc nhận đơn được giao trên Fix&Go.'
      : 'Nhận đơn cứu hộ và quản lý công việc của bạn trên Fix&Go.'
    : 'Gọi thợ cứu hộ gần bạn nhanh chóng khi xe gặp sự cố.';
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || sending) return;
    setSending(true);
    setError(null);
    try {
      await onSubmit(phone);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không gửi được mã OTP.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-on-surface">
      <main className="min-h-screen px-6 pb-8 flex flex-col items-center">
        <div className="w-full max-w-[420px] flex-1 flex flex-col">
          <section className="pt-safe mt-8 text-center">
            <div
              className="mx-auto mb-7 flex items-center justify-center"
            >
              <img src={ASSETS.logo} alt="Fix&Go" className="h-14 w-auto object-contain" />
            </div>
            <h1 className="mt-3 font-headline-xl text-on-surface">{title}</h1>
            <p className="mt-3 font-body-md text-on-surface-variant max-w-[340px] mx-auto">{subtitle}</p>
          </section>

          {isPartnerLogin && onDestChange && (
            <fieldset className="mt-8">
              <legend className="font-label-md text-on-surface">Bạn đăng nhập với tư cách</legend>
              <div
                className="mt-2 grid grid-cols-2 gap-1 rounded-2xl bg-surface-container-low p-1"
                role="radiogroup"
                aria-label="Loại đối tác"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={!isShopLogin}
                  onClick={() => onDestChange('mechanic')}
                  className={`min-h-[58px] rounded-xl px-3 py-2 flex items-center justify-center gap-2 text-center transition-all active:scale-[0.98] ${
                    !isShopLogin
                      ? 'bg-white text-tertiary shadow-sm ring-1 ring-tertiary/20'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[21px]">handyman</span>
                  <span className="font-label-md">Thợ cá nhân</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isShopLogin}
                  onClick={() => onDestChange('shop')}
                  className={`min-h-[58px] rounded-xl px-3 py-2 flex items-center justify-center gap-2 text-center transition-all active:scale-[0.98] ${
                    isShopLogin
                      ? 'bg-white text-tertiary shadow-sm ring-1 ring-tertiary/20'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[21px]">store</span>
                  <span className="font-label-md">Tiệm sửa xe</span>
                </button>
              </div>

              {isShopLogin && (
                <div className="mt-3 rounded-2xl border border-tertiary/20 bg-tertiary-container/10 p-3">
                  <p className="font-label-sm text-tertiary">Chọn loại tài khoản tiệm</p>
                  <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Vai trò trong tiệm">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={dest === 'shop'}
                      onClick={() => onDestChange('shop')}
                      className={`min-h-[66px] rounded-xl border px-3 py-2 text-left transition-all active:scale-[0.98] ${
                        dest === 'shop'
                          ? 'border-tertiary bg-white text-on-surface shadow-sm'
                          : 'border-transparent bg-white/60 text-on-surface-variant hover:border-tertiary/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] text-tertiary">store</span>
                      <span className="mt-1 block font-label-md">Chủ tiệm</span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={dest === 'staff'}
                      onClick={() => onDestChange('staff')}
                      className={`min-h-[66px] rounded-xl border px-3 py-2 text-left transition-all active:scale-[0.98] ${
                        dest === 'staff'
                          ? 'border-tertiary bg-white text-on-surface shadow-sm'
                          : 'border-transparent bg-white/60 text-on-surface-variant hover:border-tertiary/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px] text-tertiary">badge</span>
                      <span className="mt-1 block font-label-md">Thợ thuộc tiệm</span>
                    </button>
                  </div>
                </div>
              )}
            </fieldset>
          )}

          <form onSubmit={submit} className="mt-10 flex flex-col gap-4">
            <label htmlFor="phone" className="font-label-lg text-on-surface">
              Số điện thoại
            </label>
            <div
              className={`flex items-center h-[68px] rounded-2xl border-2 bg-white transition-colors focus-within:ring-4 ${
                isPartner
                  ? 'border-tertiary/35 focus-within:border-tertiary focus-within:ring-tertiary/10'
                  : 'border-primary/25 focus-within:border-primary focus-within:ring-primary/10'
              }`}
            >
              <span className="pl-5 pr-4 font-label-lg text-on-surface border-r border-outline-variant/50">+84</span>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                autoFocus
                maxLength={11}
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="090 123 4567"
                className="h-full min-w-0 flex-1 px-4 rounded-r-2xl bg-transparent outline-none font-body-lg text-on-surface placeholder:text-on-surface-variant/50"
                aria-describedby="phone-help"
              />
            </div>
            <p id="phone-help" className="font-body-sm text-on-surface-variant">
              Mã xác thực sẽ được gửi qua SMS hoặc Zalo.
            </p>

            {error && <ServerMessage variant="error">{error}</ServerMessage>}

            <button
              type="submit"
              disabled={!isValid || sending}
              className={`mt-2 h-[58px] rounded-2xl font-label-lg text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                isValid
                  ? isPartner
                    ? 'bg-tertiary hover:bg-tertiary-container active:scale-[0.99]'
                    : 'bg-primary hover:bg-primary-container active:scale-[0.99]'
                  : 'bg-outline-variant/60 text-on-surface-variant cursor-not-allowed shadow-none'
              }`}
            >
              {sending ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Đang gửi mã…</span>
                </>
              ) : (
                <>
                  <span>Tiếp tục</span>
                  <span className="material-symbols-outlined text-[21px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 rounded-2xl bg-surface-container-low p-4 flex items-start gap-3">
            <span className={`material-symbols-outlined text-[22px] ${isPartner ? 'text-tertiary' : 'text-primary'}`}>
              verified_user
            </span>
            <div>
              <p className="font-label-md text-on-surface">Đăng nhập nhanh và an toàn</p>
              <p className="mt-1 font-body-sm text-on-surface-variant">
                Không cần mật khẩu. Số điện thoại của bạn được dùng để bảo vệ tài khoản.
              </p>
            </div>
          </div>

          <div className="mt-auto pt-10 text-center font-body-sm text-on-surface-variant">
            {isPartner ? 'Bạn là khách hàng?' : 'Bạn là thợ hoặc đối tác?'}{' '}
            <a
              href={isPartner ? authPath('/') : authPath('/partner/login')}
              className={`font-label-md underline underline-offset-4 ${isPartner ? 'text-primary' : 'text-tertiary'}`}
            >
              {isPartner ? 'Đăng nhập khách hàng' : 'Đăng nhập đối tác'}
            </a>
          </div>

          <p className="mt-5 text-center font-body-sm text-on-surface-variant/70">
            Bằng cách tiếp tục, bạn đồng ý với điều khoản sử dụng của Fix&Go.
          </p>
        </div>
      </main>
    </div>
  );
};
