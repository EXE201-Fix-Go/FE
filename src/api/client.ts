// API client dùng chung — điểm cắm backend trong tương lai (FRONTEND spec §6, §9).
// Xác thực bằng JWT tự quản (CLAUDE.md C-06): access token GIỮ TRONG BỘ NHỚ (không localStorage),
// chỉ refresh token mới lưu bền (expo-secure-store ở app RN). KHÔNG lưu mật khẩu.

const BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

let accessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};
export const getAccessToken = (): string | null => accessToken;

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
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

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    // TODO(backend): thử refresh token; nếu vẫn 401 thì đăng xuất.
    onUnauthorized?.();
    throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.');
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => undefined);
    throw new ApiError(res.status, `Yêu cầu thất bại (${res.status}).`, errBody);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
