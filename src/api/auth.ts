// Xác thực bằng OTP + JWT (CLAUDE.md C-06: không mật khẩu). Backend cắm vào đây sau.
import { api, setAccessToken } from './client';

export interface OtpRequestResult {
  otpId: string;
  expiresInSec: number;
}
export interface VerifyOtpResult {
  accessToken: string;
  refreshToken: string;
  role: 'CUSTOMER' | 'P_IND' | 'P_SHOP' | 'P_STAFF';
}

/** Gửi OTP tới số điện thoại. */
export const requestOtp = (phone: string) =>
  api<OtpRequestResult>('/auth/otp', { auth: false, method: 'POST', body: { phone } });

/** Xác minh OTP → nhận token + vai trò (ràng role ở backend). */
export async function verifyOtp(otpId: string, code: string): Promise<VerifyOtpResult> {
  const res = await api<VerifyOtpResult>('/auth/otp/verify', {
    auth: false,
    method: 'POST',
    body: { otpId, code },
  });
  setAccessToken(res.accessToken);
  return res;
}
