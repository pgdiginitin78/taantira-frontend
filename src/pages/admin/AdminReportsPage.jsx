import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { Download } from 'lucide-react';
import api, { getAuthToken } from '../../services/api';

export default function AdminReportsPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/reports/summary').then((res) => setSummary(res.data?.data)).catch(() => {});
  }, []);

  const exportCsv = async (type) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const response = await fetch(`${baseUrl}/reports/export/${type}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taantira-${type}-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">Operational Reports &amp; CSV Exports</h1>

      <div className="flex flex-wrap gap-3">
        {['sales', 'inventory', 'coupons'].map((type) => (
          <Button
            key={type}
            variant="contained"
            color="primary"
            onClick={() => exportCsv(type)}
            startIcon={<Download className="h-4 w-4" />}
          >
            Export {type.toUpperCase()} CSV
          </Button>
        ))}
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5">
            <p className="font-bold text-[#641B32]">Sales Orders Logged</p>
            <p className="mt-1 text-2xl font-bold">{summary.sales?.length || 0}</p>
          </div>
          <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5">
            <p className="font-bold text-[#641B32]">Cancellations</p>
            <p className="mt-1 text-2xl font-bold">{summary.cancellations?.length || 0}</p>
          </div>
          <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5">
            <p className="font-bold text-[#641B32]">Refund Records</p>
            <p className="mt-1 text-2xl font-bold">{summary.refunds?.length || 0}</p>
          </div>
          <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5">
            <p className="font-bold text-[#641B32]">Return Requests</p>
            <p className="mt-1 text-2xl font-bold">{summary.returns?.length || 0}</p>
          </div>
          <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5">
            <p className="font-bold text-[#641B32]">Courier Shipments</p>
            <p className="mt-1 text-2xl font-bold">{summary.couriers?.length || 0}</p>
          </div>
          <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5">
            <p className="font-bold text-[#641B32]">Active Coupons</p>
            <p className="mt-1 text-2xl font-bold">{summary.coupons?.length || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}
