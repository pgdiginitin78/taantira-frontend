import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { TextField, Button, Alert } from '@mui/material';
import api from '../../services/api';
import { settingsValidationSchema } from '../../validations/schemas';
import { formatDateTime } from '../../utils/formatters';

export default function AdminSettingsPage() {
  const [staffData, setStaffData] = useState({ roles: [], staff: [] });
  const [auditLogs, setAuditLogs] = useState([]);
  const [msg, setMsg] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(settingsValidationSchema),
    defaultValues: {
      store_name: 'Taantira',
      upi_vpa: 'taantira.atelier@upi',
      upi_payee_name: 'Taantira Handloom & Couture Atelier',
      free_shipping_threshold: 2999,
      default_shipping_fee: 149,
      default_tax_rate: 12,
    },
  });

  useEffect(() => {
    api.get('/admin/staff').then((res) => setStaffData(res.data?.data || { roles: [], staff: [] })).catch(() => {});
    api.get('/admin/audit-logs').then((res) => setAuditLogs(res.data?.data || [])).catch(() => {});
    api
      .get('/admin/settings')
      .then((res) => {
        const list = res.data?.data || [];
        const map = Object.fromEntries(list.map((s) => [s.setting_key, s.setting_value]));
        reset({
          store_name: map.store_name || 'Taantira',
          upi_vpa: map.upi_vpa || 'taantira.atelier@upi',
          upi_payee_name: map.upi_payee_name || 'Taantira Handloom & Couture Atelier',
          free_shipping_threshold: Number(map.free_shipping_threshold ?? 2999),
          default_shipping_fee: Number(map.default_shipping_fee ?? 149),
          default_tax_rate: Number(map.default_tax_rate ?? 12),
        });
      })
      .catch(() => {});
  }, [reset]);

  const onSaveSettings = async (values) => {
    setMsg('');
    await api.put('/admin/settings', {
      settings: [
        { setting_key: 'store_name', setting_value: values.store_name, group_name: 'store' },
        { setting_key: 'upi_vpa', setting_value: values.upi_vpa, group_name: 'payment' },
        { setting_key: 'upi_payee_name', setting_value: values.upi_payee_name, group_name: 'payment' },
        { setting_key: 'free_shipping_threshold', setting_value: String(values.free_shipping_threshold), group_name: 'shipping' },
        { setting_key: 'default_shipping_fee', setting_value: String(values.default_shipping_fee), group_name: 'shipping' },
        { setting_key: 'default_tax_rate', setting_value: String(values.default_tax_rate), group_name: 'tax' },
      ],
    });
    setMsg('Store, UPI, tax, and shipping settings saved.');
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">Store Settings, Staff Roles &amp; Audit Logs</h1>
      {msg && <Alert severity="success">{msg}</Alert>}

      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-[#3D1023]">Website, Payment UPI, Tax &amp; Delivery Charges</h2>
        <form onSubmit={handleSubmit(onSaveSettings)} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Controller name="store_name" control={control} render={({ field }) => <TextField {...field} size="small" label="Store Name" error={Boolean(errors.store_name)} helperText={errors.store_name?.message} />} />
          <Controller name="upi_vpa" control={control} render={({ field }) => <TextField {...field} size="small" label="Business UPI VPA" error={Boolean(errors.upi_vpa)} helperText={errors.upi_vpa?.message} />} />
          <Controller name="upi_payee_name" control={control} render={({ field }) => <TextField {...field} size="small" label="UPI Payee Name" error={Boolean(errors.upi_payee_name)} helperText={errors.upi_payee_name?.message} />} />
          <Controller name="free_shipping_threshold" control={control} render={({ field }) => <TextField {...field} size="small" type="number" label="Free Shipping Above (INR)" />} />
          <Controller name="default_shipping_fee" control={control} render={({ field }) => <TextField {...field} size="small" type="number" label="Default Delivery Charge (INR)" />} />
          <Controller name="default_tax_rate" control={control} render={({ field }) => <TextField {...field} size="small" type="number" label="Default Tax Rate (%)" />} />
          <div className="sm:col-span-3">
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
              Save Settings
            </Button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-[#3D1023]">Staff &amp; Role Assignments</h2>
          <div className="divide-y divide-[#F5E7E8] text-xs">
            {(staffData.staff || []).map((st) => (
              <div key={st.id} className="flex justify-between py-2.5">
                <div>
                  <p className="font-semibold text-[#3D1023]">{st.full_name}</p>
                  <p className="text-[#641B32]/75">{st.email}</p>
                </div>
                <span className="rounded-full bg-[#F5E7E8] px-3 py-1 font-medium capitalize text-[#641B32]">
                  {(st.roles || []).map((r) => r.name).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-[#3D1023]">Recent Admin Audit Logs</h2>
          <div className="max-h-72 space-y-2 overflow-y-auto text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="rounded-lg bg-[#FFF9F2] p-2.5">
                <p className="font-semibold text-[#641B32]">
                  {log.action} &bull; {log.entity_type} #{log.entity_id}
                </p>
                <p className="text-[11px] text-[#641B32]/75">
                  By {log.actor?.full_name || 'System'} at {formatDateTime(log.created_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
