import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

const newsletterSchema = yup.object({
  email: yup.string().trim().lowercase().email('Enter a valid email address').required('Email is required'),
});

const STORE_NAV_LINKS = [
  { to: '/collections/new-arrivals', label: 'New Arrivals', accent: 'text-[#A83F5E]' },
  { to: '/collections/sarees', label: 'All Sarees (90%)', accent: 'text-[#641B32] font-bold' },
  { to: '/collections/banarasi-sarees', label: 'Banarasi', accent: 'text-[#3D1023]' },
  { to: '/collections/kanjivaram-sarees', label: 'Kanjivaram', accent: 'text-[#3D1023]' },
  { to: '/collections/paithani-tussar-sarees', label: 'Paithani & Tussar', accent: 'text-[#3D1023]' },
  { to: '/collections/organza-georgette-sarees', label: 'Organza & Georgette', accent: 'text-[#3D1023]' },
  { to: '/collections/jamdani-handloom-sarees', label: 'Jamdani & Chanderi', accent: 'text-[#3D1023]' },
  { to: '/collections/jewellery', label: 'Saree Jewellery (10%)', accent: 'text-[#C39A52]' },
  { to: '/collections/festive-collections', label: 'Festive Edit', accent: 'text-[#3D1023]' },
];

export default function StorefrontLayout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [promoText, setPromoText] = useState(
    'Complimentary insured shipping on sarees above Rs 2,999 • Use code TAANTIRA10 for 10% welcome privilege'
  );
  const [newsletterMsg, setNewsletterMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(newsletterSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    api
      .get('/products/homepage')
      .then((res) => {
        const bar = res.data?.data?.promotional_bar;
        if (bar?.message) setPromoText(bar.message);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      return undefined;
    }
    const timer = setTimeout(() => {
      api
        .get('/products/search/suggestions', { params: { q: trimmed } })
        .then((res) => {
          setSuggestions(res.data?.data || { products: [], categories: [] });
          setShowSuggestions(true);
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/collections/all?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const onNewsletterSubmit = async (values) => {
    setNewsletterMsg('');
    try {
      const res = await api.post('/users/newsletter', values);
      setNewsletterMsg(res.data?.message || 'Welcome to Taantira Saree Atelier.');
      reset();
    } catch (err) {
      setNewsletterMsg(err.response?.data?.message || 'Unable to subscribe right now.');
    }
  };

  const bagCount = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
  const isAdmin = (user?.roles || []).some((r) => r !== 'customer' && r !== 'delivery_partner');
  const isPartner = (user?.roles || []).includes('delivery_partner');

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#FFF9F2] text-[#3D1023]">
      {/* Promotional Bar */}
      <div className="bg-[#3D1023] px-4 py-2 text-center text-xs font-medium tracking-wide text-[#FFF9F2]">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#C39A52]" />
          {promoText}
        </span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-[#D9A0A9]/40 bg-[#FFF9F2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="rounded-lg p-2 text-[#641B32] hover:bg-[#F5E7E8] lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/" className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-[0.22em] text-[#641B32]">
                TAANTIRA
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#C39A52]">
                Handloom Sarees &amp; Jewellery
              </span>
            </Link>
          </div>

          {/* Live Search Bar with Suggestions */}
          <div className="relative hidden max-w-md flex-1 md:block">
            <form onSubmit={onSearchSubmit} className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#641B32]/60" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchQuery(val);
                  if (val.trim().length < 2) {
                    setSuggestions({ products: [], categories: [] });
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                placeholder="Search Banarasi, Kanjivaram, Paithani sarees & jewellery..."
                className="w-full rounded-full border border-[#D9A0A9]/60 bg-white py-2 pl-10 pr-4 text-sm text-[#3D1023] placeholder-[#641B32]/50 focus:border-[#641B32] focus:outline-none"
              />
            </form>

            {showSuggestions && (suggestions.products?.length > 0 || suggestions.categories?.length > 0) && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#D9A0A9]/50 bg-white shadow-xl">
                {suggestions.categories?.length > 0 && (
                  <div className="border-b border-[#F5E7E8] px-4 py-2">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#A83F5E]">Categories</p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.categories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/collections/${cat.slug}`}
                          className="rounded-full bg-[#F5E7E8] px-3 py-1 text-xs font-medium text-[#641B32] hover:bg-[#D9A0A9]/40"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {suggestions.products?.length > 0 && (
                  <div className="divide-y divide-[#F5E7E8]">
                    {suggestions.products.map((prod) => (
                      <Link
                        key={prod.id}
                        to={`/products/${prod.slug}`}
                        className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-[#FFF9F2]"
                      >
                        <img
                          src={prod.images?.[0]?.image_url || '/assets/products/saree-burgundy.jpg'}
                          alt={prod.name}
                          className="h-11 w-9 rounded object-cover object-top"
                        />
                        <div>
                          <p className="text-xs font-semibold text-[#3D1023]">{prod.name}</p>
                          <p className="text-[11px] text-[#A83F5E]">{prod.fabric}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden rounded-full border border-[#D9A0A9]/60 px-3 py-1.5 text-xs font-medium text-[#641B32] hover:bg-[#F5E7E8] sm:inline-flex"
              >
                Admin Portal
              </Link>
            )}
            {isPartner && (
              <Link
                to="/delivery"
                className="hidden rounded-full border border-[#D9A0A9]/60 px-3 py-1.5 text-xs font-medium text-[#641B32] hover:bg-[#F5E7E8] sm:inline-flex"
              >
                Partner Hub
              </Link>
            )}
            <Link
              to="/account/wishlist"
              className="rounded-full p-2 text-[#641B32] transition hover:bg-[#F5E7E8]"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>
            <Link
              to="/cart"
              className="relative rounded-full p-2 text-[#641B32] transition hover:bg-[#F5E7E8]"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="h-5 w-5" />
              {bagCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#641B32] text-[10px] font-bold text-[#FFF9F2]">
                  {bagCount}
                </span>
              )}
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/account"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#641B32] px-3.5 py-1.5 text-xs font-semibold text-[#FFF9F2] hover:bg-[#3D1023]"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{user.full_name?.split(' ')[0]}</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign out"
                  className="rounded-full p-2 text-[#641B32] hover:bg-[#F5E7E8]"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-full bg-[#641B32] px-4 py-1.5 text-xs font-semibold text-[#FFF9F2] transition hover:bg-[#3D1023]"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden rounded-full border border-[#641B32]/40 px-4 py-1.5 text-xs font-semibold text-[#641B32] transition hover:bg-[#F5E7E8] sm:inline-flex"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Saree & Jewellery Category Navigation */}
        <nav className="hidden border-t border-[#F5E7E8] bg-white/85 lg:block">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-widest">
            {STORE_NAV_LINKS.map((item) => (
              <Link key={item.to} to={item.to} className={`transition hover:text-[#641B32] ${item.accent}`}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-[#F5E7E8] bg-white px-4 py-4 lg:hidden">
            <form onSubmit={onSearchSubmit} className="mb-3">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sarees & jewellery..."
                className="w-full rounded-lg border border-[#D9A0A9] px-3 py-2 text-sm"
              />
            </form>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              {STORE_NAV_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-[#FFF9F2] px-3 py-2 text-[#3D1023]"
                >
                  {item.label}
                </Link>
              ))}
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-[#F5E7E8] px-3 py-2 text-[#641B32]">
                Sign In
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-[#F5E7E8] px-3 py-2 text-[#641B32]">
                Create Account
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer with Newsletter */}
      <footer className="border-t border-[#C39A52]/30 bg-[#3D1023] text-[#FFF9F2]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-4">
          <div className="md:col-span-1">
            <h3 className="font-serif text-xl font-bold tracking-[0.2em] text-[#FFF9F2]">TAANTIRA</h3>
            <p className="mt-3 text-xs leading-relaxed text-[#F5E7E8]/80">
              Dedicated to Indian handloom sarees (90% curated weaves) paired with heirloom saree jewellery (10% curated capsule).
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C39A52]">Sarees &amp; Jewellery</h4>
            <ul className="flex flex-col gap-2 text-xs text-[#F5E7E8]/85">
              <li><Link to="/collections/banarasi-sarees" className="hover:text-white">Banarasi Silk Sarees</Link></li>
              <li><Link to="/collections/kanjivaram-sarees" className="hover:text-white">Kanjivaram Silk Sarees</Link></li>
              <li><Link to="/collections/paithani-tussar-sarees" className="hover:text-white">Paithani &amp; Tussar Sarees</Link></li>
              <li><Link to="/collections/organza-georgette-sarees" className="hover:text-white">Organza &amp; Georgette Sarees</Link></li>
              <li><Link to="/collections/jamdani-handloom-sarees" className="hover:text-white">Jamdani &amp; Chanderi Sarees</Link></li>
              <li><Link to="/collections/jewellery" className="text-[#C39A52] hover:text-white">Saree Jewellery Capsule</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C39A52]">Client &amp; Partner Portals</h4>
            <ul className="flex flex-col gap-2 text-xs text-[#F5E7E8]/85">
              <li><Link to="/account" className="hover:text-white">Customer Dashboard</Link></li>
              <li><Link to="/account/orders" className="hover:text-white">Track Order &amp; Delivery OTP</Link></li>
              <li><Link to="/account/returns" className="hover:text-white">Returns &amp; Exchanges</Link></li>
              <li><Link to="/delivery" className="hover:text-white">Delivery Partner Portal</Link></li>
              <li><Link to="/admin" className="hover:text-white">Admin &amp; Staff Portal</Link></li>
              <li><Link to="/starter" className="text-[#D9A0A9] hover:text-white">Vite Starter Reference</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C39A52]">Atelier Journal</h4>
            <p className="mb-3 text-xs text-[#F5E7E8]/80">
              Receive private weave previews and seasonal heirloom releases.
            </p>
            <form onSubmit={handleSubmit(onNewsletterSubmit)} className="flex flex-col gap-2">
              <input
                type="email"
                {...register('email')}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-[#D9A0A9]/40 bg-[#641B32] px-3 py-2 text-xs text-[#FFF9F2] placeholder-[#F5E7E8]/60 focus:border-[#C39A52] focus:outline-none"
              />
              {errors.email && <p className="text-[11px] text-[#D9A0A9]">{errors.email.message}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-[#C39A52] px-4 py-2 text-xs font-semibold text-[#3D1023] transition hover:bg-[#D9A0A9]"
              >
                {isSubmitting ? 'Subscribing...' : 'Subscribe'}
              </button>
              {newsletterMsg && <p className="text-[11px] text-[#C39A52]">{newsletterMsg}</p>}
            </form>
          </div>
        </div>
        <div className="border-t border-[#641B32] px-6 py-4 text-center text-[11px] text-[#F5E7E8]/70">
          &copy; {new Date().getFullYear()} Taantira Handloom Sarees &amp; Jewellery Atelier. Crafted in India.
        </div>
      </footer>
    </div>
  );
}
