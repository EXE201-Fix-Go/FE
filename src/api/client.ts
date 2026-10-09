// API client dùng chung — điểm cắm backend (FRONTEND spec §6, §9).
// Xác thực bằng JWT tự quản (CLAUDE.md C-06): access token GIỮ TRONG BỘ NHỚ (không localStorage),
// chỉ refresh token mới lưu bền (expo-secure-store ở app RN). KHÔNG lưu mật khẩu.

/**
 * Địa chỉ backend. Nếu cấu hình trỏ 'localhost' nhưng trang lại mở qua IP/host khác
 * (test trên điện thoại cùng mạng LAN), tự đổi host của API theo host của trang —
 * vì 'localhost' trên điện thoại là chính điện thoại, không phải máy chạy backend.
 */
function resolveBaseUrl(): string {
  // `||` chứ không phải `??`: biến repo chưa đặt được CI truyền xuống dưới dạng chuỗi rỗng.
  const configured =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'https://fixgo-be-cmlq.onrender.com/api/v1';
  try {
    if (typeof window === 'undefined') return configured;
    const url = new URL(configured, window.location.origin);
    const pageHost = window.location.hostname;
    const apiIsLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const pageIsLocal = pageHost === 'localhost' || pageHost === '127.0.0.1';
    if (apiIsLocal && !pageIsLocal && pageHost) {
      url.hostname = pageHost;
      return url.toString().replace(/\/$/, '');
    }
    return configured;
  } catch {
    return configured;
  }
}

const BASE_URL: string = resolveBaseUrl();

// Ghi nhớ đăng nhập: refresh token lưu bền ở localStorage để mở lại app vẫn còn phiên.
// Access token vẫn CHỈ ở RAM (C-06). (Rủi ro XSS của localStorage: chấp nhận cho pilot web.)
const RT_KEY = 'fixgo.rt';
function loadStoredRefresh(): string | null {
  try {
    return localStorage.getItem(RT_KEY);
  } catch {
    return null;
  }
}

let accessToken: string | null = null;
let refreshToken: string | null = loadStoredRefresh();

export const setTokens = (access: string | null, refresh: string | null): void => {
  accessToken = access;
  refreshToken = refresh;
  try {
    if (refresh) localStorage.setItem(RT_KEY, refresh);
    else localStorage.removeItem(RT_KEY);
  } catch {
    /* trình duyệt riêng tư / chặn storage — bỏ qua, chỉ mất tính năng ghi nhớ */
  }
};

/** Có refresh token đã lưu để thử khôi phục phiên khi mở app không. */
export const hasStoredSession = (): boolean => !!refreshToken;
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};
export const getAccessToken = (): string | null => accessToken;
export const getRefreshToken = (): string | null => refreshToken;

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string, public body?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Callback khi hết phiên (401 và không refresh được) — App gắn để đẩy về màn đăng nhập. */
let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (fn: () => void): void => {
  onUnauthorized = fn;
};

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Tải file (multipart). Không đặt Content-Type để trình duyệt tự thêm boundary. */
  form?: FormData;
  auth?: boolean; // mặc định true — tự gắn Bearer token
}

async function rawFetch(path: string, options: ApiOptions): Promise<Response> {
  const { body, form, auth = true, headers, ...rest } = options;
  return fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(form ? {} : { 'Content-Type': 'application/json' }),
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
}

let refreshing: Promise<boolean> | null = null;
/** Xoay refresh token một lần cho mọi request đang chờ (docs/api.md: token dùng lại → thu hồi thiết bị). */
async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  refreshing ??= (async () => {
    try {
      const res = await rawFetch('/auth/refresh', { method: 'POST', auth: false, body: { refreshToken } });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** Gọi API, tự xoay refresh token khi 401 và ném ApiError khi lỗi. Trả về Response thành công để caller đọc theo kiểu mình cần. */
async function authedFetch(path: string, options: ApiOptions): Promise<Response> {
  let res: Response;
  try {
    res = await rawFetch(path, options);
  } catch {
    throw new ApiError(0, 'Không kết nối được máy chủ. Backend đã chạy ở ' + BASE_URL + ' chưa?', 'NETWORK');
  }

  if (res.status === 401 && options.auth !== false) {
    if (await tryRefresh()) {
      res = await rawFetch(path, options);
    }
    if (res.status === 401) {
      setTokens(null, null);
      onUnauthorized?.();
      throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.', 'UNAUTHORIZED');
    }
  }

  if (!res.ok) {
    const errBody = (await res.json().catch(() => undefined)) as
      | { code?: string; message?: string; fieldErrors?: Record<string, string> }
      | undefined;
    const detail = errBody?.fieldErrors ? ' ' + Object.values(errBody.fieldErrors).join('; ') : '';
    throw new ApiError(res.status, (errBody?.message ?? `Yêu cầu thất bại (${res.status}).`) + detail, errBody?.code, errBody);
  }
  return res;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const res = await authedFetch(path, options);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Tải một file nhị phân (ảnh) cần đăng nhập — vd. giấy tờ KYC cho admin. */
export async function apiBlob(path: string, options: ApiOptions = {}): Promise<Blob> {
  const res = await authedFetch(path, { ...options, headers: { Accept: 'image/*', ...options.headers } });
  return res.blob();
}

export const apiBaseUrl = BASE_URL;
