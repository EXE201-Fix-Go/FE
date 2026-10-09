// Tải bộ ba giấy tờ KYC (mặt trước CCCD, mặt sau, chân dung) lên kho riêng tư của backend.
import { uploadKycDocument } from '../api/uploads';

export type DocKey = 'front' | 'back' | 'selfie';
export const DOC_ORDER: DocKey[] = ['front', 'back', 'selfie'];
export const DOC_TYPE: Record<DocKey, 'ID_FRONT' | 'ID_BACK' | 'SELFIE'> = { front: 'ID_FRONT', back: 'ID_BACK', selfie: 'SELFIE' };
export const DOC_NAME: Record<DocKey, string> = { front: 'mặt trước CCCD', back: 'mặt sau CCCD', selfie: 'ảnh chân dung' };

/** Khóa đã tải xong theo từng ảnh: gửi lại sau lỗi mạng không phải tải lại ảnh đã lên. */
export type UploadedCache = Partial<Record<DocKey, { file: File; key: string }>>;

export class DocUploadError extends Error {
  constructor(public doc: DocKey, public cause: unknown) {
    super(`Không tải được ${DOC_NAME[doc]}. Kiểm tra mạng rồi thử lại.`);
    this.name = 'DocUploadError';
  }
}

/**
 * Tải lần lượt 3 ảnh (ảnh nào đã có trong `cache` với đúng file đó thì bỏ qua) và trả về mảng `documents`
 * cho POST /partner-registration hoặc PUT /partner/me/documents. Ném DocUploadError chỉ rõ ảnh nào hỏng.
 */
export async function uploadKycSet(
  picked: Record<DocKey, File>,
  cache: UploadedCache,
  onProgress?: (done: number) => void
): Promise<{ documentType: 'ID_FRONT' | 'ID_BACK' | 'SELFIE'; storageKey: string }[]> {
  const documents: { documentType: 'ID_FRONT' | 'ID_BACK' | 'SELFIE'; storageKey: string }[] = [];
  let done = 0;
  onProgress?.(0);
  for (const k of DOC_ORDER) {
    const file = picked[k];
    let key = cache[k]?.file === file ? cache[k]!.key : undefined;
    if (!key) {
      try {
        key = await uploadKycDocument(file);
      } catch (e) {
        throw new DocUploadError(k, e);
      }
      cache[k] = { file, key };
    }
    documents.push({ documentType: DOC_TYPE[k], storageKey: key });
    onProgress?.(++done);
  }
  return documents;
}
