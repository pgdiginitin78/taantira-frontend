import { useEffect, useState } from 'react';
import { Button, MenuItem, Select, TextField, Alert } from '@mui/material';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';

export default function AdminReturnsSupportPage() {
  const [returns, setReturns] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [msg, setMsg] = useState('');

  const load = () => {
    api.get('/returns').then((res) => setReturns(res.data?.data || [])).catch(() => {});
    api.get('/support').then((res) => setTickets(res.data?.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const updateReturnStatus = async (id, status) => {
    await api.put(`/returns/${id}/review`, { status, admin_notes: `Updated to ${status}` });
    setMsg(`Return request #${id} marked ${status}.`);
    load();
  };

  const sendTicketReply = async (ticketId) => {
    const text = replyText[ticketId];
    if (!text?.trim()) return;
    await api.post(`/support/${ticketId}/messages`, { message: text.trim(), status: 'in_progress' });
    setReplyText((prev) => ({ ...prev, [ticketId]: '' }));
    load();
  };

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">Returns, Exchanges &amp; Support</h1>
      {msg && <Alert severity="success">{msg}</Alert>}

      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-[#3D1023]">Return &amp; Exchange Requests</h2>
        <div className="space-y-3 text-xs">
          {returns.length === 0 ? (
            <p className="text-[#641B32]/75">No return requests yet.</p>
          ) : (
            returns.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#F5E7E8] p-4">
                <div>
                  <p className="font-bold text-[#641B32]">
                    {r.order?.order_number} &bull; {r.request_type.toUpperCase()} ({r.customer?.full_name})
                  </p>
                  <p className="mt-1">Reason: {r.reason}</p>
                  <p className="text-[#641B32]/70">{formatDateTime(r.created_at)}</p>
                </div>
                <Select
                  size="small"
                  value={r.status}
                  onChange={(e) => updateReturnStatus(r.id, e.target.value)}
                  className="text-xs"
                >
                  <MenuItem value="requested">Requested</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="pickup_scheduled">Pickup Scheduled</MenuItem>
                  <MenuItem value="picked_up">Picked Up</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-[#3D1023]">Customer Support Tickets</h2>
        <div className="space-y-4 text-xs">
          {tickets.length === 0 ? (
            <p className="text-[#641B32]/75">No active support tickets.</p>
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="space-y-2 rounded-xl border border-[#F5E7E8] p-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#641B32]">
                    {t.ticket_number} &bull; {t.subject} ({t.customer?.full_name})
                  </span>
                  <span className="rounded-full bg-[#F5E7E8] px-3 py-0.5 font-semibold capitalize">{t.status}</span>
                </div>
                <div className="space-y-1">
                  {(t.messages || []).map((m) => (
                    <p key={m.id} className="rounded bg-[#FFF9F2] p-2">
                      <strong>{m.sender?.full_name}:</strong> {m.message}
                    </p>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Write concierge reply..."
                    value={replyText[t.id] || ''}
                    onChange={(e) => setReplyText((prev) => ({ ...prev, [t.id]: e.target.value }))}
                  />
                  <Button size="small" variant="contained" color="primary" onClick={() => sendTicketReply(t.id)}>
                    Reply
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
