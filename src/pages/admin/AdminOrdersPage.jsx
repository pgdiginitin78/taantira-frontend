import { useEffect, useState } from "react";
import { MenuItem, Select } from "@mui/material";
import api from "../../services/api";
import DataTable from "../../components/DataTable";
import { formatINR, formatDateTime } from "../../utils/formatters";

const STATUS_OPTIONS = [
  "new",
  "processing",
  "packing",
  "ready_for_pickup",
  "shipped",
  "delivered",
  "cancelled",
  "failed",
  "returned",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);

  const load = () => {
    api
      .get("/orders/admin/all")
      .then((res) => setOrders(res.data?.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (orderId, status) => {
    await api.put(`/orders/${orderId}/status`, { status });
    load();
  };

  const columns = [
    { header: "Order #", accessorKey: "order_number" },
    { header: "Customer", accessorFn: (r) => r.customer?.full_name || "—" },
    { header: "Mode", accessorFn: (r) => r.delivery_mode.replace(/_/g, " ") },
    {
      header: "Payment",
      accessorFn: (r) =>
        `${r.payment_method.toUpperCase()} (${r.payment_status})`,
    },
    { header: "Total", accessorFn: (r) => formatINR(r.total_amount) },
    { header: "Placed", accessorFn: (r) => formatDateTime(r.placed_at) },
    {
      header: "Update Status",
      cell: ({ row }) => (
        <Select
          size="small"
          value={row.original.status}
          onChange={(e) => updateStatus(row.original.id, e.target.value)}
          className="text-xs"
        >
          {STATUS_OPTIONS.map((st) => (
            <MenuItem key={st} value={st} className="text-xs capitalize">
              {st.replace(/_/g, " ")}
            </MenuItem>
          ))}
        </Select>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">
        Order Management
      </h1>
      <DataTable
        data={orders}
        columns={columns}
        searchPlaceholder="Search order #, customer, payment..."
      />
    </div>
  );
}
