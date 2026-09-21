// Ảnh hiện trường (BR05). Pilot: backend lưu đĩa và trả URL; production đổi sang Cloudinary mà API không đổi.
import { ApiError, apiBaseUrl, getAccessToken } from './client';

export async function uploadPhoto(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file, file.name || 'photo.jpg');
  const token = getAccessToken();
  const res = await fetch(`${apiBaseUrl}/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => undefined)) as { code?: string; message?: string } | undefined;
    throw new ApiError(res.status, body?.message ?? `Tải ảnh thất bại (${res.status}).`, body?.code, body);
  }
  return ((await res.json()) as { url: string }).url;
}
