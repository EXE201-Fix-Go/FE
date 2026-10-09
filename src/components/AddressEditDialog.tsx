import React, { useEffect, useRef, useState } from 'react';

interface Props {
  initial: string;
  onSave: (address: string) => void;
  onClose: () => void;
}

/** Hộp thoại sửa địa chỉ sự cố (thay cho window.prompt, vốn bị chặn ở nhiều trình duyệt/webview). */
export const AddressEditDialog: React.FC<Props> = ({ initial, onSave, onClose }) => {
  const [value, setValue] = useState(initial);
  const [entered, setEntered] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const trimmed = value.trim();

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    input.current?.focus();
    input.current?.select();
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[1500] flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-edit-title"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-surface-container-lowest p-space-md shadow-xl transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
          entered ? 'scale-100 opacity-100' : 'scale-[0.96] opacity-0'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 id="address-edit-title" className="font-headline-md text-headline-md text-on-surface">
            Địa chỉ gặp sự cố
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-11 w-11 items-center justify-center rounded-full text-secondary transition-transform duration-150 ease-out hover:bg-surface-container active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[12px] text-on-surface-variant">Số nhà, tên đường, mốc dễ nhận</span>
          <input
            ref={input}
            type="text"
            value={value}
            maxLength={300}
            onChange={(e) => setValue(e.target.value)}
            className="h-12 w-full rounded-xl border border-surface-container-high bg-surface-container-low px-3 font-body-md text-on-surface outline-none focus:border-primary"
            placeholder="Vd: Cổng KTX khu B, Làng Đại học"
          />
        </label>
        <p className="text-[12px] leading-relaxed text-on-surface-variant">
          Thợ đến theo vị trí GPS của bạn; địa chỉ giúp thợ tìm đúng chỗ nhanh hơn.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl bg-surface-container font-label-md text-on-surface transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={!trimmed}
            className="h-12 flex-1 rounded-xl bg-primary font-label-md font-bold text-on-primary shadow-sm transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] disabled:opacity-40"
          >
            Lưu địa chỉ
          </button>
        </div>
      </form>
    </div>
  );
};
