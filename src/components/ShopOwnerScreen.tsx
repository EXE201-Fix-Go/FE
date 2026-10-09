import React, { useCallback, useEffect, useState } from 'react';
import { listStaff, inviteStaff, getPartnerMe, getPartnerStats, PartnerStats, Staff } from '../api/partner';
import { cancelShopInvitation, Invitation, listShopInvitations, removeShopStaff } from '../api/invitations';
import { formatVND } from '../domain/money';
import { ASSETS } from '../data';
import { confirmDialog, toast } from './notify';

interface ShopOwnerScreenProps {
  onBack: () => void;
}

const staffStatus = (s: Staff): { label: string; style: string } =>
  s.verificationStatus === 'REJECTED'
    ? { label: 'Hồ sơ bị từ chối', style: 'bg-error-container text-error' }
    : s.verificationStatus !== 'APPROVED'
      ? { label: 'Chờ duyệt hồ sơ', style: 'bg-primary-fixed text-on-primary-fixed' }
      : s.availability === 'OFFLINE'
        ? { label: 'Đang nghỉ', style: 'bg-surface-container text-on-surface-variant' }
        : { label: s.availability === 'BUSY' ? 'Đang bận' : 'Đang trực', style: 'bg-tertiary-container/15 text-tertiary' };

const initials = (n: string) => n.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();

const dayMonth = (iso: string) => new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

