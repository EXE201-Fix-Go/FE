import React, { useState } from 'react';

interface ShopOwnerScreenProps {
  onBack: () => void;
}

type Staff = {
  id: string;
  name: string;
  role: 'Thợ chính' | 'Thợ phụ';
  status: 'Đang trực' | 'Đang nghỉ' | 'Chờ xác nhận';
  rating?: number;
};

const initials = (n: string) =>
  n.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();

export const ShopOwnerScreen: React.FC<ShopOwnerScreenProps> = ({ onBack }) => {
  const [staff, setStaff] = useState<Staff[]>([
    { id: '1', name: 'Nguyễn Văn Tuấn', role: 'Thợ chính', status: 'Đang trực', rating: 4.9 },
    { id: '2', name: 'Trần Minh Phúc', role: 'Thợ phụ', status: 'Đang nghỉ', rating: 4.7 },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fRole, setFRole] = useState<'Thợ chính' | 'Thợ phụ'>('Thợ phụ');
  const [err, setErr] = useState('');

  const activeCount = staff.filter((s) => s.status === 'Đang trực').length;

  const addStaff = () => {
    if (!fName.trim()) return setErr('Nhập tên thợ trước.');
    if (fPhone.replace(/\D/g, '').length < 9) return setErr('Số điện thoại chưa hợp lệ.');
    setStaff((s) => [
      ...s,
      { id: `${Date.now()}`, name: fName.trim(), role: fRole, status: 'Chờ xác nhận' },
    ]);
    setFName('');
    setFPhone('');
    setFRole('Thợ phụ');
    setErr('');
    setShowAdd(false);
  };

  const removeStaff = (id: string) => setStaff((s) => s.filter((x) => x.id !== id));

  const statusStyle = (st: Staff['status']) =>
    st === 'Đang trực'
      ? 'bg-tertiary-container/15 text-tertiary'
      : st === 'Chờ xác nhận'
      ? 'bg-primary-fixed text-on-primary-fixed'
      : 'bg-surface-container text-on-surface-variant';

  return (
    <div className="flex flex-col w-full bg-surface text-on-surface">
      {/* Header Partner */}
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
          <div className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="font-label-sm uppercase tracking-wider text-tertiary-fixed">
              Fix&amp;Go Partner
            </span>
            <h1 className="font-headline-md text-[18px] truncate">Tiệm của tôi</h1>
          </div>
          <button
            type="button"
            aria-label="Cài đặt tiệm"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-gutter pt-space-md pb-space-xl gap-space-md">
        {/* Thẻ tiệm */}
        <section className="bg-inverse-surface text-inverse-on-surface rounded-2xl p-[15px]">
          <div className="flex items-center gap-space-sm">
            <div className="w-12 h-12 rounded-2xl bg-tertiary text-on-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">store</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-headline-md text-[18px] truncate">Tiệm Sửa Xe Anh Ba</p>
              <p className="text-[12px] text-inverse-on-surface/70 truncate">
                Mã tiệm #FG-SHOP-01 · 242 Cống Quỳnh, Q.1
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-space-md">
            {[
              { k: 'Đơn hôm nay', v: '12' },
              { k: 'Doanh thu', v: '1.9tr' },
              { k: 'Đánh giá', v: '4.8★' },
            ].map((x) => (
              <div key={x.k} className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="font-data-metric-md text-[20px] text-tertiary-fixed">{x.v}</p>
                <p className="text-[11px] text-inverse-on-surface/70">{x.k}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Danh sách thợ */}
        <section className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-on-surface font-bold">
              Thợ trong tiệm ({staff.length})
            </span>
            <span className="text-[12px] text-tertiary font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-tertiary" />
              {activeCount} đang trực
            </span>
          </div>

          {staff.map((s) => (
            <div
              key={s.id}
              className="bg-surface-container-lowest rounded-2xl p-[15px] shadow-sm flex items-center gap-space-sm"
            >
              <div className="w-11 h-11 rounded-full bg-tertiary-container/20 text-tertiary flex items-center justify-center font-bold flex-shrink-0">
                {initials(s.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-label-md text-on-surface truncate">{s.name}</p>
                <p className="text-[12px] text-on-surface-variant flex items-center gap-1">
                  {s.role}
                  {s.rating != null && (
                    <>
                      <span>·</span>
                      <span className="material-symbols-outlined text-[14px] text-primary">star</span>
                      {s.rating}
                    </>
                  )}
                </p>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${statusStyle(
                  s.status
                )}`}
              >
                {s.status}
              </span>
              <button
                type="button"
                onClick={() => removeStaff(s.id)}
                aria-label={`Xoá ${s.name}`}
                className="w-8 h-8 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container-low flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">more_vert</span>
              </button>
            </div>
          ))}

          {/* Thêm thợ */}
          {!showAdd ? (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="w-full h-12 rounded-2xl border-2 border-dashed border-tertiary/40 text-tertiary font-bold flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              Thêm thợ vào tiệm
            </button>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl p-[15px] shadow-sm flex flex-col gap-space-sm border border-tertiary/30">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-on-surface font-bold">Mời thợ vào tiệm</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(false);
                    setErr('');
                  }}
                  aria-label="Đóng"
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <input
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                placeholder="Tên thợ"
                className="h-11 rounded-xl bg-surface-container-low border border-surface-container px-3 outline-none focus:border-tertiary text-on-surface"
              />
              <input
                value={fPhone}
                onChange={(e) => setFPhone(e.target.value)}
                inputMode="numeric"
                placeholder="Số điện thoại (Fix&Go gửi lời mời)"
                className="h-11 rounded-xl bg-surface-container-low border border-surface-container px-3 outline-none focus:border-tertiary text-on-surface"
              />
              <div className="grid grid-cols-2 gap-2">
                {(['Thợ chính', 'Thợ phụ'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFRole(r)}
                    className={`h-11 rounded-xl border text-[13px] font-bold transition-colors ${
                      fRole === r
                        ? 'bg-tertiary text-on-tertiary border-tertiary'
                        : 'bg-surface-container-low text-on-surface border-surface-container'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {err && (
                <p className="text-[13px] text-error flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  {err}
                </p>
              )}
              <button
                type="button"
                onClick={addStaff}
                className="h-12 rounded-xl bg-tertiary text-on-tertiary font-bold flex items-center justify-center gap-1.5 active:translate-y-0.5 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
                Gửi lời mời
              </button>
              <p className="text-[11px] text-on-surface-variant">
                Thợ nhận lời mời qua SĐT và cần xác nhận trước khi vào tiệm.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
