// Ảnh chụp từ điện thoại thường 4–12 MB, vượt giới hạn 10 MB của backend và tải rất chậm trên 4G.
// Thu nhỏ về tối đa 1600 px cạnh dài, JPEG chất lượng 0.85: vẫn đọc rõ chữ trên CCCD mà chỉ còn ~300–600 KB.

const MAX_SIDE = 1600;
const QUALITY = 0.85;
const KEEP_AS_IS_BYTES = 1_200_000;

/**
 * Trả về file đã thu nhỏ, hoặc chính file gốc nếu không cần / không thu nhỏ được (HEIC, trình duyệt cũ…).
 * Backend nhận dạng ảnh theo nội dung nên file gốc vẫn hợp lệ.
 */
export async function prepareImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || typeof createImageBitmap !== 'function') return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.type === 'image/jpeg' && file.size <= KEEP_AS_IS_BYTES) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (!blob || (scale === 1 && blob.size >= file.size)) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
