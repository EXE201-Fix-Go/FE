// Vị trí của thợ: dùng để BE chọn thợ gần khách và tính phí di chuyển (RB-23).
// Bản triển khai dùng GPS thật. Khi test cả hai app trên MỘT máy, đặt VITE_PARTNER_GPS=off (đã đặt trong .env.development)
// để không ghi đè vị trí đã đăng ký của thợ bằng vị trí máy test.

export const PARTNER_GPS_ENABLED = (import.meta.env.VITE_PARTNER_GPS as string | undefined) !== 'off';

/** Gửi vị trí mỗi ~60 giây khi thợ đang trực: đủ mới cho DISPATCH_LOCATION_MAX_AGE phía BE (mặc định khuyến nghị 5 phút). */
export const LOCATION_PING_MS = 60_000;

export interface LatLng {
  lat: number;
  lng: number;
}

/** Vị trí GPS hiện tại, hoặc null khi bị tắt / bị từ chối quyền / quá thời gian. Không bao giờ ném lỗi. */
export function currentPosition(timeoutMs = 8000): Promise<LatLng | null> {
  if (!PARTNER_GPS_ENABLED || typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 }
    );
  });
}
