import { useCallback, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { TextField, Button, MenuItem, Alert } from '@mui/material';
import api from '../../services/api';
import { connectSocket } from '../../services/socket';
import TaantiraMap from '../../components/TaantiraMap';
import DataTable from '../../components/DataTable';
import { formatDateTime } from '../../utils/formatters';
import { courierBookValidationSchema } from '../../validations/schemas';

export default function AdminDeliveryPage() {
  const [partners, setPartners] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [orders, setOrders] = useState([]);
  const [zones, setZones] = useState([]);
  const [assignOrderId, setAssignOrderId] = useState('');
  const [assignPartnerId, setAssignPartnerId] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const courierForm = useForm({
    resolver: yupResolver(courierBookValidationSchema),
    defaultValues: { order_id: '', courier_company: '', awb_number: '', tracking_url: '', pickup_date: '' },
  });

  const loadAll = useCallback(() => {
    api.get('/delivery/partners').then((res) => setPartners(res.data?.data || [])).catch(() => {});
    api.get('/tracking/fleet/active').then((res) => setFleet(res.data?.data || [])).catch(() => {});
    api.get('/orders/admin/all').then((res) => setOrders(res.data?.data || [])).catch(() => {});
    api.get('/delivery/zones').then((res) => setZones(res.data?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return undefined;
    const onLocation = (payload) => {
      setFleet((prev) =>
        prev.map((p) =>
          Number(p.id) === Number(payload.delivery_partner_id)
            ? {
                ...p,
                is_stale: false,
                currentLocation: {
                  latitude: payload.latitude,
                  longitude: payload.longitude,
                  recorded_at: payload.recorded_at,
                },
              }
            : p
        )
      );
    };
    socket.on('tracking:location', onLocation);
    return () => socket.off('tracking:location', onLocation);
  }, []);

  const verifyPartner = async (id, approval_status) => {
    setMsg('');
    await api.put(`/delivery/partners/${id}/verify`, { approval_status });
    setMsg(`Partner #${id} marked as ${approval_status}.`);
    loadAll();
  };

  const assignPartner = async () => {
    setErr('');
    setMsg('');
    if (!assignOrderId || !assignPartnerId) {
      setErr('Select both an order and an approved partner.');
      return;
    }
    try {
      await api.post('/delivery/assign', {
        order_id: Number(assignOrderId),
        delivery_partner_id: Number(assignPartnerId),
      });
      setMsg('Order assigned to partner.');
      loadAll();
    } catch (e) {
      setErr(e.response?.data?.message || 'Assignment failed.');
    }
  };

  const onBookCourier = async (values) => {
    setErr('');
    setMsg('');
    try {
      await api.post('/shipping/couriers', {
        ...values,
        order_id: Number(values.order_id),
        tracking_url: values.tracking_url || null,
        pickup_date: values.pickup_date || null,
      });
      setMsg('Manual courier shipment & AWB recorded.');
      courierForm.reset();
      loadAll();
    } catch (e) {
      setErr(e.response?.data?.message || 'Unable to book courier.');
    }
  };

  const fleetMarkers = fleet
    .filter((p) => p.currentLocation)
    .map((p) => ({
      id: `dp-${p.id}`,
      lat: Number(p.currentLocation.latitude),
      lng: Number(p.currentLocation.longitude),
      badge: p.partner_code?.slice(-2) || 'DP',
      color: p.is_stale ? '#C39A52' : '#641B32',
      title: `${p.user?.full_name} (${p.partner_code})`,
      subtitle: p.is_stale ? 'Stale location' : 'Live GPS active',
      timestamp: formatDateTime(p.currentLocation.recorded_at),
    }));

  const partnerColumns = [
    { header: 'Code', accessorKey: 'partner_code' },
    { header: 'Name', accessorFn: (r) => r.user?.full_name || '—' },
    { header: 'City / PIN', accessorFn: (r) => `${r.city} (${r.pincode})` },
    { header: 'Vehicle', accessorFn: (r) => r.vehicles?.[0]?.vehicle_number || '—' },
    { header: 'Online', accessorFn: (r) => (r.is_online ? 'Online' : 'Offline') },
    { header: 'Status', accessorKey: 'approval_status' },
    {
      header: 'Verification',
      cell: ({ row }) =>
        row.original.approval_status === 'pending' ? (
          <div className="flex gap-1.5">
            <Button size="small" variant="contained" color="primary" onClick={() => verifyPartner(row.original.id, 'approved')}>
              Approve
            </Button>
            <Button size="small" variant="outlined" color="error" onClick={() => verifyPartner(row.original.id, 'rejected')}>
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-[11px] capitalize">{row.original.approval_status}</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">Delivery Partners, Fleet Map &amp; Courier Dispatch</h1>
      {msg && <Alert severity="success">{msg}</Alert>}
      {err && <Alert severity="error">{err}</Alert>}

      {/* Active Fleet Live OpenFreeMap */}
      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-[#3D1023]">
          Live Fleet Tracking ({fleetMarkers.length} Partners Reporting GPS)
        </h2>
        <TaantiraMap
          center={fleetMarkers[0] ? [fleetMarkers[0].lat, fleetMarkers[0].lng] : [19.0607, 72.8275]}
          markers={fleetMarkers}
          heightClass="h-80"
        />
      </div>

      {/* Assign Partner & Manual Courier Booking */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#3D1023]">Assign Order to Own Delivery Partner</h2>
          <div className="flex flex-col gap-3">
            <TextField
              select
              size="small"
              fullWidth
              label="Select Order"
              value={assignOrderId}
              onChange={(e) => setAssignOrderId(e.target.value)}
            >
              {orders.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.order_number} ({o.status})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              fullWidth
              label="Select Approved Partner"
              value={assignPartnerId}
              onChange={(e) => setAssignPartnerId(e.target.value)}
            >
              {partners
                .filter((p) => p.approval_status === 'approved')
                .map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.user?.full_name} ({p.partner_code})
                  </MenuItem>
                ))}
            </TextField>
            <Button variant="contained" color="primary" onClick={assignPartner}>
              Assign Delivery Partner
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#3D1023]">Manual Third-Party Courier Booking (No Paid API)</h2>
          <form onSubmit={courierForm.handleSubmit(onBookCourier)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Controller
              name="order_id"
              control={courierForm.control}
              render={({ field }) => (
                <TextField {...field} select size="small" label="Order" error={Boolean(courierForm.formState.errors.order_id)} helperText={courierForm.formState.errors.order_id?.message}>
                  {orders.map((o) => (
                    <MenuItem key={o.id} value={o.id}>{o.order_number}</MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller name="courier_company" control={courierForm.control} render={({ field }) => <TextField {...field} size="small" label="Courier Company" error={Boolean(courierForm.formState.errors.courier_company)} helperText={courierForm.formState.errors.courier_company?.message} />} />
            <Controller name="awb_number" control={courierForm.control} render={({ field }) => <TextField {...field} size="small" label="AWB Number" error={Boolean(courierForm.formState.errors.awb_number)} helperText={courierForm.formState.errors.awb_number?.message} />} />
            <Controller name="tracking_url" control={courierForm.control} render={({ field }) => <TextField {...field} size="small" label="Tracking URL (Optional)" error={Boolean(courierForm.formState.errors.tracking_url)} helperText={courierForm.formState.errors.tracking_url?.message} />} />
            <Controller name="pickup_date" control={courierForm.control} render={({ field }) => <TextField {...field} size="small" type="date" label="Pickup Date" slotProps={{ inputLabel: { shrink: true } }} />} />
            <Button type="submit" variant="contained" color="secondary">
              Save Courier AWB
            </Button>
          </form>
        </div>
      </div>

      {/* Zones summary */}
      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-bold text-[#3D1023]">Configured Service Zones &amp; PIN Codes</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-xs">
          {zones.map((z) => (
            <div key={z.id} className="rounded-xl bg-[#FFF9F2] p-3">
              <p className="font-bold text-[#641B32]">{z.name} ({z.city})</p>
              <p className="mt-1">PINs: {(z.pincodes || []).map((p) => p.pincode).join(', ')}</p>
            </div>
          ))}
        </div>
      </div>

      <DataTable data={partners} columns={partnerColumns} searchPlaceholder="Search partners, codes, cities..." />
    </div>
  );
}
