import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Download, RefreshCw, AlertTriangle } from "lucide-react";
import { Button, TextField } from "@mui/material";
import api, { getAuthToken } from "../../services/api";
import { formatINR } from "../../utils/formatters";

const CHART_COLORS = [
  "#641B32",
  "#C39A52",
  "#A83F5E",
  "#A8AD91",
  "#3D1023",
  "#D9A0A9",
];

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-[#3D1023]">{title}</h3>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(() => {
    api
      .get("/admin/dashboard", {
        params: {
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      })
      .then((res) => {
        setAnalytics(res.data?.data);
        setError("");
      })
      .catch((err) =>
        setError(
          err.response?.data?.message ||
            "Unable to fetch analytics from MySQL.",
        ),
      );
  }, [startDate, endDate]);

  useEffect(() => {
    let active = true;
    api
      .get("/admin/dashboard", {
        params: {
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      })
      .then((res) => {
        if (active) {
          setAnalytics(res.data?.data);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to fetch analytics from MySQL.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [startDate, endDate]);

  const downloadCsv = async (type) => {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
    const response = await fetch(`${baseUrl}/reports/export/${type}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `taantira-${type}-report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-[#D9A0A9] bg-white p-6 text-sm text-[#641B32]">
        <p className="font-bold">Admin Dashboard Error</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-2xl bg-white p-8 text-sm text-[#641B32]">
        Loading Taantira analytics...
      </div>
    );
  }

  const kpis = analytics.kpis || {};
  const charts = analytics.charts || {};

  const kpiCards = [
    { label: "Gross Sales", value: formatINR(kpis.gross_sales) },
    { label: "Net Sales", value: formatINR(kpis.net_sales) },
    { label: "Total Orders", value: kpis.total_orders },
    { label: "Avg Order Value", value: formatINR(kpis.average_order_value) },
    { label: "New Customers", value: kpis.new_customers },
    { label: "Returning Customers", value: kpis.returning_customers },
    { label: "Pending Orders", value: kpis.pending_orders },
    { label: "Delivered Orders", value: kpis.delivered_orders },
    { label: "Cancelled Orders", value: kpis.cancelled_orders },
    { label: "Refund Totals", value: formatINR(kpis.refund_totals) },
    { label: "Low-Stock Alerts", value: kpis.low_stock_count },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Date Filter + CSV */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#A83F5E]">
            Taantira Intelligence
          </p>
          <h1 className="font-serif text-2xl font-bold text-[#3D1023]">
            Executive Analytics &amp; Operations
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TextField
            type="date"
            size="small"
            label="From"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={fetchAnalytics}
            startIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Apply
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => downloadCsv("sales")}
            startIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export Sales CSV
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpiCards.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-4 shadow-sm"
          >
            <p className="text-[11px] font-medium text-[#641B32]/80">
              {k.label}
            </p>
            <p className="mt-1 text-lg font-bold text-[#3D1023]">
              {k.value ?? 0}
            </p>
          </div>
        ))}
      </div>

      {/* 12 Recharts Analytics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="1. Sales & Revenue Trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.sales_revenue_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E7E8" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="gross"
                name="Gross"
                stroke="#C39A52"
                fill="#C39A52"
                fillOpacity={0.25}
              />
              <Area
                type="monotone"
                dataKey="net"
                name="Net"
                stroke="#641B32"
                fill="#641B32"
                fillOpacity={0.35}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="2. Orders by Day & Month">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.orders_by_period || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E7E8" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar
                dataKey="orders"
                name="Orders"
                fill="#641B32"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="3. Order Status Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={charts.order_status_distribution || []}
                dataKey="value"
                nameKey="name"
                outerRadius={85}
                label
              >
                {(charts.order_status_distribution || []).map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="4. Category Sales (INR)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.category_sales || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E7E8" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="sales" fill="#A83F5E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="5. Top-Selling Products">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={charts.top_selling_products || []}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E7E8" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 10 }}
              />
              <Tooltip />
              <Bar dataKey="revenue" fill="#C39A52" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="6. Payment Distribution (COD vs Manual UPI)">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={charts.payment_distribution || []}
                dataKey="amount"
                nameKey="method"
                outerRadius={85}
                label
              >
                {(charts.payment_distribution || []).map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="7. Cancellation Trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={charts.cancellation_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E7E8" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="cancelled"
                stroke="#3D1023"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="8. Refund Trend">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={charts.refund_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E7E8" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#A83F5E"
                fill="#D9A0A9"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="9. New vs Returning Customers">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.customer_retention || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E7E8" />
              <XAxis dataKey="segment" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#A8AD91" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="10. Delivery Partner Performance">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.delivery_performance || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E7E8" />
              <XAxis dataKey="partner" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="delivered" fill="#641B32" />
              <Bar dataKey="active" fill="#C39A52" />
              <Bar dataKey="rejected" fill="#D9A0A9" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="11. Inventory Movements">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.inventory_movements || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E7E8" />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="units" fill="#3D1023" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="12. Sales by State">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.sales_by_state || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5E7E8" />
              <XAxis dataKey="state" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="sales" fill="#641B32" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Low Stock Products List */}
      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[#641B32]">
          <AlertTriangle className="h-4 w-4 text-amber-600" /> Low-Stock
          Products Requiring Restock
        </h3>
        <div className="mt-3 divide-y divide-[#F5E7E8] text-xs">
          {(analytics.low_stock_products || []).map((v) => (
            <div key={v.id} className="flex items-center justify-between py-2">
              <span>
                <strong>{v.product?.name}</strong> ({v.sku} &bull; {v.size})
              </span>
              <span className="font-bold text-red-700">
                {v.stock_qty} left (Threshold: {v.low_stock_threshold})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
