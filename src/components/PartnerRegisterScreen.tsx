import React, { useRef, useState } from 'react';
import { SERVICES } from '../data';

interface PartnerRegisterScreenProps {
  phone?: string;
  onBack: () => void;
  onSubmitted: () => void;
}

type DocKey = 'front' | 'back' | 'selfie';

/** Ô tải ảnh giấy tờ KYC — chụp thật (mobile mở camera), xem trước, đánh dấu đã tải. */
const DocUpload: React.FC<{
  label: string;
  hint: string;
  icon: string;
  shape?: 'card' | 'circle';
  url: string | null;
  onPick: (url: string) => void;
}> = ({ label, hint, icon, shape = 'card', url, onPick }) => {
  const ref = useRef<HTMLInputElement>(null);
  const box =
    shape === 'circle'
      ? 'w-24 h-24 rounded-full mx-auto'
      : 'w-full aspect-[16/10] rounded-xl';
  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(URL.createObjectURL(f));
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`relative overflow-hidden border-2 flex flex-col items-center justify-center gap-1 active:scale-[0.98] transition-all ${box} ${
          url
            ? 'border-tertiary'
            : 'border-dashed border-outline-variant bg-surface-container-low'
        }`}
      >
        {url ? (
          <>
            <img src={url} alt={label} className="absolute inset-0 w-full h-full object-cover" />
            <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center shadow">
              <span className="material-symbols-outlined text-[16px]">check</span>
            </span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[26px] text-tertiary">{icon}</span>
            <span className="text-[11px] font-bold text-on-surface">Chụp / tải lên</span>
          </>
        )}
      </button>
      <div className="flex items-center justify-between">
        <span className="font-label-md text-on-surface">{label}</span>
        {url && (
          <span className="text-[11px] font-bold text-tertiary flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[14px]">task_alt</span>Đã tải
          </span>
        )}
      </div>
      <span className="text-[11px] text-on-surface-variant">{hint}</span>
    </div>
  );
};

/**
 * Đăng ký đối tác Fix&Go + xác minh danh tính (KYC).
 * Không có ô mật khẩu — xác thực bằng OTP (tuân thủ C-06). Nhận diện app Partner: teal + header tối.
 */
