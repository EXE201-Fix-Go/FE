export const ASSETS = {
  logo: `${import.meta.env.BASE_URL}logo-transparent.png`,
};

/** Số hotline hỗ trợ thật, cấu hình lúc build (VITE_SUPPORT_PHONE). Không đặt → ẩn nút gọi hỗ trợ. */
export const SUPPORT_PHONE: string = ((import.meta.env.VITE_SUPPORT_PHONE as string | undefined) ?? '').trim();
