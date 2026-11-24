import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Package, Heart, Award, IndianRupee, Truck, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { formatINR, formatDateOnly } from '../../utils/formatters';
import ProductCard from '../../components/ProductCard';

export default function AccountOverviewPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/users/dashboard')
      .then((res) => setData(res.data?.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load customer dashboard.'));
  }, []);

  if (error) {
    return <div className="rounded-2xl border border-[#D9A0A9] bg-white p-6 text-sm text-[#641B32]">{error}</div>;
  }

  if (!data) {
    return <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-8 text-sm text-[#641B32]">Loading your Taantira dashboard...</div>;
  }

  const stats = [
    { label: 'Total Orders', value: data.stats.total_orders, icon: Package },
    { label: 'Total Spending', value: formatINR(data.stats.total_spending), icon: IndianRupee },
    { label: 'Wishlist Pieces', value: data.stats.wishlist_count, icon: Heart },
    { label: 'Loyalty Points', value: data.stats.loyalty_points, icon: Award },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[#641B32] p-6 text-[#FFF9F2] shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-[#C39A52]">Taantira Client Atelier</p>
        <h1 className="mt-1 font-serif text-2xl font-bold">Welcome back, {data.user?.full_name}</h1>
        <p className="mt-1 text-xs text-[#F5E7E8]/85">
          Manage your active deliveries, saved addresses, loyalty rewards, and curated wardrobe recommendations.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-4 shadow-sm">
            <Icon className="h-5 w-5 text-[#A83F5E]" />
            <p className="mt-2 text-xs text-[#641B32]/80">{label}</p>
            <p className="mt-1 text-xl font-bold text-[#3D1023]">{value}</p>
          </div>
        ))}
      </div>

      {/* Active Delivery Card */}
      {data.active_delivery_order && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#C39A52] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5E7E8] text-[#641B32]">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#A83F5E]">Current Active Order</p>
              <p className="text-sm font-bold text-[#3D1023]">
                {data.active_delivery_order.order_number} &bull; Status: <span className="capitalize">{data.active_delivery_order.status.replace(/_/g, ' ')}</span>
              </p>
            </div>
          </div>
          <Link
            to={`/account/orders/${data.active_delivery_order.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#641B32] px-4 py-2 text-xs font-semibold text-[#FFF9F2]"
          >
            Live Track &amp; View OTP <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Monthly Spending Recharts Chart */}
      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#3D1023]">Monthly Spending Overview</h2>
        <div className="mt-4 h-64 w-full">
          {data.monthly_spending?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly_spending}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5E7E8" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#3D1023' }} />
                <YAxis tick={{ fontSize: 12, fill: '#3D1023' }} />
                <Tooltip />
                <Area type="monotone" dataKey="spending" stroke="#641B32" fill="#D9A0A9" fillOpacity={0.45} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#641B32]/70">
              Place your first order to see monthly spending trends.
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#3D1023]">Recent Purchases</h2>
          <Link to="/account/orders" className="text-xs font-semibold text-[#A83F5E] hover:underline">
            View All Orders
          </Link>
        </div>
        <div className="divide-y divide-[#F5E7E8]">
          {(data.recent_orders || []).map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div>
                <Link to={`/account/orders/${o.id}`} className="font-semibold text-[#641B32] hover:underline">
                  {o.order_number}
                </Link>
                <p className="text-xs text-[#641B32]/70">{formatDateOnly(o.placed_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-[#F5E7E8] px-2.5 py-0.5 text-xs font-medium capitalize text-[#641B32]">
                  {o.status.replace(/_/g, ' ')}
                </span>
                <span className="font-bold text-[#3D1023]">{formatINR(o.total_amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Products */}
      {data.recommended_products?.length > 0 && (
        <div>
          <h2 className="mb-4 font-serif text-xl font-bold text-[#3D1023]">Curated For Your Wardrobe</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.recommended_products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
