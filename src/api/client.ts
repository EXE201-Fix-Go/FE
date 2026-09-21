// API client dùng chung — điểm cắm backend (FRONTEND spec §6, §9).
// Xác thực bằng JWT tự quản (CLAUDE.md C-06): access token GIỮ TRONG BỘ NHỚ (không localStorage),
// chỉ refresh token mới lưu bền (expo-secure-store ở app RN). KHÔNG lưu mật khẩu.

const BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080/api/v1';

/**
 * Có backend để gọi hay không. Dev luôn có (localhost); bản build production (GitHub Pages) chỉ có khi
 * đặt VITE_API_BASE_URL lúc build — không có thì app chạy chế độ demo với dữ liệu mẫu.
 */
export const apiConfigured: boolean = import.meta.env.DEV || !!import.meta.env.VITE_API_BASE_URL;

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string | null, refresh: string | null): void => {
  accessToken = access;
  refreshToken = refresh;
};
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
  auth?: boolean; // mặc định true — tự gắn Bearer token
}

async function rawFetch(path: string, options: ApiOptions): Promise<Response> {
  const { body, auth = true, headers, ...rest } = options;
  return fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
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

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
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

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const apiBaseUrl = BASE_URL;