export const ShopOwnerScreen: React.FC<ShopOwnerScreenProps> = ({ onBack }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [shopName, setShopName] = useState('Tiệm của bạn');
  const [approved, setApproved] = useState(true);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [fName, setFName] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [err, setErr] = useState('');
  const [loadErr, setLoadErr] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    getPartnerStats().then(setStats).catch(() => {});
    getPartnerMe()
      .then((p) => {
        if (p.shopName) setShopName(p.shopName);
        setApproved(p.verificationStatus === 'APPROVED');
      })
      .catch(() => {});
    listStaff()
      .then(setStaff)
      .catch((e: unknown) => setLoadErr(e instanceof Error ? e.message : 'Không tải được danh sách thợ.'));
    listShopInvitations()
      .then((l) => setInvites(l.filter((i) => i.status === 'PENDING')))
      .catch(() => {});
  }, []);
  useEffect(load, [load]);

  const activeCount = staff.filter((s) => s.verificationStatus === 'APPROVED' && s.availability === 'ONLINE').length;

  const addStaff = async () => {
    if (!fName.trim()) return setErr('Nhập tên thợ trước.');
    if (fPhone.replace(/\D/g, '').length < 9) return setErr('Số điện thoại chưa hợp lệ.');
    setBusy('invite');
    try {
      await inviteStaff(fPhone, fName.trim());
      toast(`Đã gửi lời mời cho ${fName.trim()}. Thợ cần mở Fix&Go và bấm Tham gia.`, 'success');
      setFName('');
      setFPhone('');
      setErr('');
      setShowAdd(false);
      load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Không gửi được lời mời.');
    } finally {
      setBusy(null);
    }
  };

  const removeStaff = async (s: Staff) => {
    const name = s.fullName || s.phone || 'thợ này';
    const ok = await confirmDialog(`Gỡ ${name} khỏi tiệm? Họ vẫn giữ tài khoản và có thể làm việc độc lập.`, {
      okText: 'Gỡ khỏi tiệm',
      cancelText: 'Giữ lại',
      danger: true,
    });
    if (!ok) return;
    setBusy(s.userId);
    try {
      await removeShopStaff(s.userId);
      setStaff((l) => l.filter((x) => x.userId !== s.userId));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không gỡ được thợ.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const cancelInvite = async (i: Invitation) => {
    setBusy(i.id);
    try {
      await cancelShopInvitation(i.id);
      setInvites((l) => l.filter((x) => x.id !== i.id));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không hủy được lời mời.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col w-full bg-surface text-on-surface">
      {/* Header Partner */}
      <header className="border-b border-surface-container bg-surface-container-lowest text-on-surface shadow-sm">
        <div className="h-16 px-gutter flex items-center gap-space-sm">
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container active:scale-95 transition-transform duration-150 ease-out"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <img src={ASSETS.logo} alt="Fix&Go" className="h-9 w-auto object-contain" />
          <div className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="font-label-sm uppercase tracking-wider text-tertiary">Đối tác</span>
            <h1 className="font-headline-md text-[18px] truncate">Tiệm của tôi</h1>
          </div>
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
              <p className="font-headline-md text-[18px] truncate">{shopName}</p>
              <p className="text-[12px] text-inverse-on-surface/70 truncate">Tài khoản chủ tiệm</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-space-md">
            {[
              { k: 'Đơn hôm nay', v: stats ? String(stats.completedToday) : '—' },
              { k: 'Thu hôm nay', v: stats ? formatVND(stats.earnedToday) : '—' },
              { k: 'Đánh giá', v: stats?.averageRating != null ? `${stats.averageRating.toFixed(1)}★` : '—' },
            ].map((x) => (
              <div key={x.k} className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="font-data-metric-md text-[20px] text-tertiary-fixed">{x.v}</p>
                <p className="text-[11px] text-inverse-on-surface/70">{x.k}</p>
              </div>
            ))}
          </div>
        </section>

        {!approved && (
          <p role="status" className="rounded-xl bg-primary-fixed px-3 py-2 text-[13px] text-on-primary-fixed">
            Tiệm đang chờ Fix&amp;Go duyệt hồ sơ. Sau khi được duyệt bạn mới mời được thợ.
          </p>
        )}
        {loadErr && (
          <p role="alert" className="rounded-xl bg-error-container px-3 py-2 text-[13px] font-bold text-error">
            {loadErr}
          </p>
        )}

        {/* Danh sách thợ */}
        <section className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-on-surface font-bold">Thợ trong tiệm ({staff.length})</span>
            <span className="text-[12px] text-tertiary font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-tertiary" />
              {activeCount} đang trực
            </span>
          </div>

          {staff.length === 0 && !loadErr && (
            <p className="rounded-2xl bg-surface-container-lowest p-[15px] text-[13px] text-on-surface-variant shadow-sm">
              Chưa có thợ nào trong tiệm. Gửi lời mời để thợ tham gia.
            </p>
          )}

          {staff.map((s) => {
            const name = s.fullName || s.phone || 'Thợ';
            const st = staffStatus(s);
            return (
              <div key={s.userId} className="bg-surface-container-lowest rounded-2xl p-[15px] shadow-sm flex items-center gap-space-sm">
                <div className="w-11 h-11 rounded-full bg-tertiary-container/20 text-tertiary flex items-center justify-center font-bold flex-shrink-0">
                  {initials(name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-label-md text-on-surface truncate">{name}</p>
                  <p className="text-[12px] text-on-surface-variant truncate">{s.phone ?? ''}</p>
                </div>
                <span className={`text-[11px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${st.style}`}>{st.label}</span>
                <button
                  type="button"
                  disabled={busy === s.userId}
                  onClick={() => void removeStaff(s)}
                  aria-label={`Gỡ ${name} khỏi tiệm`}
                  className="w-11 h-11 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container-low flex-shrink-0 transition-transform duration-150 ease-out active:scale-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">person_remove</span>
                </button>
              </div>
            );
          })}
        </section>

        {/* Lời mời đang chờ */}
        {invites.length > 0 && (
          <section className="flex flex-col gap-space-sm">
            <span className="font-label-md text-on-surface font-bold">Lời mời đang chờ ({invites.length})</span>
            {invites.map((i) => (
              <div key={i.id} className="bg-surface-container-lowest rounded-2xl p-[15px] shadow-sm flex items-center gap-space-sm border border-dashed border-tertiary/40">
                <div className="min-w-0 flex-1">
                  <p className="font-label-md text-on-surface truncate">{i.inviteeName}</p>
                  <p className="text-[12px] text-on-surface-variant truncate">
                    {i.inviteePhone} · hết hạn {dayMonth(i.expiresAt)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy === i.id}
                  onClick={() => void cancelInvite(i)}
                  className="h-11 px-3 rounded-xl bg-surface-container text-[13px] font-bold text-on-surface transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
                >
                  Hủy lời mời
                </button>
              </div>
            ))}
          </section>
        )}

        {/* Thêm thợ */}
        {!showAdd ? (
          <button
            type="button"
            disabled={!approved}
            onClick={() => setShowAdd(true)}
            className="w-full h-12 rounded-2xl border-2 border-dashed border-tertiary/40 text-tertiary font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform duration-150 ease-out disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            Mời thợ vào tiệm
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
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] text-on-surface-variant">Tên thợ</span>
              <input
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                className="h-11 rounded-xl bg-surface-container-low border border-surface-container px-3 outline-none focus:border-tertiary text-on-surface"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] text-on-surface-variant">Số điện thoại của thợ</span>
              <input
                value={fPhone}
                onChange={(e) => setFPhone(e.target.value)}
                inputMode="numeric"
                placeholder="090 123 4567"
                className="h-11 rounded-xl bg-surface-container-low border border-surface-container px-3 outline-none focus:border-tertiary text-on-surface"
              />
            </label>
            {err && (
              <p role="alert" className="text-[13px] text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {err}
              </p>
            )}
            <button
              type="button"
              disabled={busy === 'invite'}
              onClick={() => void addStaff()}
              className="h-12 rounded-xl bg-tertiary text-on-tertiary font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform duration-150 ease-out disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
              {busy === 'invite' ? 'Đang gửi…' : 'Gửi lời mời'}
            </button>
            <p className="text-[11px] text-on-surface-variant">
              Thợ mở Fix&amp;Go bằng số này, vào Hồ sơ và bấm Tham gia. Tài khoản của họ chỉ thay đổi sau khi họ đồng ý.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
