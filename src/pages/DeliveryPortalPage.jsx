import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { TextField, Button, Switch, FormControlLabel, Alert } from '@mui/material';
import { Navigation, ShieldAlert, WifiOff, CheckCircle2, Truck } from 'lucide-react';
import api from '../services/api';
import { connectSocket } from '../services/socket';
import { useAuthStore } from '../store/useAuthStore';
import TaantiraMap from '../components/TaantiraMap';
import { partnerRegisterValidationSchema, otpCompleteValidationSchema } from '../validations/schemas';
import { formatINR, formatDateTime, isLocationStale } from '../utils/formatters';

let activeGeoWatchId = null;

export default function DeliveryPortalPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | tracking | permission_denied | unsupported
  const [currentCoord, setCurrentCoord] = useState(null);
  const [isBrowserOnline, setIsBrowserOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queuedUpdates, setQueuedUpdates] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeOtpAssignmentId, setActiveOtpAssignmentId] = useState(null);

  const regForm = useForm({
    resolver: yupResolver(partnerRegisterValidationSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      service_pincodes_csv: '400001, 400050',
      vehicle_type: 'Electric Scooter',
      vehicle_number: '',
      doc_type: 'Driving Licence',
      doc_number_masked: '',
    },
  });

  const otpForm = useForm({
    resolver: yupResolver(otpCompleteValidationSchema),
    defaultValues: { otp: '', recipient_name: '', note: '', cod_collected: false },
  });

  const isPartnerUser = (user?.roles || []).includes('delivery_partner');

  const loadDashboard = useCallback(() => {
    if (!isAuthenticated || !isPartnerUser) return;
    api
      .get('/delivery/partner/dashboard')
      .then((res) => {
        const d = res.data?.data;
        setDashboard(d);
        if (d?.partner?.currentLocation) {
          setCurrentCoord({
            latitude: Number(d.partner.currentLocation.latitude),
            longitude: Number(d.partner.currentLocation.longitude),
            recorded_at: d.partner.currentLocation.recorded_at,
          });
        }
      })
      .catch((err) => setErrorMsg(err.response?.data?.message || 'Unable to load partner dashboard.'));
  }, [isAuthenticated, isPartnerUser]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Monitor internet connection & flush queued GPS coordinates when back online
  useEffect(() => {
    const onOnline = async () => {
      setIsBrowserOnline(true);
      connectSocket();
      if (queuedUpdates.length > 0) {
        const last = queuedUpdates[queuedUpdates.length - 1];
        try {
          await api.post('/tracking/location', last);
          setQueuedUpdates([]);
        } catch {
          // Keep queued if API still unreachable
        }
      }
    };
    const onOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [queuedUpdates]);

  const stopGpsWatch = useCallback(() => {
    if (activeGeoWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(activeGeoWatchId);
      activeGeoWatchId = null;
    }
    setGpsStatus('idle');
  }, []);

  useEffect(() => () => {
    if (activeGeoWatchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(activeGeoWatchId);
      activeGeoWatchId = null;
    }
  }, []);

  const startGpsBroadcast = (assignmentId = null) => {
    if (!navigator.geolocation) {
      setGpsStatus('unsupported');
      setErrorMsg('Browser Geolocation API is not supported on this device.');
      return;
    }
    setErrorMsg('');
    setGpsStatus('tracking');

    const socket = connectSocket();

    activeGeoWatchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const payload = {
          delivery_assignment_id: assignmentId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy_meters: pos.coords.accuracy,
          speed_mps: pos.coords.speed,
          heading: pos.coords.heading,
        };
        setCurrentCoord({ ...payload, recorded_at: new Date().toISOString() });

        if (!navigator.onLine) {
          setQueuedUpdates((prev) => [...prev.slice(-9), payload]);
          return;
        }

        if (socket && socket.connected) {
          socket.emit('partner:location_update', payload);
        } else {
          try {
            await api.post('/tracking/location', payload);
          } catch {
            setQueuedUpdates((prev) => [...prev.slice(-9), payload]);
          }
        }
      },
      (geoErr) => {
        if (geoErr.code === 1) {
          setGpsStatus('permission_denied');
          setErrorMsg('Location permission denied. Enable browser location permission to share live delivery GPS.');
        } else {
          setErrorMsg(`GPS signal issue: ${geoErr.message}`);
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const onRegisterPartner = async (values) => {
    setErrorMsg('');
    setFeedback('');
    try {
      const pincodes = values.service_pincodes_csv
        .split(',')
        .map((s) => s.trim())
        .filter((s) => /^\d{6}$/.test(s));

      await api.post('/delivery/partners/register', {
        ...values,
        service_pincodes: pincodes.length ? pincodes : [values.pincode],
      });
      setFeedback('Application submitted! Admin verification and approval are required before going online.');
      regForm.reset();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Partner registration failed.');
    }
  };

  const toggleOnline = async (checked) => {
    setErrorMsg('');
    try {
      await api.put('/delivery/partner/availability', { is_online: checked });
      loadDashboard();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Cannot update availability.');
    }
  };

  const respondAssignment = async (id, action) => {
    await api.post(`/delivery/assignments/${id}/respond`, { action });
    loadDashboard();
  };

  const confirmPickup = async (id) => {
    await api.post(`/delivery/assignments/${id}/pickup`);
    loadDashboard();
  };

  const startDelivery = async (id) => {
    await api.post(`/delivery/assignments/${id}/start`);
    startGpsBroadcast(id);
    loadDashboard();
  };

  const onCompleteOtp = async (values) => {
    if (!activeOtpAssignmentId) return;
    setErrorMsg('');
    setFeedback('');
    try {
      await api.post(`/delivery/assignments/${activeOtpAssignmentId}/complete`, {
        ...values,
        delivered_latitude: currentCoord?.latitude || null,
        delivered_longitude: currentCoord?.longitude || null,
      });
      stopGpsWatch();
      setActiveOtpAssignmentId(null);
      otpForm.reset();
      setFeedback('Customer OTP verified and delivery marked complete!');
      loadDashboard();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Invalid OTP.');
    }
  };

  // Show Public Registration & Partner Login if not logged in as Delivery Partner
  if (!isAuthenticated || !isPartnerUser) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] px-4 py-10 text-[#3D1023]">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#3D1023] p-6 text-[#FFF9F2]">
            <div>
              <p className="font-serif text-xl font-bold tracking-[0.2em]">TAANTIRA FLEET</p>
              <p className="mt-1 text-xs text-[#C39A52]">Web Delivery Partner Portal (Open-Source GPS &amp; OTP Verification)</p>
            </div>
            <div className="flex gap-3">
              <Link to="/login" state={{ from: '/delivery' }} className="rounded-full bg-[#C39A52] px-5 py-2 text-xs font-bold text-[#3D1023]">
                Partner Sign In
              </Link>
              <Link to="/store" className="rounded-full border border-[#F5E7E8]/40 px-4 py-2 text-xs text-[#FFF9F2]">
                Storefront
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-[#D9A0A9]/50 bg-white p-8 shadow-sm">
            <h1 className="font-serif text-2xl font-bold text-[#3D1023]">Public Delivery Partner Registration</h1>
            <p className="mt-1 text-xs text-[#641B32]/80">
              All partner applications undergo manual admin document verification before receiving order assignments. Live GPS tracking operates strictly while this browser tab remains open and permitted.
            </p>
            {feedback && <Alert severity="success" className="mt-4">{feedback}</Alert>}
            {errorMsg && <Alert severity="error" className="mt-4">{errorMsg}</Alert>}

            <form onSubmit={regForm.handleSubmit(onRegisterPartner)} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller name="full_name" control={regForm.control} render={({ field }) => <TextField {...field} size="small" label="Full Name" error={Boolean(regForm.formState.errors.full_name)} helperText={regForm.formState.errors.full_name?.message} />} />
              <Controller name="email" control={regForm.control} render={({ field }) => <TextField {...field} size="small" label="Email" error={Boolean(regForm.formState.errors.email)} helperText={regForm.formState.errors.email?.message} />} />
              <Controller name="phone" control={regForm.control} render={({ field }) => <TextField {...field} size="small" label="Phone" error={Boolean(regForm.formState.errors.phone)} helperText={regForm.formState.errors.phone?.message} />} />
              <Controller name="password" control={regForm.control} render={({ field }) => <TextField {...field} size="small" type="password" label="Password" error={Boolean(regForm.formState.errors.password)} helperText={regForm.formState.errors.password?.message} />} />
              <Controller name="address" control={regForm.control} render={({ field }) => <TextField {...field} size="small" label="Home Address" className="sm:col-span-2" error={Boolean(regForm.formState.errors.address)} helperText={regForm.formState.errors.address?.message} />} />
              <Controller name="city" control={regForm.control} render={({ field }) => <TextField {...field} size="small" label="City" error={Boolean(regForm.formState.errors.city)} helperText={regForm.formState.errors.city?.message} />} />
              <Controller name="state" control={regForm.control} render={({ field }) => <TextField {...field} size="small" label="State" error={Boolean(regForm.formState.errors.state)} helperText={regForm.formState.errors.state?.message} />} />
              <Controller name="pincode" control={regForm.control} render={({ field }) => <TextField {...field} size="small" label="Primary 6-Digit PIN" error={Boolean(regForm.formState.errors.pincode)} helperText={regForm.formState.errors.pincode?.message} />} />
              <Controller name="service_pincodes_csv" control={regForm.control} render={({ field }) => <TextField {...field} size="small" label="Serviceable PINs (comma-separated)" error={Boolean(regForm.formState.errors.service_pincodes_csv)} helperText={regForm.formState.errors.service_pincodes_csv?.message} />} />
              <Controller name="vehicle_type" control={regForm.control} render={({ field }) => <TextField {...field} size="small" label="Vehicle Type" error={Boolean(regForm.formState.errors.vehicle_type)} helperText={regForm.formState.errors.vehicle_type?.message} />} />
              <Controller name="vehicle_number" control={regForm.control} render={({ field }) => <TextField {...field} size="small" label="Vehicle Registration #" error={Boolean(regForm.formState.errors.vehicle_number)} helperText={regForm.formState.errors.vehicle_number?.message} />} />
              <Controller name="doc_type" control={regForm.control} render={({ field }) => <TextField {...field} size="small" label="ID / Licence Type" error={Boolean(regForm.formState.errors.doc_type)} helperText={regForm.formState.errors.doc_type?.message} />} />
              <Controller name="doc_number_masked" control={regForm.control} render={({ field }) => <TextField {...field} size="small" label="Masked Document Reference" error={Boolean(regForm.formState.errors.doc_number_masked)} helperText={regForm.formState.errors.doc_number_masked?.message} />} />
              <div className="sm:col-span-2">
                <Button type="submit" variant="contained" color="primary" disabled={regForm.formState.isSubmitting}>
                  Submit Partner Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const partner = dashboard?.partner;
  const stats = dashboard?.stats || {};

  return (
    <div className="min-h-screen bg-[#FFF9F2] px-4 py-6 text-[#3D1023] sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Top Fleet Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#3D1023] p-5 text-[#FFF9F2] shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#C39A52]">
              {partner?.partner_code} &bull; Approval: {partner?.approval_status?.toUpperCase()}
            </p>
            <h1 className="font-serif text-2xl font-bold">{user.full_name} — Delivery Partner Hub</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(partner?.is_online)}
                  disabled={partner?.approval_status !== 'approved'}
                  onChange={(e) => toggleOnline(e.target.checked)}
                  color="secondary"
                />
              }
              label={<span className="text-xs font-semibold text-[#FFF9F2]">{partner?.is_online ? 'Online' : 'Offline'}</span>}
            />
            <Button size="small" variant="outlined" color="inherit" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Network / GPS Permission Notices */}
        {!isBrowserOnline && (
          <Alert severity="warning" icon={<WifiOff className="h-4 w-4" />}>
            Internet disconnected. Location points queued ({queuedUpdates.length}) and will sync automatically when online.
          </Alert>
        )}
        {gpsStatus === 'permission_denied' && (
          <Alert severity="error" icon={<ShieldAlert className="h-4 w-4" />}>
            Browser Geolocation permission denied. Grant location permission in your browser bar to broadcast live coordinates.
          </Alert>
        )}
        {feedback && <Alert severity="success">{feedback}</Alert>}
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        {partner?.approval_status !== 'approved' && (
          <Alert severity="info">
            Your partner profile status is currently <strong>{partner?.approval_status}</strong>. Once verified by an Admin, you can toggle Online and receive assignments.
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-4"><p className="text-xs text-[#641B32]">Pending</p><p className="mt-1 text-xl font-bold">{stats.pending_count || 0}</p></div>
          <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-4"><p className="text-xs text-[#641B32]">Active</p><p className="mt-1 text-xl font-bold">{stats.active_count || 0}</p></div>
          <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-4"><p className="text-xs text-[#641B32]">Completed</p><p className="mt-1 text-xl font-bold">{stats.completed_count || 0}</p></div>
          <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-4"><p className="text-xs text-[#641B32]">Earnings</p><p className="mt-1 text-xl font-bold">{formatINR(stats.total_earnings || 0)}</p></div>
        </div>

        {/* Live GPS Map Preview */}
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#3D1023]">
              <Navigation className="h-4 w-4 text-[#641B32]" /> Live Browser Geolocation Broadcast
            </h2>
            <div className="flex items-center gap-2 text-xs">
              {currentCoord && (
                <span className={`rounded-full px-3 py-1 font-medium ${isLocationStale(currentCoord.recorded_at) ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  Updated {formatDateTime(currentCoord.recorded_at)}
                </span>
              )}
              {gpsStatus === 'tracking' ? (
                <Button size="small" variant="outlined" color="error" onClick={stopGpsWatch}>
                  Stop GPS
                </Button>
              ) : (
                <Button size="small" variant="contained" color="primary" onClick={() => startGpsBroadcast(dashboard?.active_assignments?.[0]?.id || null)}>
                  Start GPS Share
                </Button>
              )}
            </div>
          </div>
          <p className="mb-3 text-[11px] text-[#641B32]/80">
            Note: Web Geolocation broadcasts only while this portal tab remains active in your browser (background tracking when browser is closed is unsupported on web).
          </p>
          <TaantiraMap
            center={currentCoord ? [currentCoord.latitude, currentCoord.longitude] : [19.0607, 72.8275]}
            markers={
              currentCoord
                ? [{ id: 'me', lat: currentCoord.latitude, lng: currentCoord.longitude, badge: 'ME', title: 'Your Current GPS', timestamp: formatDateTime(currentCoord.recorded_at) }]
                : []
            }
            heightClass="h-64"
          />
        </div>

        {/* Pending Assignments */}
        {(dashboard?.pending_assignments || []).length > 0 && (
          <div className="rounded-2xl border border-[#C39A52] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-base font-bold text-[#3D1023]">New Delivery Requests</h2>
            <div className="space-y-3 text-xs">
              {dashboard.pending_assignments.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#FFF9F2] p-4">
                  <div>
                    <p className="font-bold text-[#641B32]">{a.order?.order_number}</p>
                    <p>{a.order?.shippingAddress?.address_line1}, {a.order?.shippingAddress?.city} - {a.order?.shippingAddress?.pincode}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="small" variant="contained" color="primary" onClick={() => respondAssignment(a.id, 'accept')}>Accept</Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => respondAssignment(a.id, 'reject')}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Deliveries */}
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#3D1023]">
            <Truck className="h-4 w-4 text-[#641B32]" /> Active Deliveries
          </h2>
          {(dashboard?.active_assignments || []).length === 0 ? (
            <p className="text-xs text-[#641B32]/75">No active deliveries right now.</p>
          ) : (
            <div className="space-y-4 text-xs">
              {dashboard.active_assignments.map((a) => (
                <div key={a.id} className="space-y-3 rounded-xl border border-[#F5E7E8] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[#641B32]">{a.order?.order_number} &bull; {a.status.replace(/_/g, ' ').toUpperCase()}</p>
                      <p>{a.order?.shippingAddress?.recipient_name} ({a.order?.shippingAddress?.phone})</p>
                      <p>{a.order?.shippingAddress?.address_line1}, {a.order?.shippingAddress?.city} - {a.order?.shippingAddress?.pincode}</p>
                      <p className="mt-1 font-semibold">
                        Payment: {a.order?.payment_method?.toUpperCase()} ({formatINR(a.order?.total_amount)})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {a.status === 'accepted' && (
                        <Button size="small" variant="contained" color="primary" onClick={() => confirmPickup(a.id)}>
                          Confirm Parcel Pickup
                        </Button>
                      )}
                      {a.status === 'picked_up' && (
                        <Button size="small" variant="contained" color="secondary" onClick={() => startDelivery(a.id)}>
                          Start Delivery &amp; GPS
                        </Button>
                      )}
                      {a.status === 'out_for_delivery' && (
                        <>
                          <Button size="small" variant="outlined" onClick={() => startGpsBroadcast(a.id)}>
                            Broadcast GPS
                          </Button>
                          <Button size="small" variant="contained" color="primary" onClick={() => setActiveOtpAssignmentId(a.id)}>
                            Verify Customer OTP
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {activeOtpAssignmentId === a.id && (
                    <form onSubmit={otpForm.handleSubmit(onCompleteOtp)} className="grid grid-cols-1 gap-3 rounded-xl bg-[#FFF9F2] p-4 sm:grid-cols-4">
                      <Controller
                        name="otp"
                        control={otpForm.control}
                        render={({ field }) => (
                          <TextField {...field} size="small" label="6-Digit Customer OTP" error={Boolean(otpForm.formState.errors.otp)} helperText={otpForm.formState.errors.otp?.message} />
                        )}
                      />
                      <Controller name="recipient_name" control={otpForm.control} render={({ field }) => <TextField {...field} size="small" label="Received By" />} />
                      {a.order?.payment_method === 'cod' && (
                        <Controller
                          name="cod_collected"
                          control={otpForm.control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={<Switch checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} size="small" />}
                              label="COD Collected"
                            />
                          )}
                        />
                      )}
                      <Button type="submit" variant="contained" color="primary" startIcon={<CheckCircle2 className="h-4 w-4" />}>
                        Complete Delivery
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
