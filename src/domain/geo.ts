// Định vị người dùng — bọc navigator.geolocation. Toạ độ thật cho tạo đơn & presence thợ.

export interface Coords {
  lat: number;
  lng: number;
  /** Sai số ước lượng (mét) do trình duyệt cung cấp. */
  accuracy: number;
}

/** Vị trí mẫu (Làng ĐH Thủ Đức) — dùng khi khách từ chối quyền hoặc máy không hỗ trợ định vị. */
export const PILOT_FALLBACK: Coords = { lat: 10.87, lng: 106.803, accuracy: 0 };

export type GeoErrorKind = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export class GeoError extends Error {
  constructor(public kind: GeoErrorKind, message: string) {
    super(message);
    this.name = 'GeoError';
  }
}

/**
 * Lấy vị trí hiện tại với độ chính xác cao. Reject bằng {@link GeoError} để tầng trên phân biệt
 * "bị từ chối" với "hết giờ/không khả dụng" và fallback phù hợp.
 */
export function getCurrentPosition(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new GeoError('unsupported', 'Trình duyệt không hỗ trợ định vị.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => {
        const kind: GeoErrorKind =
          err.code === err.PERMISSION_DENIED
            ? 'denied'
            : err.code === err.TIMEOUT
              ? 'timeout'
              : 'unavailable';
        reject(new GeoError(kind, err.message || 'Không lấy được vị trí.'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

interface NominatimAddress {
  house_number?: string;
  road?: string;
  quarter?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  town?: string;
  city?: string;
  county?: string;
  state?: string;
}

/** Ghép địa chỉ ngắn gọn kiểu VN từ các thành phần Nominatim. */
function formatAddress(a: NominatimAddress, fallback: string): string {
  const street = [a.house_number, a.road].filter(Boolean).join(' ');
  const ward = a.quarter || a.suburb || a.neighbourhood || a.city_district;
  const city = a.city || a.town || a.county || a.state;
  const parts = [street, ward, city].filter((p): p is string => !!p && p.trim().length > 0);
  return parts.length > 0 ? parts.join(', ') : fallback;
}

/**
 * Đổi toạ độ thành tên địa chỉ (reverse geocode) qua OpenStreetMap Nominatim.
 * Trả về null nếu lỗi/không có mạng để caller giữ nguyên địa chỉ cũ.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}` +
      `&zoom=18&addressdetails=1&accept-language=vi`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string; address?: NominatimAddress };
    if (data.address) return formatAddress(data.address, data.display_name ?? '');
    return data.display_name ?? null;
  } catch {
    return null;
  }
}
