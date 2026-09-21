// Định dạng tiền VND — HÀM DUY NHẤT, cấm định dạng tay ở màn hình (FRONTEND spec §8).
// formatVND(220000) => "220.000 ₫"
export function formatVND(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value)) + ' ₫';
}
