import { useEffect, useState } from 'react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import { formatINR, formatDateOnly } from '../../utils/formatters';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    api.get('/admin/customers').then((res) => setCustomers(res.data?.data || [])).catch(() => {});
  }, []);

  const columns = [
    { header: 'Customer', accessorKey: 'full_name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Orders', accessorFn: (r) => r.orders?.length ?? r.customerProfile?.total_orders ?? 0 },
    { header: 'Total Spent', accessorFn: (r) => formatINR(r.customerProfile?.total_spent || 0) },
    { header: 'Loyalty Pts', accessorFn: (r) => r.customerProfile?.loyalty_points || 0 },
    { header: 'Refunds', accessorFn: (r) => r.refunds?.length || 0 },
    { header: 'Joined', accessorFn: (r) => formatDateOnly(r.created_at) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">Customers &amp; Loyalty Directory</h1>
      <DataTable data={customers} columns={columns} searchPlaceholder="Search customer name, email, phone..." />
    </div>
  );
}
