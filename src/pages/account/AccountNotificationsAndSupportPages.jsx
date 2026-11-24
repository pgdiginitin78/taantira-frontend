import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { TextField, Button, MenuItem, Alert } from '@mui/material';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';
import { supportTicketValidationSchema } from '../../validations/schemas';

export function AccountNotificationsPage() {
  const [items, setItems] = useState([]);

  const load = () => {
    api.get('/notifications').then((res) => setItems(res.data?.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-[#3D1023]">In-App Notifications</h1>
        <Button size="small" variant="outlined" onClick={() => markRead('all')}>
          Mark All Read
        </Button>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-[#641B32]/80">No notifications yet.</div>
        ) : (
          items.map((n) => (
            <div key={n.id} className={`rounded-2xl border p-4 text-xs shadow-sm ${n.is_read ? 'border-[#D9A0A9]/30 bg-white' : 'border-[#641B32] bg-[#FFF9F2]'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#3D1023]">{n.title}</span>
                <span className="text-[11px] text-[#641B32]/70">{formatDateTime(n.created_at)}</span>
              </div>
              <p className="mt-1 text-[#641B32]">{n.message}</p>
              {!n.is_read && (
                <button type="button" onClick={() => markRead(n.id)} className="mt-2 font-semibold text-[#A83F5E] underline">
                  Mark as read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AccountReviewsSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [msg, setMsg] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(supportTicketValidationSchema),
    defaultValues: { subject: '', category: 'order', priority: 'medium', message: '' },
  });

  const loadTickets = () => {
    api.get('/support').then((res) => setTickets(res.data?.data || [])).catch(() => {});
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const onCreateTicket = async (values) => {
    setMsg('');
    await api.post('/support', values);
    setMsg('Support ticket opened. Our care concierge will reply shortly.');
    reset();
    loadTickets();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">Client Support &amp; Reviews</h1>

      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#3D1023]">Open a Concierge Support Ticket</h2>
        {msg && <Alert severity="success" className="mt-3">{msg}</Alert>}
        <form onSubmit={handleSubmit(onCreateTicket)} className="mt-4 flex flex-col gap-3">
          <Controller name="subject" control={control} render={({ field }) => <TextField {...field} size="small" fullWidth label="Subject" error={Boolean(errors.subject)} helperText={errors.subject?.message} />} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField {...field} select size="small" label="Category">
                  <MenuItem value="order">Order / Delivery</MenuItem>
                  <MenuItem value="payment">Manual UPI / Refund</MenuItem>
                  <MenuItem value="sizing">Tailoring &amp; Sizing</MenuItem>
                </TextField>
              )}
            />
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <TextField {...field} select size="small" label="Priority">
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </TextField>
              )}
            />
          </div>
          <Controller name="message" control={control} render={({ field }) => <TextField {...field} size="small" fullWidth multiline rows={3} label="Message" error={Boolean(errors.message)} helperText={errors.message?.message} />} />
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
            Submit Support Request
          </Button>
        </form>
      </div>

      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t.id} className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 text-xs shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#641B32]">{t.ticket_number} &bull; {t.subject}</span>
              <span className="rounded-full bg-[#F5E7E8] px-3 py-0.5 font-semibold capitalize">{t.status.replace(/_/g, ' ')}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {(t.messages || []).map((m) => (
                <p key={m.id} className="rounded bg-[#FFF9F2] p-2">
                  <strong>{m.sender?.full_name || 'User'}:</strong> {m.message}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
