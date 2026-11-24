import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { TextField, Button, MenuItem, Alert } from "@mui/material";
import api from "../../services/api";
import DataTable from "../../components/DataTable";
import { stockAdjustValidationSchema } from "../../validations/schemas";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState({
    warehouses: [],
    stocks: [],
    low_stock_alerts: [],
    movements: [],
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(stockAdjustValidationSchema),
    defaultValues: {
      warehouse_id: "",
      variant_id: "",
      movement_type: "purchase",
      quantity_delta: 5,
      notes: "",
    },
  });

  const load = () => {
    api
      .get("/inventory")
      .then((res) =>
        setInventory(
          res.data?.data || {
            warehouses: [],
            stocks: [],
            low_stock_alerts: [],
            movements: [],
          },
        ),
      )
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const onAdjust = async (values) => {
    setMsg("");
    setErr("");
    try {
      await api.post("/inventory/adjust", {
        ...values,
        warehouse_id: Number(values.warehouse_id),
        variant_id: Number(values.variant_id),
        quantity_delta: Number(values.quantity_delta),
      });
      setMsg("Inventory updated and movement recorded.");
      reset({
        warehouse_id: values.warehouse_id,
        variant_id: "",
        movement_type: "purchase",
        quantity_delta: 5,
        notes: "",
      });
      load();
    } catch (e) {
      setErr(e.response?.data?.message || "Stock adjustment failed.");
    }
  };

  const columns = [
    { header: "Warehouse", accessorFn: (r) => r.warehouse?.code || "WH" },
    { header: "Product", accessorFn: (r) => r.variant?.product?.name || "—" },
    { header: "Variant SKU", accessorFn: (r) => r.variant?.sku || "—" },
    { header: "Size", accessorFn: (r) => r.variant?.size || "—" },
    { header: "On Hand", accessorKey: "quantity_on_hand" },
    { header: "Reserved", accessorKey: "quantity_reserved" },
    { header: "Reorder At", accessorKey: "reorder_level" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">
        Warehouse Inventory &amp; Stock Adjustments
      </h1>
      {msg && <Alert severity="success">{msg}</Alert>}
      {err && <Alert severity="error">{err}</Alert>}

      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-bold text-[#3D1023]">
          Record Stock Purchase / Adjustment
        </h2>
        <form
          onSubmit={handleSubmit(onAdjust)}
          className="grid grid-cols-1 gap-4 sm:grid-cols-5"
        >
          <Controller
            name="warehouse_id"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                size="small"
                label="Warehouse"
                error={Boolean(errors.warehouse_id)}
                helperText={errors.warehouse_id?.message}
              >
                {(inventory.warehouses || []).map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {w.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="variant_id"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                size="small"
                label="SKU Variant"
                error={Boolean(errors.variant_id)}
                helperText={errors.variant_id?.message}
              >
                {(inventory.stocks || []).map((s) => (
                  <MenuItem key={s.variant_id} value={s.variant_id}>
                    {s.variant?.sku} ({s.quantity_on_hand} qty)
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            name="movement_type"
            control={control}
            render={({ field }) => (
              <TextField {...field} select size="small" label="Movement Type">
                <MenuItem value="purchase">Purchase Restock (+)</MenuItem>
                <MenuItem value="adjustment">Audit Adjustment (+/-)</MenuItem>
                <MenuItem value="return">Customer Return (+)</MenuItem>
                <MenuItem value="rto">Courier RTO (+)</MenuItem>
              </TextField>
            )}
          />
          <Controller
            name="quantity_delta"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                type="number"
                label="Delta (+/-)"
                error={Boolean(errors.quantity_delta)}
                helperText={errors.quantity_delta?.message}
              />
            )}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            Apply Stock
          </Button>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                label="Notes / Purchase Invoice Ref"
                className="sm:col-span-5"
              />
            )}
          />
        </form>
      </div>

      <DataTable
        data={inventory.stocks || []}
        columns={columns}
        searchPlaceholder="Search SKU or garment..."
      />
    </div>
  );
}
