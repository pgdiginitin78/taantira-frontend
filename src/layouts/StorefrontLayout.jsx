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
  ShieldCheck,
  Truck,
  LogOut,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { FALLBACK_CATEGORIES } from '../utils/fallbackCatalog';

const newsletterSchema = yup.object({
  email: yup.string().trim().lowercase().email('Enter a valid email address').required('Email is required'),
});

export default function StorefrontLayout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [promoText, setPromoText] = useState(
    'Complimentary insured shipping above Rs 2,999 • Use code TAANTIRA10 for 10% welcome privilege'
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
      setNewsletterMsg(res.data?.message || 'Welcome to Taantira Atelier updates.');
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
            <Link to="/store" className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-[0.22em] text-[#641B32]">
                TAANTIRA
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#C39A52]">
                Women&apos;s Heritage Couture
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
                placeholder="Search sarees, lehengas, Banarasi, Chanderi..."
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
            <Link
              to="/delivery"
              className="hidden items-center gap-1 rounded-full border border-[#D9A0A9]/60 px-3 py-1.5 text-xs font-medium text-[#641B32] hover:bg-[#F5E7E8] xl:inline-flex"
            >
              <Truck className="h-3.5 w-3.5" /> {isPartner ? 'Partner Hub' : 'Deliver'}
            </Link>
            <Link
              to="/admin"
              className="hidden items-center gap-1 rounded-full border border-[#D9A0A9]/60 px-3 py-1.5 text-xs font-medium text-[#641B32] hover:bg-[#F5E7E8] xl:inline-flex"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> {isAdmin ? 'Admin Portal' : 'Staff'}
            </Link>
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
              <Link
                to="/login"
                className="rounded-full bg-[#641B32] px-4 py-1.5 text-xs font-semibold text-[#FFF9F2] transition hover:bg-[#3D1023]"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Category Navigation */}
        <nav className="hidden border-t border-[#F5E7E8] bg-white/80 lg:block">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-7 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-[#3D1023]">
            <Link to="/collections/new-arrivals" className="text-[#A83F5E] transition hover:text-[#641B32]">
              New Arrivals
            </Link>
            {FALLBACK_CATEGORIES.map((cat) => (
              <Link key={cat.slug} to={`/collections/${cat.slug}`} className="transition hover:text-[#641B32]">
                {cat.name}
              </Link>
            ))}
            <Link to="/collections/festive-collections" className="text-[#C39A52] transition hover:text-[#641B32]">
              Festive Edit
            </Link>
            <Link to="/collections/all" className="transition hover:text-[#641B32]">
              Shop All
            </Link>
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
                placeholder="Search sarees, kurtas, lehengas..."
                className="w-full rounded-lg border border-[#D9A0A9] px-3 py-2 text-sm"
              />
            </form>
            <div className="grid grid-cols-2 gap-2 text-sm font-medium">
              {FALLBACK_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/collections/${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg bg-[#FFF9F2] px-3 py-2 text-[#3D1023]"
                >
                  {cat.name}
                </Link>
              ))}
              <Link to="/collections/festive-collections" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-[#F5E7E8] px-3 py-2 text-[#641B32]">
                Festive Edit
              </Link>
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-[#F5E7E8] px-3 py-2 text-[#641B32]">
                Admin Portal
              </Link>
              <Link to="/delivery" onClick={() => setMobileMenuOpen(false)} className="rounded-lg bg-[#F5E7E8] px-3 py-2 text-[#641B32]">
                Delivery Partner
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
              Handcrafted Indian women&apos;s luxury couture celebrating artisanal silk weaves, mindful tailoring, and timeless heirloom design.
            </p>
            <Link to="/" className="mt-4 inline-block text-xs text-[#C39A52] underline">
              Back to Vite Starter (/)
            </Link>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C39A52]">Collections</h4>
            <ul className="space-y-2 text-xs text-[#F5E7E8]/85">
              <li><Link to="/collections/sarees" className="hover:text-white">Banarasi &amp; Organza Sarees</Link></li>
              <li><Link to="/collections/lehengas" className="hover:text-white">Bridal &amp; Festive Lehengas</Link></li>
              <li><Link to="/collections/suits" className="hover:text-white">Anarkali &amp; Velvet Suits</Link></li>
              <li><Link to="/collections/kurtas" className="hover:text-white">Chanderi Kurta Sets</Link></li>
              <li><Link to="/collections/dresses" className="hover:text-white">Evening Silk Dresses</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C39A52]">Client Services</h4>
            <ul className="space-y-2 text-xs text-[#F5E7E8]/85">
              <li><Link to="/account" className="hover:text-white">Customer Dashboard</Link></li>
              <li><Link to="/account/orders" className="hover:text-white">Track Order &amp; OTP</Link></li>
              <li><Link to="/account/returns" className="hover:text-white">Returns &amp; Exchanges</Link></li>
              <li><Link to="/delivery" className="hover:text-white">Delivery Partner Portal</Link></li>
              <li><Link to="/admin" className="hover:text-white">Staff &amp; Admin Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C39A52]">Atelier Journal</h4>
            <p className="mb-3 text-xs text-[#F5E7E8]/80">
              Receive private trunk-show invitations and seasonal weave releases.
            </p>
            <form onSubmit={handleSubmit(onNewsletterSubmit)} className="space-y-2">
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
          &copy; {new Date().getFullYear()} Taantira Women&apos;s Fashion Atelier. Crafted in India.
        </div>
      </footer>
    </div>
  );
}
