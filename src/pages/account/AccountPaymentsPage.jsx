import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatINR, formatDateTime } from '../../utils/formatters';

export default function AccountPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);

  useEffect(() => {
    api.get('/payments').then((res) => setPayments(res.data?.data || [])).catch(() => {});
    api.get('/refunds').then((res) => setRefunds(res.data?.data || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">Payments &amp; Refunds</h1>

      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-[#3D1023]">Payment History (COD &amp; Manual UPI)</h2>
        <div className="divide-y divide-[#F5E7E8] text-xs">
          {payments.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <Link to={`/account/orders/${p.order_id}`} className="font-bold text-[#641B32] hover:underline">
                  {p.order?.order_number}
                </Link>
                <p className="text-[#641B32]/75">
                  Method: {p.method.toUpperCase()} {p.customer_utr ? `• UTR: ${p.customer_utr}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#F5E7E8] px-3 py-1 font-semibold capitalize text-[#641B32]">
                  {p.status.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-bold text-[#3D1023]">{formatINR(p.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {refunds.length > 0 && (
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-[#3D1023]">Refund Records</h2>
          <div className="divide-y divide-[#F5E7E8] text-xs">
            {refunds.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-bold text-[#3D1023]">{r.order?.order_number} ({r.refund_type})</p>
                  <p>{r.reason} &bull; Ref: {r.reference_number}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-700">{formatINR(r.amount)}</p>
                  <p className="text-[11px]">{formatDateTime(r.processed_at || r.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
