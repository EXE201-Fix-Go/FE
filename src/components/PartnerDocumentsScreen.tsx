import React, { useEffect, useRef, useState } from 'react';
import { DocUpload } from './PartnerRegisterScreen';
import { DocKey, DocUploadError, UploadedCache, uploadKycSet } from '../domain/kycUpload';

interface Props {
  /** true khi hồ sơ từng bị từ chối: đổi lời dẫn. */
  rejected: boolean;
  onBack: () => void;
  /** Gửi bộ giấy tờ mới lên backend (PUT /partner/me/documents); ném lỗi nếu thất bại. */
  onSubmit: (documents: { documentType: 'ID_FRONT' | 'ID_BACK' | 'SELFIE'; storageKey: string }[]) => Promise<void>;
}

interface Picked {
  file: File;
  preview: string;
}

/**
 * Nộp / nộp lại giấy tờ KYC cho tài khoản đối tác ĐÃ có hồ sơ: thợ vừa vào tiệm qua lời mời (chưa có giấy tờ)
 * hoặc thợ bị từ chối. Cần đủ ba ảnh như lúc đăng ký (BR06).
 */
export const PartnerDocumentsScreen: React.FC<Props> = ({ rejected, onBack, onSubmit }) => {
  const [docs, setDocs] = useState<Record<DocKey, Picked | null>>({ front: null, back: null, selfie: null });
  const [docError, setDocError] = useState<Partial<Record<DocKey, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const cache = useRef<UploadedCache>({});
  const previews = useRef<string[]>([]);

  useEffect(
    () => () => {
      previews.current.forEach((u) => URL.revokeObjectURL(u));
    },
    []
  );

  const pick = (k: DocKey, file: File) => {
    if (docs[k]) URL.revokeObjectURL(docs[k]!.preview);
    const preview = URL.createObjectURL(file);
    previews.current.push(preview);
    setDocs((d) => ({ ...d, [k]: { file, preview } }));
    setDocError((e) => ({ ...e, [k]: undefined }));
  };

  const ready = !!docs.front && !!docs.back && !!docs.selfie;

  const submit = async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const documents = await uploadKycSet(
        { front: docs.front!.file, back: docs.back!.file, selfie: docs.selfie!.file },
        cache.current,
        setProgress
      );
      await onSubmit(documents);
    } catch (e: unknown) {
      if (e instanceof DocUploadError) setDocError((er) => ({ ...er, [e.doc]: e.message }));
      setError(e instanceof Error ? e.message : 'Không gửi được hồ sơ.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-surface text-on-surface">
      <header className="bg-inverse-surface text-inverse-on-surface shadow-lg">
        <div className="h-16 px-gutter flex items-center gap-space-sm">
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-transform duration-150 ease-out"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-label-sm uppercase tracking-wider text-tertiary-fixed">Fix&amp;Go Partner</span>
            <h1 className="font-headline-md text-[18px] truncate">{rejected ? 'Gửi lại giấy tờ' : 'Bổ sung giấy tờ'}</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-gutter pt-space-md pb-space-xl gap-space-md">
        <p className="text-[13px] leading-relaxed text-on-surface-variant">
          {rejected
            ? 'Hồ sơ trước chưa được duyệt. Chụp lại rõ nét ba ảnh dưới đây để Fix&Go xem xét lại.'
            : 'Fix&Go cần ảnh CCCD và chân dung của bạn để duyệt tài khoản thợ. Sau khi gửi, hồ sơ được duyệt trong vòng 24 giờ.'}
        </p>

        <section className="bg-surface-container-lowest rounded-2xl p-[15px] shadow-sm flex flex-col gap-space-md">
          <div className="grid grid-cols-2 gap-3">
            <DocUpload label="Mặt trước" hint="Mặt có ảnh và số CCCD" icon="id_card" url={docs.front?.preview ?? null} error={docError.front} onPick={(f) => pick('front', f)} />
            <DocUpload label="Mặt sau" hint="Mặt có đặc điểm nhận dạng" icon="flip_camera_android" url={docs.back?.preview ?? null} error={docError.back} onPick={(f) => pick('back', f)} />
          </div>
          <div className="border-t border-surface-container pt-space-md">
            <DocUpload
              label="Ảnh chân dung"
              hint="Selfie rõ mặt, không đeo khẩu trang — dùng để đối chiếu CCCD."
              icon="face"
              shape="circle"
              url={docs.selfie?.preview ?? null}
              error={docError.selfie}
              onPick={(f) => pick('selfie', f)}
            />
          </div>
        </section>

        {error && (
          <p role="alert" className="rounded-xl bg-error-container px-3 py-2 text-[13px] font-bold text-error">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!ready || submitting}
          onClick={() => void submit()}
          className={`w-full min-h-[56px] rounded-2xl font-label-lg uppercase tracking-wide flex items-center justify-center gap-space-sm shadow-md transition-[transform,opacity] duration-150 ease-out ${
            ready ? 'bg-tertiary text-on-tertiary active:scale-[0.98]' : 'bg-surface-container-highest text-on-surface-variant/50 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {progress < 3 ? `Đang tải ảnh ${Math.min(progress + 1, 3)}/3…` : 'Đang gửi hồ sơ…'}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
              Gửi giấy tờ
            </>
          )}
        </button>
      </main>
    </div>
  );
};
