import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { TextField, Button, Alert, MenuItem } from '@mui/material';
import { KeyRound, MapPin, PackageCheck, RefreshCw, Truck } from 'lucide-react';
import api from '../../services/api';
import { connectSocket } from '../../services/socket';
import TaantiraMap from '../../components/TaantiraMap';
import { formatINR, formatDateTime, isLocationStale } from '../../utils/formatters';
import {
  upiSubmitValidationSchema,
  cancellationValidationSchema,
  returnRequestValidationSchema,
} from '../../validations/schemas';

export default function AccountOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [liveCoord, setLiveCoord] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const upiForm = useForm({ resolver: yupResolver(upiSubmitValidationSchema), defaultValues: { utr_number: '' } });
  const cancelForm = useForm({ resolver: yupResolver(cancellationValidationSchema), defaultValues: { reason: '', details: '' } });
  const returnForm = useForm({
    resolver: yupResolver(returnRequestValidationSchema),
    defaultValues: { request_type: 'return', reason: '', details: '' },
  });

  const loadOrderData = useCallback(async () => {
    try {
      const [orderRes, trackRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get(`/tracking/orders/${id}`),
      ]);
      setOrder(orderRes.data?.data);
      const t = trackRes.data?.data;
      setTracking(t);
      if (t?.live_location) {
        setLiveCoord(t.live_location);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Unable to load order.');
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    Promise.all([api.get(`/orders/${id}`), api.get(`/tracking/orders/${id}`)])
      .then(([orderRes, trackRes]) => {
        if (!active) return;
        setOrder(orderRes.data?.data);
        const t = trackRes.data?.data;
        setTracking(t);
        if (t?.live_location) {
          setLiveCoord(t.live_location);
        }
      })
      .catch((err) => {
        if (active) setErrorMsg(err.response?.data?.message || 'Unable to load order.');
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return undefined;
    socket.emit('order:join', { orderId: Number(id) });

    const onLocation = (payload) => {
      if (Number(payload.order_id) === Number(id)) {
        setLiveCoord({
          latitude: Number(payload.latitude),
          longitude: Number(payload.longitude),
          recorded_at: payload.recorded_at,
          is_stale: false,
        });
      }
    };
    const onStatus = (payload) => {
      if (Number(payload.order_id) === Number(id)) {
        loadOrderData();
      }
    };

    socket.on('tracking:location', onLocation);
    socket.on('order:status_updated', onStatus);
    return () => {
      socket.off('tracking:location', onLocation);
      socket.off('order:status_updated', onStatus);
    };
  }, [id, loadOrderData]);

  const onSubmitUtr = async (values) => {
    setFeedback('');
    setErrorMsg('');
    try {
      await api.post(`/payments/orders/${id}/upi-utr`, values);
      setFeedback('UTR submitted. Finance team will verify and confirm shortly.');
      upiForm.reset();
      loadOrderData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit UTR.');
    }
  };

  const onCancelOrder = async (values) => {
    setFeedback('');
    setErrorMsg('');
    try {
      await api.post(`/orders/${id}/cancel`, values);
      setFeedback('Order cancelled and stock restored.');
      cancelForm.reset();
      loadOrderData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Cannot cancel this order.');
    }
  };

  const onRequestReturn = async (values) => {
    if (!order?.items?.length) return;
    setFeedback('');
    setErrorMsg('');
    try {
      await api.post('/returns', {
        order_id: order.id,
        request_type: values.request_type,
        reason: values.reason,
        details: values.details,
        items: [{ order_item_id: order.items[0].id, quantity: 1 }],
      });
      setFeedback('Return / exchange request submitted.');
      returnForm.reset();
      loadOrderData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Return request failed.');
    }
  };

  if (!order) return <div className="rounded-2xl bg-white p-6 text-sm text-[#641B32]">{errorMsg || 'Loading order details...'}</div>;

  const markers = [];
  if (liveCoord) {
    markers.push({
      id: 'partner',
      lat: liveCoord.latitude,
      lng: liveCoord.longitude,
      badge: 'DP',
      color: '#641B32',
      title: 'Taantira Delivery Partner',
      subtitle: isLocationStale(liveCoord.recorded_at) ? 'Location update stale' : 'Live GPS active',
      timestamp: formatDateTime(liveCoord.recorded_at),
    });
  }
  if (order.shippingAddress?.latitude && order.shippingAddress?.longitude) {
    markers.push({
      id: 'dest',
      lat: order.shippingAddress.latitude,
      lng: order.shippingAddress.longitude,
      badge: 'H',
      color: '#C39A52',
      title: 'Delivery Destination',
      subtitle: `${order.shippingAddress.address_line1}, ${order.shippingAddress.city}`,
    });
  }

  const routeCoordinates =
    tracking?.osrm_route?.route?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]) || null;

  const mapCenter = liveCoord
    ? [Number(liveCoord.latitude), Number(liveCoord.longitude)]
    : order.shippingAddress?.latitude
    ? [Number(order.shippingAddress.latitude), Number(order.shippingAddress.longitude)]
    : [19.0607, 72.8275];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#A83F5E]">Order Reference</p>
          <h1 className="font-serif text-2xl font-bold text-[#3D1023]">{order.order_number}</h1>
          <p className="text-xs text-[#641B32]/75">Placed on {formatDateTime(order.placed_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#641B32] px-4 py-1.5 text-xs font-semibold capitalize text-[#FFF9F2]">
            {order.status.replace(/_/g, ' ')}
          </span>
          <Button size="small" variant="outlined" onClick={loadOrderData} startIcon={<RefreshCw className="h-3.5 w-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {feedback && <Alert severity="success">{feedback}</Alert>}
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

      {/* Secure Delivery OTP Display */}
      {order.delivery_mode === 'own_partner' && order.delivery_otp_code && order.status !== 'cancelled' && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#C39A52] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <KeyRound className="h-6 w-6 text-[#641B32]" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#A83F5E]">Authenticated Delivery OTP</p>
              <p className="text-xs text-[#3D1023]/80">
                Share this OTP with your Taantira partner only at doorstep handover.
                {order.otp_verified_at && ` Verified on ${formatDateTime(order.otp_verified_at)}.`}
              </p>
            </div>
          </div>
          <span className="rounded-xl bg-[#F5E7E8] px-5 py-2 font-mono text-2xl font-bold tracking-[0.25em] text-[#641B32]">
            {order.delivery_otp_code}
          </span>
        </div>
      )}

      {/* Live Map Tracking (Own Partner) OR Third-Party Courier Tracking */}
      {order.delivery_mode === 'own_partner' ? (
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#3D1023]">
              <MapPin className="h-4 w-4 text-[#641B32]" /> Live Delivery Tracking
            </h2>
            {liveCoord ? (
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${isLocationStale(liveCoord.recorded_at) ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {isLocationStale(liveCoord.recorded_at) ? 'Location Stale' : 'Live'} &bull; Updated {formatDateTime(liveCoord.recorded_at)}
              </span>
            ) : (
              <span className="text-xs text-[#641B32]/75">Waiting for delivery partner GPS broadcast</span>
            )}
          </div>
          <TaantiraMap center={mapCenter} markers={markers} routeCoordinates={routeCoordinates} />
        </div>
      ) : (
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#3D1023]">
            <Truck className="h-4 w-4 text-[#641B32]" /> Courier Shipment Tracking
          </h2>
          {order.courierShipment ? (
            <div className="mt-3 space-y-3 text-xs">
              <div className="flex flex-wrap gap-6 rounded-xl bg-[#FFF9F2] p-4">
                <div><span className="text-[#A83F5E]">Courier:</span> <strong>{order.courierShipment.courier_company}</strong></div>
                <div><span className="text-[#A83F5E]">AWB:</span> <strong>{order.courierShipment.awb_number}</strong></div>
                <div><span className="text-[#A83F5E]">Status:</span> <strong className="capitalize">{order.courierShipment.shipment_status}</strong></div>
                {order.courierShipment.tracking_url && (
                  <a href={order.courierShipment.tracking_url} target="_blank" rel="noreferrer" className="font-semibold text-[#641B32] underline">
                    External Courier Tracking Link
                  </a>
                )}
              </div>
              <div className="space-y-2">
                {(order.courierShipment.events || []).map((ev) => (
                  <div key={ev.id} className="flex items-start justify-between rounded-lg border border-[#F5E7E8] p-3">
                    <div>
                      <p className="font-semibold text-[#3D1023]">{ev.status} {ev.location ? `(${ev.location})` : ''}</p>
                      <p className="text-[#641B32]/80">{ev.description}</p>
                    </div>
                    <span className="text-[11px] text-[#641B32]/70">{formatDateTime(ev.event_time)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-[#641B32]/75">Awaiting courier booking and AWB assignment from warehouse.</p>
          )}
        </div>
      )}

      {/* Manual UPI UTR Submission */}
      {order.payment_method === 'manual_upi' && order.payment_status !== 'paid' && (
        <div className="rounded-2xl border border-[#C39A52] bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#3D1023]">Manual UPI Verification</h2>
          <p className="mt-1 text-xs text-[#641B32]/80">
            Status: <strong className="uppercase">{order.payment_status.replace(/_/g, ' ')}</strong> &bull; Current UTR:{' '}
            <strong>{order.payments?.[0]?.customer_utr || 'Not submitted yet'}</strong>
          </p>
          <form onSubmit={upiForm.handleSubmit(onSubmitUtr)} className="mt-4 flex flex-wrap gap-3">
            <Controller
              name="utr_number"
              control={upiForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  label="Enter / Update 12-Digit UPI UTR"
                  error={Boolean(upiForm.formState.errors.utr_number)}
                  helperText={upiForm.formState.errors.utr_number?.message}
                  className="min-w-[260px]"
                />
              )}
            />
            <Button type="submit" variant="contained" color="primary">
              Submit UTR for Admin Verification
            </Button>
          </form>
        </div>
      )}

      {/* Items & Totals */}
      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#3D1023]">
          <PackageCheck className="h-4 w-4 text-[#641B32]" /> Ordered Pieces
        </h2>
        <div className="divide-y divide-[#F5E7E8]">
          {(order.items || []).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div className="flex items-center gap-3">
                <img src={item.image_url || '/assets/products/saree-burgundy.jpg'} alt={item.product_name} className="h-16 w-12 rounded object-cover object-top" />
                <div>
                  <p className="font-semibold text-[#3D1023]">{item.product_name}</p>
                  <p className="text-xs text-[#641B32]/75">Size: {item.size} &bull; {item.color_name} &bull; Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="font-bold text-[#641B32]">{formatINR(item.total_price)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#F5E7E8] pt-4 text-xs sm:grid-cols-5">
          <div>Subtotal: <strong>{formatINR(order.subtotal)}</strong></div>
          <div>Discount: <strong>-{formatINR(order.discount_amount)}</strong></div>
          <div>Tax: <strong>{formatINR(order.tax_amount)}</strong></div>
          <div>Shipping: <strong>{formatINR(order.shipping_fee)}</strong></div>
          <div>Total: <strong className="text-sm text-[#641B32]">{formatINR(order.total_amount)}</strong></div>
        </div>
      </div>

      {/* Cancel / Return Forms */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {!['shipped', 'delivered', 'cancelled', 'returned'].includes(order.status) && (
          <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#3D1023]">Cancel Order</h3>
            <form onSubmit={cancelForm.handleSubmit(onCancelOrder)} className="mt-3 space-y-3">
              <Controller
                name="reason"
                control={cancelForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    size="small"
                    fullWidth
                    label="Cancellation Reason"
                    error={Boolean(cancelForm.formState.errors.reason)}
                    helperText={cancelForm.formState.errors.reason?.message}
                  />
                )}
              />
              <Button type="submit" variant="outlined" color="error" size="small">
                Cancel Order
              </Button>
            </form>
          </div>
        )}

        {order.status === 'delivered' && (
          <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#3D1023]">Request Return / Exchange</h3>
            <form onSubmit={returnForm.handleSubmit(onRequestReturn)} className="mt-3 space-y-3">
              <Controller
                name="request_type"
                control={returnForm.control}
                render={({ field }) => (
                  <TextField {...field} select size="small" fullWidth label="Request Type">
                    <MenuItem value="return">Return &amp; Refund</MenuItem>
                    <MenuItem value="exchange">Size / Variant Exchange</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="reason"
                control={returnForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    size="small"
                    fullWidth
                    label="Reason"
                    error={Boolean(returnForm.formState.errors.reason)}
                    helperText={returnForm.formState.errors.reason?.message}
                  />
                )}
              />
              <Button type="submit" variant="outlined" color="primary" size="small">
                Submit Request
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
