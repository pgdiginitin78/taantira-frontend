import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { TextField, Button, MenuItem, Alert } from "@mui/material";
import api from "../../services/api";
import DataTable from "../../components/DataTable";
import { refundAdminValidationSchema } from "../../validations/schemas";
import { formatINR } from "../../utils/formatters";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const refundForm = useForm({
    resolver: yupResolver(refundAdminValidationSchema),
    defaultValues: {
      order_id: "",
      amount: "",
      refund_type: "full",
      reason: "",
      reference_number: "",
    },
  });

  const load = () => {
    api
      .get("/payments")
      .then((res) => setPayments(res.data?.data || []))
      .catch(() => {});
    api
      .get("/refunds")
      .then((res) => setRefunds(res.data?.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const verifyPayment = async (payment, decision) => {
    setMsg("");
    setErr("");
    try {
      await api.put(`/payments/${payment.id}/verify`, {
        decision,
        verification_note:
          decision === "paid"
            ? "Verified against bank UPI settlement"
            : "UTR mismatch / not received",
        received_amount: decision === "paid" ? Number(payment.amount) : 0,
      });
      setMsg(`Payment #${payment.id} marked ${decision}.`);
      load();
    } catch (e) {
      setErr(e.response?.data?.message || "Verification failed.");
    }
  };

  const onProcessRefund = async (values) => {
    setMsg("");
    setErr("");
    try {
      await api.post("/refunds", {
        ...values,
        order_id: Number(values.order_id),
        amount: Number(values.amount),
      });
      setMsg("Refund processed and reconciled.");
      refundForm.reset();
      load();
    } catch (e) {
      setErr(e.response?.data?.message || "Refund failed.");
    }
  };

  const columns = [
    {
      header: "Order #",
      accessorFn: (r) => r.order?.order_number || r.order_id,
    },
    { header: "Method", accessorFn: (r) => r.method.toUpperCase() },
    { header: "Amount", accessorFn: (r) => formatINR(r.amount) },
    { header: "Customer UTR", accessorFn: (r) => r.customer_utr || "—" },
    { header: "Status", accessorFn: (r) => r.status.replace(/_/g, " ") },
    {
      header: "Finance Verification",
      cell: ({ row }) =>
        row.original.method === "manual_upi" &&
        row.original.status !== "paid" ? (
          <div className="flex gap-1.5">
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => verifyPayment(row.original, "paid")}
            >
              Approve Paid
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => verifyPayment(row.original, "failed")}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-[11px] text-[#641B32]/75">Finalized</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">
        Payments, Manual UPI Verification &amp; Refunds
      </h1>
      {msg && <Alert severity="success">{msg}</Alert>}
      {err && <Alert severity="error">{err}</Alert>}

      <DataTable
        data={payments}
        columns={columns}
        searchPlaceholder="Search order #, UTR, status..."
      />

      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-[#3D1023]">
          Issue Full / Partial Refund
        </h2>
        <form
          onSubmit={refundForm.handleSubmit(onProcessRefund)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-5"
        >
          <Controller
            name="order_id"
            control={refundForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                size="small"
                label="Order"
                error={Boolean(refundForm.formState.errors.order_id)}
                helperText={refundForm.formState.errors.order_id?.message}
              >
                {payments.map((p) => (
                  <MenuItem key={p.id} value={p.order_id}>
                    {p.order?.order_number} ({formatINR(p.amount)})
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="refund_type"
            control={refundForm.control}
            render={({ field }) => (
              <TextField {...field} select size="small" label="Refund Type">
                <MenuItem value="full">Full Refund</MenuItem>
                <MenuItem value="partial">Partial Refund</MenuItem>
              </TextField>
            )}
          />
          <Controller
            name="amount"
            control={refundForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                type="number"
                label="Amount (INR)"
                error={Boolean(refundForm.formState.errors.amount)}
                helperText={refundForm.formState.errors.amount?.message}
              />
            )}
          />
          <Controller
            name="reference_number"
            control={refundForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Bank / UPI Refund Ref"
                error={Boolean(refundForm.formState.errors.reference_number)}
                helperText={
                  refundForm.formState.errors.reference_number?.message
                }
              />
            )}
          />
          <Button type="submit" variant="contained" color="primary">
            Process Refund
          </Button>
          <Controller
            name="reason"
            control={refundForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Refund Reason"
                className="sm:col-span-5"
                error={Boolean(refundForm.formState.errors.reason)}
                helperText={refundForm.formState.errors.reason?.message}
              />
            )}
          />
        </form>

        {refunds.length > 0 && (
          <div className="mt-4 divide-y divide-[#F5E7E8] text-xs">
            {refunds.map((r) => (
              <div key={r.id} className="flex justify-between py-2">
                <span>
                  {r.order?.order_number} &bull; {r.reason} (Ref:{" "}
                  {r.reference_number})
                </span>
                <span className="font-bold text-[#641B32]">
                  {formatINR(r.amount)} ({r.refund_type})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