export const PartnerRegisterScreen: React.FC<PartnerRegisterScreenProps> = ({
  phone,
  onBack,
  onSubmitted,
}) => {
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [shopType, setShopType] = useState<'independent' | 'shop'>('independent');
  const [skills, setSkills] = useState<string[]>([]);
  const [docs, setDocs] = useState<Record<DocKey, string | null>>({
    front: null,
    back: null,
    selfie: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const toggleSkill = (id: string) =>
    setSkills((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const setDoc = (k: DocKey, url: string) => setDocs((d) => ({ ...d, [k]: url }));

  const stepInfo = !!name.trim() && !!area.trim();
  const stepDocs = !!docs.front && !!docs.back;
  const stepSelfie = !!docs.selfie;
  const doneCount = [stepInfo, stepDocs, stepSelfie].filter(Boolean).length;
  const canSubmit = stepInfo && stepDocs && stepSelfie && skills.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setTimeout(onSubmitted, 900);
  };

  const steps = [
    { label: 'Thông tin', done: stepInfo, icon: 'badge' },
    { label: 'Giấy tờ', done: stepDocs, icon: 'id_card' },
    { label: 'Chân dung', done: stepSelfie, icon: 'face' },
  ];

  return (
    <div className="flex flex-col w-full bg-surface text-on-surface">
      {/* Header Partner — nền tối, tách biệt app khách */}
      <header className="bg-inverse-surface text-inverse-on-surface shadow-lg">
        <div className="h-16 px-gutter flex items-center gap-space-sm">
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col leading-tight min-w-0">
            <span className="font-label-sm uppercase tracking-wider text-tertiary-fixed">
              Fix&amp;Go Partner
            </span>
            <h1 className="font-headline-md text-[18px] truncate">Đăng ký đối tác</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-gutter pt-space-md pb-space-xl gap-space-md">
        {/* Nấc thang xác minh (KYC) — signature */}
        <section className="bg-inverse-surface text-inverse-on-surface rounded-2xl p-[15px]">
          <div className="flex items-center gap-space-xs mb-space-sm">
            <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">verified_user</span>
            <span className="font-label-sm uppercase tracking-wider text-tertiary-fixed">
              Xác minh danh tính (KYC)
            </span>
          </div>
          <div className="flex items-center">
            {steps.map((s, i) => (
              <React.Fragment key={s.label}>
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      s.done ? 'bg-tertiary text-on-tertiary' : 'bg-white/15 text-inverse-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {s.done ? 'check' : s.icon}
                    </span>
                  </span>
                  <span className="text-[10px] font-bold whitespace-nowrap">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 mb-4 rounded-full ${
                      steps[i + 1].done || s.done ? 'bg-tertiary' : 'bg-white/15'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-[12px] text-inverse-on-surface/70 mt-space-sm leading-relaxed">
            Khách chỉ tin thợ đã xác minh. Hoàn tất {doneCount}/3 bước để kích hoạt nhận đơn.
          </p>
        </section>

        {/* 1. Thông tin cá nhân */}
        <section className="bg-surface-container-lowest rounded-2xl p-[15px] shadow-sm flex flex-col gap-space-sm">
          <span className="font-label-md text-on-surface font-bold">Thông tin cá nhân</span>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-on-surface-variant">Họ và tên (như trên CCCD)</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="h-11 rounded-xl bg-surface-container-low border border-surface-container px-3 outline-none focus:border-tertiary text-on-surface"
            />
          </label>

          <div className="flex items-center justify-between bg-tertiary-container/10 border border-tertiary/30 rounded-xl px-3 h-11">
            <span className="text-[13px] text-on-surface">
              SĐT: <strong>{phone || '0908 123 456'}</strong>
            </span>
            <span className="text-[11px] font-bold text-tertiary flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[16px]">verified</span>Đã xác minh OTP
            </span>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[12px] text-on-surface-variant">Khu vực hoạt động</span>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Vd: Quận 1, Thủ Đức…"
              className="h-11 rounded-xl bg-surface-container-low border border-surface-container px-3 outline-none focus:border-tertiary text-on-surface"
            />
          </label>

          {/* Loại hình */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {(['independent', 'shop'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setShopType(t)}
                className={`h-11 rounded-xl border text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  shopType === t
                    ? 'bg-tertiary text-on-tertiary border-tertiary'
                    : 'bg-surface-container-low text-on-surface border-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {t === 'independent' ? 'person' : 'store'}
                </span>
                {t === 'independent' ? 'Thợ độc lập' : 'Thuộc tiệm'}
              </button>
            ))}
          </div>
        </section>

        {/* 2. Giấy tờ tuỳ thân (KYC) */}
        <section className="bg-surface-container-lowest rounded-2xl p-[15px] shadow-sm flex flex-col gap-space-md">
          <div>
            <span className="font-label-md text-on-surface font-bold">Căn cước công dân</span>
            <p className="text-[12px] text-on-surface-variant">
              Chụp rõ nét, đủ 4 góc, không loá sáng.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DocUpload
              label="Mặt trước"
              hint="Mặt có ảnh và số CCCD"
              icon="id_card"
              url={docs.front}
              onPick={(u) => setDoc('front', u)}
            />
            <DocUpload
              label="Mặt sau"
              hint="Mặt có đặc điểm nhận dạng"
              icon="flip_camera_android"
              url={docs.back}
              onPick={(u) => setDoc('back', u)}
            />
          </div>
          <div className="border-t border-surface-container pt-space-md">
            <DocUpload
              label="Ảnh chân dung"
              hint="Selfie rõ mặt, không đeo khẩu trang — dùng để đối chiếu CCCD."
              icon="face"
              shape="circle"
              url={docs.selfie}
              onPick={(u) => setDoc('selfie', u)}
            />
          </div>
        </section>

        {/* 3. Kỹ năng nhận đơn */}
        <section className="bg-surface-container-lowest rounded-2xl p-[15px] shadow-sm flex flex-col gap-space-sm">
          <span className="font-label-md text-on-surface font-bold">Dịch vụ bạn nhận</span>
          <div className="flex flex-wrap gap-1.5">
            {SERVICES.map((s) => {
              const on = skills.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSkill(s.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-[12px] font-medium transition-colors ${
                    on
                      ? 'bg-tertiary text-on-tertiary border-tertiary'
                      : 'bg-surface-container-low text-on-surface border-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {on ? 'check' : s.icon}
                  </span>
                  {s.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Ghi chú duyệt hồ sơ */}
        <div className="flex items-start gap-2 px-1">
          <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">schedule</span>
          <p className="text-[12px] text-on-surface-variant leading-relaxed">
            Fix&amp;Go duyệt hồ sơ trong vòng 24 giờ. Bạn sẽ nhận thông báo khi tài khoản đối tác được kích hoạt.
          </p>
        </div>

        {/* CTA */}
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={submit}
          className={`w-full min-h-[56px] rounded-2xl font-label-lg uppercase tracking-wide flex items-center justify-center gap-space-sm shadow-md transition-all ${
            canSubmit
              ? 'bg-tertiary hover:bg-tertiary-container text-on-tertiary active:translate-y-0.5'
              : 'bg-surface-container-highest text-on-surface-variant/50 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Đang gửi hồ sơ…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
              Gửi hồ sơ xác minh
            </>
          )}
        </button>
      </main>
    </div>
  );
};
