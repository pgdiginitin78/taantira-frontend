import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export default function AccountReturnsPage() {
  const [returns, setReturns] = useState([]);

  useEffect(() => {
    api.get('/returns').then((res) => setReturns(res.data?.data || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">Returns &amp; Exchange History</h1>
      {returns.length === 0 ? (
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-8 text-sm text-[#641B32]/80">
          No return or exchange requests submitted yet. You can initiate a return directly from any delivered order detail page.
        </div>
      ) : (
        returns.map((r) => (
          <div key={r.id} className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 text-xs shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#641B32]">
                {r.request_type.toUpperCase()} &bull; {r.order?.order_number}
              </span>
              <span className="rounded-full bg-[#F5E7E8] px-3 py-1 font-semibold capitalize text-[#641B32]">
                {r.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="mt-2 font-medium text-[#3D1023]">Reason: {r.reason}</p>
            {r.admin_notes && <p className="mt-1 text-[#A83F5E]">Atelier Note: {r.admin_notes}</p>}
            <p className="mt-1 text-[#641B32]/70">Submitted {formatDateTime(r.created_at)}</p>
          </div>
        ))
      )}
    </div>
  );
}
