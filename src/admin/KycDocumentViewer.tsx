import React, { useEffect, useRef, useState } from 'react';
import { AdminPartnerRow, fetchPartnerDocumentImage, listPartnerDocuments, PartnerDocumentFile } from './adminApi';
import { StatusBadge } from './StatusBadge';

const DOC_LABEL: Record<string, string> = {
  ID_FRONT: 'CCCD mặt trước',
  ID_BACK: 'CCCD mặt sau',
  SELFIE: 'Ảnh chân dung',
  LICENSE: 'Giấy phép',
  OTHER: 'Giấy tờ khác',
};
/** Cùng bộ với backend (KycDocumentPolicy.REQUIRED): thiếu một loại là không duyệt được. */
const REQUIRED = ['ID_FRONT', 'ID_BACK', 'SELFIE'];

type Slot =
  | { state: 'loading' }
  | { state: 'ready'; url: string }
  | { state: 'missing' }
  | { state: 'error' };

interface Props {
  partner: AdminPartnerRow;
  busy: boolean;
  onClose: () => void;
  onDecide: (status: 'APPROVED' | 'REJECTED') => void;
}

/**
 * Xem ảnh giấy tờ KYC của một thợ rồi duyệt/từ chối. Ảnh nằm ở kho riêng tư nên được tải qua backend (cần đăng nhập admin),
 * không có URL công khai. Nút "Duyệt" chỉ bật khi đủ 3 loại giấy tờ bắt buộc đã hiển thị được — admin buộc phải thấy ảnh.
 */
