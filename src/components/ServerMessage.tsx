import React from 'react';

export type ServerMessageVariant = 'error' | 'info' | 'success';

const STYLES: Record<ServerMessageVariant, { box: string; icon: string; role: 'alert' | 'status' }> = {
  error: { box: 'bg-error-container text-on-error-container', icon: 'error', role: 'alert' },
  info: { box: 'bg-surface-container text-on-surface-variant', icon: 'info', role: 'status' },
  success: {
    box: 'bg-tertiary-container/15 text-tertiary border border-tertiary-container/30',
    icon: 'check_circle',
    role: 'status',
  },
};

interface ServerMessageProps {
  /** error (mặc định) · info · success. */
  variant?: ServerMessageVariant;
  children: React.ReactNode;
  /** Ghi đè icon material-symbols nếu cần. */
  icon?: string;
  className?: string;
}

/**
 * Box thống nhất cho mọi thông điệp trả về từ server (lỗi / thông báo / thành công).
 * Thay cho các khối `role="alert"` lặp lại rải rác ở các màn.
 */
export const ServerMessage: React.FC<ServerMessageProps> = ({ variant = 'error', children, icon, className = '' }) => {
  const s = STYLES[variant];
  return (
    <div
      role={s.role}
      className={`rounded-xl px-[15px] py-2.5 flex items-start gap-2 font-body-sm text-body-sm ${s.box} ${className}`}
    >
      <span className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">{icon ?? s.icon}</span>
      <span className="min-w-0 flex-1 leading-snug">{children}</span>
    </div>
  );
};
