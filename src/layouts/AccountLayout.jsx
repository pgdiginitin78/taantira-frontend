import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  RotateCcw,
  UserCheck,
  CreditCard,
  Star,
  Bell,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/addresses', label: 'Saved Addresses', icon: MapPin },
  { to: '/account/returns', label: 'Returns & Exchanges', icon: RotateCcw },
  { to: '/account/payments', label: 'Payments & UPI', icon: CreditCard },
  { to: '/account/reviews', label: 'Reviews & Support', icon: Star },
  { to: '/account/notifications', label: 'Notifications', icon: Bell },
  { to: '/account/profile', label: 'Profile Settings', icon: UserCheck },
];

export default function AccountLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-4 shadow-sm">
            <p className="mb-3 px-2 text-xs font-bold uppercase tracking-widest text-[#A83F5E]">
              Customer Account
            </p>
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-[#641B32] text-[#FFF9F2]'
                        : 'text-[#3D1023] hover:bg-[#F5E7E8]'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
        <section className="lg:col-span-9">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
