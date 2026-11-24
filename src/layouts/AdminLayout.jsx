import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  ShoppingBag,
  Boxes,
  ClipboardList,
  TicketPercent,
  CreditCard,
  RotateCcw,
  Users,
  Truck,
  FileSpreadsheet,
  Settings,
  LogOut,
  ExternalLink,
  FolderTree,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const ADMIN_NAV = [
  { to: '/admin', label: 'Analytics Dashboard', icon: BarChart3, perm: 'admin.dashboard.view', end: true },
  { to: '/admin/categories', label: 'Main Categories', icon: FolderTree, superAdminOnly: true },
  { to: '/admin/subcategories', label: 'Subcategories', icon: Layers, superAdminOnly: true },
  { to: '/admin/products', label: 'Products & 5-Angle Photos', icon: ShoppingBag, superAdminOnly: true },
  { to: '/admin/inventory', label: 'Inventory & Alerts', icon: Boxes, perm: 'inventory.manage' },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList, perm: 'orders.manage' },
  { to: '/admin/coupons', label: 'Coupons & Marketing', icon: TicketPercent, perm: 'marketing.manage' },
  { to: '/admin/payments', label: 'Payments & Refunds', icon: CreditCard, perm: 'payments.manage' },
  { to: '/admin/returns', label: 'Returns & Support', icon: RotateCcw, perm: 'support.manage' },
  { to: '/admin/customers', label: 'Customers', icon: Users, perm: 'customers.manage' },
  { to: '/admin/delivery', label: 'Delivery & Couriers', icon: Truck, perm: 'delivery.manage' },
  { to: '/admin/reports', label: 'Reports & CSV', icon: FileSpreadsheet, perm: 'reports.view' },
  { to: '/admin/settings', label: 'Staff & Settings', icon: Settings, perm: 'settings.manage' },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const isSuperAdmin = (user?.roles || []).includes('super_admin');
  const perms = new Set(user?.permissions || []);

  const visibleNav = ADMIN_NAV.filter((item) =>
    item.superAdminOnly ? isSuperAdmin : isSuperAdmin || perms.has(item.perm)
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#FFF9F2] text-[#3D1023] lg:flex-row">
      <aside className="w-full border-b border-[#D9A0A9]/40 bg-[#3D1023] text-[#FFF9F2] lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-[#641B32] px-5 py-4">
          <div>
            <p className="font-serif text-lg font-bold tracking-[0.2em]">TAANTIRA</p>
            <p className="text-[11px] uppercase tracking-wider text-[#C39A52]">Admin Operations</p>
          </div>
          <Link to="/store" title="View Storefront" className="rounded-lg p-1.5 text-[#F5E7E8] hover:bg-[#641B32]">
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="border-b border-[#641B32] px-5 py-3 text-xs">
          <p className="font-semibold text-[#FFF9F2]">{user?.full_name}</p>
          <p className="mt-0.5 text-[11px] capitalize text-[#D9A0A9]">
            {(user?.roles || []).join(', ').replace(/_/g, ' ')}
          </p>
        </div>

        <nav className="flex flex-wrap gap-1 p-3 lg:flex-col">
          {visibleNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                  isActive
                    ? 'bg-[#C39A52] font-semibold text-[#3D1023]'
                    : 'text-[#F5E7E8]/90 hover:bg-[#641B32]'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 lg:mt-auto">
          <button
            type="button"
            onClick={logout}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#D9A0A9]/30 px-3 py-2 text-xs font-medium text-[#F5E7E8] hover:bg-[#641B32]"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
