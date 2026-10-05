import React, { useState } from 'react';
import { AdminPartnerRow, listPartners, verifyPartner, VerificationStatus } from '../adminApi';
import { useQuery } from '../useQuery';
import { Pager } from '../Pager';
import { StatusBadge, Tone } from '../StatusBadge';
import { ServerMessage } from '../../components/ServerMessage';
import { confirmDialog, toast } from '../../components/notify';

const CARD = 'rounded-2xl border border-surface-container bg-surface-container-lowest p-space-md shadow-sm';

type Filter = VerificationStatus | 'ALL';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'PENDING', label: 'Chờ duyệt' },
  { id: 'APPROVED', label: 'Đã duyệt' },
  { id: 'REJECTED', label: 'Từ chối' },
  { id: 'ALL', label: 'Tất cả' },
];

const DOC_LABEL: Record<string, string> = {
  ID_FRONT: 'CCCD mặt trước',
  ID_BACK: 'CCCD mặt sau',
  SELFIE: 'Ảnh chân dung',
  LICENSE: 'Giấy phép',
  OTHER: 'Giấy tờ khác',
};
const TYPE_LABEL: Record<AdminPartnerRow['partnerType'], string> = {
  INDIVIDUAL: 'Thợ độc lập',
  SHOP: 'Chủ tiệm',
  SHOP_STAFF: 'Nhân viên tiệm',
};
const VERIFICATION: Record<VerificationStatus, { label: string; tone: Tone }> = {
  PENDING: { label: 'Chờ duyệt', tone: 'warning' },
  APPROVED: { label: 'Đã duyệt', tone: 'success' },
  REJECTED: { label: 'Từ chối', tone: 'danger' },
};
const DOC_TONE = (status: string): Tone =>
  status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'danger' : 'neutral';

export const Kyc: React.FC = () => {
  const [filter, setFilter] = useState<Filter>('PENDING');
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, error, loading, reload } = useQuery(
    () => listPartners(filter === 'ALL' ? undefined : filter, page),
    [filter, page]
  );

  const decide = async (p: AdminPartnerRow, status: 'APPROVED' | 'REJECTED') => {
    const who = p.fullName || p.phone || 'hồ sơ này';
    const approve = status === 'APPROVED';
    const ok = await confirmDialog(
      approve
        ? `Duyệt ${who}? Thợ sẽ bắt đầu nhận được đơn cứu hộ.`
        : `Từ chối hồ sơ của ${who}? Thợ sẽ không nhận được đơn.`,
      { okText: approve ? 'Duyệt' : 'Từ chối', cancelText: 'Huỷ', danger: !approve }
    );
    if (!ok) return;
    setBusyId(p.userId);
    try {
      await verifyPartner(p.userId, status);
      toast(approve ? `Đã duyệt ${who}.` : `Đã từ chối ${who}.`, 'success');
      reload();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không cập nhật được hồ sơ.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-space-md">
      <div>
        <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Duyệt hồ sơ thợ (KYC)</h2>
        <p className="font-body-sm text-[12.5px] text-secondary">
          Thợ chỉ nhận được đơn sau khi được duyệt. Ảnh giấy tờ nằm ở kho lưu trữ riêng nên trang này chỉ hiện loại giấy tờ và
          trạng thái đối chiếu.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setFilter(f.id);
              setPage(0);
            }}
            className={`rounded-full px-4 py-1.5 font-label-md text-[13px] font-bold transition-colors ${
              filter === f.id ? 'bg-primary-container text-on-primary' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <ServerMessage variant="error">{error}</ServerMessage>}

      {!data && loading && <div className={`${CARD} text-center text-secondary`}>Đang tải…</div>}
      {data && data.items.length === 0 && (
        <div className={`${CARD} text-center text-secondary`}>
          {filter === 'PENDING' ? 'Không có hồ sơ nào đang chờ duyệt.' : 'Không có hồ sơ nào.'}
        </div>
      )}

      <div className="grid grid-cols-1 gap-space-md xl:grid-cols-2">
        {data?.items.map((p) => {
          const v = VERIFICATION[p.verificationStatus];
          return (
            <div key={p.userId} className={CARD}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-label-lg text-label-lg font-bold text-on-surface">{p.fullName || 'Chưa có tên'}</p>
                  <p className="font-body-sm text-[13px] tabular-nums text-secondary">{p.phone ?? '—'}</p>
                  <p className="mt-0.5 font-body-sm text-[12.5px] text-secondary">
                    {TYPE_LABEL[p.partnerType] ?? p.partnerType}
                    {p.shopName ? ` · ${p.shopName}` : ''}
                    {p.verificationStatus === 'APPROVED' ? ` · ${p.availability === 'ONLINE' ? 'đang online' : p.availability === 'BUSY' ? 'đang bận' : 'offline'}` : ''}
                  </p>
                </div>
                <StatusBadge tone={v.tone}>{v.label}</StatusBadge>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.documents.length === 0 && <span className="text-[12.5px] text-secondary">Chưa nộp giấy tờ nào.</span>}
                {p.documents.map((d, i) => (
                  <StatusBadge key={`${d.documentType}-${i}`} tone={DOC_TONE(d.reviewStatus)}>
                    {DOC_LABEL[d.documentType] ?? d.documentType}
                  </StatusBadge>
                ))}
              </div>

              {p.verificationStatus !== 'APPROVED' && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    disabled={busyId === p.userId}
                    onClick={() => void decide(p, 'APPROVED')}
                    className="h-10 flex-1 rounded-xl bg-tertiary font-label-md text-label-md font-bold text-on-tertiary transition-opacity disabled:opacity-50"
                  >
                    {p.verificationStatus === 'REJECTED' ? 'Duyệt lại' : 'Duyệt'}
                  </button>
                  {p.verificationStatus === 'PENDING' && (
                    <button
                      type="button"
                      disabled={busyId === p.userId}
                      onClick={() => void decide(p, 'REJECTED')}
                      className="h-10 flex-1 rounded-xl bg-error-container font-label-md text-label-md font-bold text-error transition-opacity disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data && (
        <Pager page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPage={setPage} disabled={loading} />
      )}
    </div>
  );
};
