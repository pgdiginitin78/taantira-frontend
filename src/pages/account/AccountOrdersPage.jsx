import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatINR, formatDateTime } from '../../utils/formatters';

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders')
      .then((res) => setOrders(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-2xl bg-white p-6 text-sm text-[#641B32]">Loading orders...</div>;

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">Purchase History</h1>
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-8 text-center text-sm">
          You have not placed any orders yet.
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F5E7E8] pb-3">
              <div>
                <Link to={`/account/orders/${order.id}`} className="text-base font-bold text-[#641B32] hover:underline">
                  {order.order_number}
                </Link>
                <p className="text-xs text-[#641B32]/75">Placed {formatDateTime(order.placed_at)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-[#F5E7E8] px-3 py-1 font-semibold capitalize text-[#641B32]">
                  {order.status.replace(/_/g, ' ')}
                </span>
                <span className="rounded-full border border-[#C39A52] px-3 py-1 font-medium capitalize text-[#3D1023]">
                  {order.payment_method.replace(/_/g, ' ')}: {order.payment_status.replace(/_/g, ' ')}
                </span>
                <span className="text-base font-bold text-[#3D1023]">{formatINR(order.total_amount)}</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                {(order.items || []).map((item) => (
                  <div key={item.id} className="flex items-center gap-2.5 text-xs">
                    <img
                      src={item.image_url || '/assets/products/saree-burgundy.jpg'}
                      alt={item.product_name}
                      className="h-14 w-11 rounded object-cover object-top"
                    />
                    <div>
                      <p className="font-semibold text-[#3D1023]">{item.product_name}</p>
                      <p className="text-[#641B32]/70">{item.size} &times; {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to={`/account/orders/${order.id}`}
                className="rounded-full bg-[#641B32] px-4 py-2 text-xs font-semibold text-[#FFF9F2] hover:bg-[#3D1023]"
              >
                Track &amp; Manage Order
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
