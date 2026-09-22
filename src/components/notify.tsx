import React, { useEffect, useState } from 'react';

// Thông báo trong app thay cho alert()/confirm() native (popup "localhost cho biết…").
// API mệnh lệnh gọn: toast(msg) và await confirmDialog(msg).

export type ToastVariant = 'info' | 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}
interface ConfirmReq {
  message: string;
  okText: string;
  cancelText: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

let toasts: ToastItem[] = [];
let confirmReq: ConfirmReq | null = null;
const listeners = new Set<() => void>();
let seq = 1;
const emit = () => listeners.forEach((l) => l());

/** Hiện toast tự tắt sau ~4s. */
export function toast(message: string, variant: ToastVariant = 'info'): void {
  const id = seq++;
  toasts = [...toasts, { id, message, variant }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 4200);
}

/** Hỏi Đồng ý/Huỷ; trả về Promise<boolean>. */
export function confirmDialog(
  message: string,
  opts?: { okText?: string; cancelText?: string; danger?: boolean }
): Promise<boolean> {
  return new Promise((resolve) => {
    if (confirmReq) confirmReq.resolve(false); // huỷ hộp thoại đang mở (nếu có)
    confirmReq = {
      message,
      okText: opts?.okText ?? 'Đồng ý',
      cancelText: opts?.cancelText ?? 'Huỷ',
      danger: opts?.danger ?? false,
      resolve,
    };
    emit();
  });
}

function closeConfirm(ok: boolean) {
  const req = confirmReq;
  confirmReq = null;
  emit();
  req?.resolve(ok);
}

const TONE: Record<ToastVariant, { box: string; icon: string }> = {
  info: { box: 'bg-inverse-surface text-inverse-on-surface', icon: 'info' },
  success: { box: 'bg-tertiary-container text-on-tertiary-container', icon: 'check_circle' },
  error: { box: 'bg-error-container text-on-error-container', icon: 'error' },
};

/** Đặt 1 lần ở gốc App — vẽ toast + hộp thoại xác nhận. */
export const NotificationHost: React.FC = () => {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return (
    <>
      <div className="fixed left-0 right-0 bottom-4 z-[2000] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto max-w-md w-full rounded-xl px-4 py-3 shadow-lg flex items-start gap-2 font-body-sm text-body-sm ${TONE[t.variant].box}`}
          >
            <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">{TONE[t.variant].icon}</span>
            <span className="min-w-0 leading-snug">{t.message}</span>
          </div>
        ))}
      </div>

      {confirmReq && (
        <div
          className="fixed inset-0 z-[2100] bg-black/40 flex items-center justify-center px-6"
          onClick={() => closeConfirm(false)}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl p-space-lg max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-body-md text-body-md text-on-surface mb-4 leading-relaxed">{confirmReq.message}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="flex-1 h-11 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md"
              >
                {confirmReq.cancelText}
              </button>
              <button
                type="button"
                onClick={() => closeConfirm(true)}
                className={`flex-1 h-11 rounded-xl font-label-md text-label-md font-bold ${
                  confirmReq.danger ? 'bg-error-container text-on-error-container' : 'bg-primary-container text-on-primary'
                }`}
              >
                {confirmReq.okText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
