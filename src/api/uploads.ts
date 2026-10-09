// Tải ảnh lên backend (docs/api.md "Ảnh và giấy tờ KYC"). Cả hai đều đi qua `api()` nên tự xoay refresh token khi 401.
import { api } from './client';
import { prepareImage } from '../domain/image';

function imageForm(file: File): FormData {
  const form = new FormData();
  form.append('file', file, file.name || 'photo.jpg');
  return form;
}

/** Ảnh hiện trường (BR05) → URL công khai để đưa vào `photoUrls` của đơn. */
export async function uploadPhoto(file: File): Promise<string> {
  const ready = await prepareImage(file);
  const res = await api<{ url: string }>('/uploads', { method: 'POST', form: imageForm(ready) });
  return res.url;
}

/**
 * Giấy tờ KYC → `storageKey` trong kho RIÊNG TƯ, gắn với người tải lên. Không có URL: chỉ admin xem được, qua backend.
 * Gửi khóa này trong `documents` của POST /partner-registration.
 */
export async function uploadKycDocument(file: File): Promise<string> {
  const ready = await prepareImage(file);
  const res = await api<{ storageKey: string }>('/uploads/kyc', { method: 'POST', form: imageForm(ready) });
  return res.storageKey;
}
