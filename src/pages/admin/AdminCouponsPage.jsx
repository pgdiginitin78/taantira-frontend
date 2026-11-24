import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { TextField, Button, MenuItem, Alert } from "@mui/material";
import api from "../../services/api";
import DataTable from "../../components/DataTable";
import { couponAdminValidationSchema } from "../../validations/schemas";
import { formatDateOnly } from "../../utils/formatters";

const DEFAULT_START_DATE = new Date().toISOString().slice(0, 10);
const DEFAULT_EXPIRY_DATE = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(couponAdminValidationSchema),
    defaultValues: {
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 15,
      min_purchase_amount: 2000,
      max_discount_amount: 3000,
      starts_at: DEFAULT_START_DATE,
      expires_at: DEFAULT_EXPIRY_DATE,
    },
  });

  const load = () => {
    api
      .get("/coupons")
      .then((res) => setCoupons(res.data?.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (values) => {
    setMsg("");
    setErr("");
    try {
      await api.post("/coupons", {
        ...values,
        discount_value: Number(values.discount_value),
        min_purchase_amount: Number(values.min_purchase_amount),
        max_discount_amount: values.max_discount_amount
          ? Number(values.max_discount_amount)
          : null,
      });
      setMsg(`Coupon ${values.code} published.`);
      reset();
      load();
    } catch (e) {
      setErr(e.response?.data?.message || "Unable to create coupon.");
    }
  };

  const columns = [
    { header: "Code", accessorKey: "code" },
    { header: "Type", accessorKey: "discount_type" },
    { header: "Value", accessorKey: "discount_value" },
    { header: "Min Purchase", accessorKey: "min_purchase_amount" },
    { header: "Used", accessorKey: "used_count" },
    { header: "Expires", accessorFn: (r) => formatDateOnly(r.expires_at) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">
        Coupons &amp; Promotional Rules
      </h1>
      {msg && <Alert severity="success">{msg}</Alert>}
      {err && <Alert severity="error">{err}</Alert>}

      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-[#3D1023]">
          Create Privilege Coupon
        </h2>
        <form
          onSubmit={handleSubmit(onCreate)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-4"
        >
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Code"
                error={Boolean(errors.code)}
                helperText={errors.code?.message}
              />
            )}
          />
          <Controller
            name="discount_type"
            control={control}
            render={({ field }) => (
              <TextField {...field} select size="small" label="Type">
                <MenuItem value="percentage">Percentage (%)</MenuItem>
                <MenuItem value="fixed">Fixed INR</MenuItem>
              </TextField>
            )}
          />
          <Controller
            name="discount_value"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                type="number"
                label="Value"
                error={Boolean(errors.discount_value)}
                helperText={errors.discount_value?.message}
              />
            )}
          />
          <Controller
            name="min_purchase_amount"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                type="number"
                label="Min Purchase"
              />
            )}
          />
          <Controller
            name="max_discount_amount"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                type="number"
                label="Max Discount Cap"
              />
            )}
          />
          <Controller
            name="starts_at"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                type="date"
                label="Starts"
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
          <Controller
            name="expires_at"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                type="date"
                label="Expires"
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Description"
                error={Boolean(errors.description)}
                helperText={errors.description?.message}
              />
            )}
          />
          <div className="sm:col-span-4">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
            >
              Publish Coupon
            </Button>
          </div>
        </form>
      </div>

      <DataTable
        data={coupons}
        columns={columns}
        searchPlaceholder="Search coupon code..."
      />
    </div>
  );
}
