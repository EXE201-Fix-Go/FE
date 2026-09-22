# Fix&Go — Frontend (prototype)

Prototype giao diện & luồng cho dự án **Fix&Go** — nền tảng cứu hộ và sửa xe máy tại chỗ (EXE201).

> Bản prototype này dựng bằng **React + Vite** để trình diễn UI/UX và luồng nghiệp vụ.
> App chính thức theo BRD là **React Native + Expo**; cấu trúc component/domain/api ở đây tách sẵn để port.

## Công nghệ
- React 19 + TypeScript, Vite
- Tailwind CSS v4 (theme Material 3), font Be Vietnam Pro, Material Symbols

## Chạy local
```bash
npm install --legacy-peer-deps
npm run dev
```
Mở `http://localhost:3000` (hoặc cổng Vite báo). Xem đúng dạng mobile: Chrome DevTools → device toolbar (Ctrl+Shift+M) → iPhone.

## Luồng chính
Khách hàng và đối tác có URL đăng nhập riêng:

- `http://localhost:3000/` hoặc `http://localhost:3000/customer/login` — khách hàng.
- `http://localhost:3000/partner/login` — thợ/đối tác.

Mỗi URL mở thẳng màn nhập số điện thoại, sau đó tới màn OTP và vào đúng app theo role thật do backend trả về:
- **Khách hàng**: chọn dịch vụ → xác nhận (chọn thêm dịch vụ + ảnh hiện trường) → tìm thợ → theo dõi → duyệt báo giá → hóa đơn & đánh giá.
- **Thợ độc lập**: nhận đơn → dẫn đường → lập báo giá.
- **Tiệm sửa xe**: **Chủ tiệm** (quản lý & thêm thợ) hoặc **Nhân viên**.
- **Đăng ký đối tác**: xác minh danh tính (KYC).

Trang gốc `/` mặc định là đăng nhập khách hàng; không còn màn hình chọn vai trò. API OTP/JWT vẫn dùng chung; URL chỉ tách phần giao diện và entry point.

> Deep-link cho dev/QA: `?screen=<id>` nhảy thẳng tới một màn (bỏ qua đăng nhập).

## Cấu trúc
```
src/
  components/   # các màn hình & UI
  domain/       # status.ts (14 trạng thái đơn), money.ts (formatVND)
  api/          # client.ts, auth.ts, orders.ts — điểm cắm backend (Spring Boot)
  data.ts       # dữ liệu mẫu (bảng giá dịch vụ)
  types.ts
```

## Kết nối backend
Đặt `VITE_API_BASE_URL` trong `.env` (xem `.env.example`). Xác thực bằng **OTP + JWT** (không lưu mật khẩu).