export const KycDocumentViewer: React.FC<Props> = ({ partner, busy, onClose, onDecide }) => {
  const [docs, setDocs] = useState<PartnerDocumentFile[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [slots, setSlots] = useState<Record<string, Slot>>({});
  const [zoom, setZoom] = useState<string | null>(null);
  const [entered, setEntered] = useState(false);
  const urls = useRef<string[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Vào mượt (opacity + scale 0.96→1, ease-out): hộp thoại hiếm gặp nên có animation; tôn trọng reduced-motion qua motion-reduce.
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Trả focus về nút đã mở hộp thoại khi đóng.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listPartnerDocuments(partner.userId);
        if (cancelled) return;
        setDocs(list);
        setSlots(Object.fromEntries(list.map((d) => [d.id, d.fileAvailable ? ({ state: 'loading' } as Slot) : ({ state: 'missing' } as Slot)])));
        await Promise.all(
          list
            .filter((d) => d.fileAvailable)
            .map(async (d) => {
              try {
                const blob = await fetchPartnerDocumentImage(partner.userId, d.id);
                const url = URL.createObjectURL(blob);
                urls.current.push(url);
                if (!cancelled) setSlots((s) => ({ ...s, [d.id]: { state: 'ready', url } }));
              } catch {
                if (!cancelled) setSlots((s) => ({ ...s, [d.id]: { state: 'error' } }));
              }
            })
        );
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Không tải được giấy tờ.');
      }
    })();
    return () => {
      cancelled = true;
      urls.current.forEach((u) => URL.revokeObjectURL(u));
      urls.current = [];
    };
  }, [partner.userId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (zoom) setZoom(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom, onClose]);

  const readyTypes = new Set((docs ?? []).filter((d) => slots[d.id]?.state === 'ready').map((d) => d.documentType));
  const missing = REQUIRED.filter((t) => !readyTypes.has(t));
  const loading = !docs && !loadError;
  const canApprove = !!docs && missing.length === 0 && !busy;
  const decidable = partner.verificationStatus !== 'APPROVED';
  const title = partner.fullName || partner.phone || 'Hồ sơ thợ';

  return (
    <div
      className={`fixed inset-0 z-[1500] flex items-end justify-center bg-black/50 transition-opacity duration-200 ease-out motion-reduce:transition-none sm:items-center sm:p-6 ${
        entered ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kyc-viewer-title"
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-surface-container-lowest shadow-2xl transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none sm:rounded-3xl ${
          entered ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.96] opacity-0'
        }`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-surface-container px-space-md py-space-sm">
          <div className="min-w-0">
            <h3 id="kyc-viewer-title" className="truncate font-headline-md text-[18px] font-bold text-on-surface">
              {title}
            </h3>
            <p className="font-body-sm text-[12.5px] tabular-nums text-secondary">{partner.phone ?? '—'}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-on-surface transition-[transform,background-color] duration-150 ease-out hover:bg-surface-container active:scale-[0.95]"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-space-md py-space-md">
          {loading && <p className="py-8 text-center text-secondary">Đang tải giấy tờ…</p>}
          {loadError && (
            <p role="alert" className="rounded-xl bg-error-container px-3 py-2 text-[13px] font-bold text-error">
              {loadError}
            </p>
          )}
          {docs && docs.length === 0 && <p className="py-8 text-center text-secondary">Thợ chưa nộp giấy tờ nào.</p>}

          <div className="grid grid-cols-1 gap-space-md sm:grid-cols-3">
            {docs?.map((d) => {
              const slot = slots[d.id] ?? { state: 'loading' as const };
              return (
                <figure key={d.id} className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    disabled={slot.state !== 'ready'}
                    onClick={() => slot.state === 'ready' && setZoom(slot.url)}
                    aria-label={`Phóng to ${DOC_LABEL[d.documentType] ?? d.documentType}`}
                    className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-surface-container bg-surface-container text-secondary transition-transform duration-150 ease-out enabled:active:scale-[0.98]"
                  >
                    {slot.state === 'ready' && <img src={slot.url} alt={DOC_LABEL[d.documentType] ?? d.documentType} className="h-full w-full object-contain" />}
                    {slot.state === 'loading' && <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" aria-label="Đang tải ảnh" />}
                    {slot.state === 'missing' && <span className="px-3 text-center text-[12px]">Không có file ảnh (hồ sơ cũ hoặc file đã mất)</span>}
                    {slot.state === 'error' && <span className="px-3 text-center text-[12px] text-error">Không tải được ảnh</span>}
                  </button>
                  <figcaption className="flex items-center justify-between gap-2">
                    <span className="font-label-md text-[13px] font-bold text-on-surface">{DOC_LABEL[d.documentType] ?? d.documentType}</span>
                    <StatusBadge tone={d.reviewStatus === 'APPROVED' ? 'success' : d.reviewStatus === 'REJECTED' ? 'danger' : 'neutral'}>
                      {d.reviewStatus === 'APPROVED' ? 'Đã duyệt' : d.reviewStatus === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                    </StatusBadge>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>

        <footer className="border-t border-surface-container px-space-md py-space-sm">
          {decidable && docs && missing.length > 0 && (
            <p role="status" className="mb-2 text-[12.5px] text-secondary">
              Chưa thể duyệt: cần xem đủ {missing.map((t) => DOC_LABEL[t]).join(', ')}.
            </p>
          )}
          <div className="flex gap-2">
            {decidable ? (
              <>
                {partner.verificationStatus === 'PENDING' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDecide('REJECTED')}
                    className="h-12 flex-1 rounded-xl bg-error-container font-label-md text-label-md font-bold text-error transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                )}
                <button
                  type="button"
                  disabled={!canApprove}
                  onClick={() => onDecide('APPROVED')}
                  className="h-12 flex-1 rounded-xl bg-tertiary font-label-md text-label-md font-bold text-on-tertiary transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] disabled:opacity-40"
                >
                  {partner.verificationStatus === 'REJECTED' ? 'Duyệt lại' : 'Duyệt'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="h-12 flex-1 rounded-xl bg-surface-container font-label-md text-label-md font-bold text-on-surface transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                Đóng
              </button>
            )}
          </div>
        </footer>
      </div>

      {zoom && (
        <div
          className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/85 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setZoom(null);
          }}
        >
          <img src={zoom} alt="Ảnh giấy tờ phóng to" className="max-h-full max-w-full rounded-lg object-contain" />
          <button
            type="button"
            aria-label="Đóng ảnh phóng to"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white active:scale-[0.95]"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
      )}
    </div>
  );
};
