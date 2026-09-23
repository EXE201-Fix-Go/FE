// Xác thực bằng OTP + JWT (CLAUDE.md C-06: không mật khẩu). Khớp BE docs/api.md.
import { api, setTokens } from './client';

export type AppRole = 'CUSTOMER' | 'P_IND' | 'P_SHOP' | 'P_STAFF' | 'ADMIN';

export interface OtpRequestResult {
  otpId: string;
  expiresInSec: number;
  /** Chỉ có khi backend chạy OTP_DEV_ECHO=true (chưa có SMS). */
  devCode?: string | null;
}
export interface AuthUser {
  id: string;
  fullName: string | null;
  phone: string | null;
  role: 'CUSTOMER' | 'PARTNER' | 'ADMIN';
  appRole: AppRole;
  status: 'ACTIVE' | 'LOCKED';
}
export interface VerifyOtpResult {
  accessToken: string;
  refreshToken: string;
  role: AppRole;
  user: AuthUser;
}

/** Gửi OTP tới số điện thoại. */
export const requestOtp = (phone: string) =>
  api<OtpRequestResult>('/auth/otp', { auth: false, method: 'POST', body: { phone } });

/** Xác minh OTP → nhận token + role (ràng role ở backend). */
export async function verifyOtp(otpId: string, code: string): Promise<VerifyOtpResult> {
  const res = await api<VerifyOtpResult>('/auth/otp/verify', {
    auth: false,
    method: 'POST',
    body: { otpId, code, platform: 'WEB', deviceFingerprint: 'web-' + navigator.userAgent.slice(0, 40) },
  });
  setTokens(res.accessToken, res.refreshToken);
  return res;
}

export const me = () => api<AuthUser>('/users/me');

export async function logout(): Promise<void> {
  try {
    await api<void>('/auth/logout', { method: 'POST' });
  } finally {
    setTokens(null, null);
  }
}
