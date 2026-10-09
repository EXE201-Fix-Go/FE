import React, { useCallback, useEffect, useState } from 'react';
import { acceptInvitation, declineInvitation, Invitation, listMyInvitations } from '../api/invitations';
import { confirmDialog, toast } from './notify';

interface Props {
  /** Gọi sau khi chấp nhận thành công — App tải lại tài khoản và chuyển sang app Đối tác nếu vai trò đổi. */
  onJoined: () => void;
}

/**
 * Lời mời vào tiệm gửi tới SĐT của tài khoản này. Chấp nhận là quyết định của chính người được mời:
 * khách trở thành nhân viên tiệm (vẫn cần admin duyệt hồ sơ KYC của riêng mình).
 * Không hiện gì khi không có lời mời.
 */
export const InvitationsCard: React.FC<Props> = ({ onJoined }) => {
  const [items, setItems] = useState<Invitation[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    listMyInvitations().then(setItems).catch(() => setItems([]));
  }, []);
  useEffect(load, [load]);

  if (items.length === 0) return null;

  const accept = async (inv: Invitation) => {
    const shop = inv.shopName || 'tiệm này';
    const ok = await confirmDialog(
      `Tham gia ${shop} với tư cách thợ? Tài khoản của bạn sẽ chuyển sang app Đối tác và cần Fix&Go duyệt hồ sơ trước khi nhận đơn.`,
      { okText: 'Tham gia', cancelText: 'Để sau' }
    );
    if (!ok) return;
    setBusy(inv.id);
    try {
      await acceptInvitation(inv.id);
      toast(`Bạn đã vào ${shop}.`, 'success');
      onJoined();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không chấp nhận được lời mời.', 'error');
      load();
    } finally {
      setBusy(null);
    }
  };

  const decline = async (inv: Invitation) => {
    setBusy(inv.id);
    try {
      await declineInvitation(inv.id);
      setItems((l) => l.filter((x) => x.id !== inv.id));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không từ chối được lời mời.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-label="Lời mời vào tiệm" className="flex flex-col gap-space-sm rounded-xl border border-tertiary/30 bg-surface-container-lowest p-space-md shadow-sm">
      <div className="flex items-center gap-2 text-tertiary">
        <span className="material-symbols-outlined text-[20px]">storefront</span>
        <h2 className="font-label-md text-[14px] font-bold">Lời mời vào tiệm</h2>
      </div>
      {items.map((inv) => (
        <div key={inv.id} className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-3">
          <p className="text-[14px] text-on-surface">
            <strong>{inv.shopName || 'Một tiệm sửa xe'}</strong> mời bạn làm thợ của tiệm.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy === inv.id}
              onClick={() => void decline(inv)}
              className="h-11 flex-1 rounded-xl bg-surface-container font-label-md text-on-surface transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
            >
              Từ chối
            </button>
            <button
              type="button"
              disabled={busy === inv.id}
              onClick={() => void accept(inv)}
              className="h-11 flex-1 rounded-xl bg-tertiary font-label-md font-bold text-on-tertiary transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
            >
              Tham gia
            </button>
          </div>
        </div>
      ))}
    </section>
  );
};
