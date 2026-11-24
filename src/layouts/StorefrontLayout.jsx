import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  AlertCircle,
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  LogOut,
  Sparkles,
  Camera,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";
import { useWishlistStore } from "../store/useWishlistStore";
import { useToastStore } from "../store/useToastStore";

const newsletterSchema = yup.object({
  email: yup
    .string()
    .trim()
    .lowercase()
    .email("Enter a valid email address")
    .required("Email is required"),
});

const STORE_NAV_LINKS = [
  { to: "/collections/new-arrivals", label: "NEW ARRIVALS", mainSlug: null },
  { to: "/collections/sarees", label: "ALL SAREES", mainSlug: null },
  {
    to: "/collections/banarasi-sarees",
    label: "BANARASI",
    mainSlug: "banarasi-sarees",
  },
  {
    to: "/collections/kanjivaram-sarees",
    label: "KANJIVARAM",
    mainSlug: "kanjivaram-sarees",
  },
  {
    to: "/collections/paithani-tussar-sarees",
    label: "PAITHANI & TUSSAR",
    mainSlug: "paithani-tussar-sarees",
  },
  {
    to: "/collections/organza-georgette-sarees",
    label: "ORGANZA & GEORGETTE",
    mainSlug: "organza-georgette-sarees",
  },
  {
    to: "/collections/jamdani-chanderi-sarees",
    label: "JAMDANI & CHANDERI",
    mainSlug: "jamdani-chanderi-sarees",
  },
  {
    to: "/collections/nauvari-sarees",
    label: "NAUVARI (9 VAARI)",
    mainSlug: "nauvari-sarees",
  },
  { to: "/collections/jewellery", label: "SAREE JEWELLERY", mainSlug: null },
  {
    to: "/collections/festive-collections",
    label: "FESTIVE EDIT",
    mainSlug: null,
  },
];

export default function StorefrontLayout() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, fetchCart } = useCartStore();
  const wishlistItems = useWishlistStore((s) => s.items);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const { toasts, dismissToast } = useToastStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subcategoriesByMain, setSubcategoriesByMain] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState({
    products: [],
    categories: [],
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [promoText, setPromoText] = useState(
    "Complimentary insured shipping on orders above ₹ 2,999  |  Use code TAANTIRA10 for 10% welcome privilege",
  );
  const [newsletterMsg, setNewsletterMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(newsletterSchema) });

  useEffect(() => {
    fetchCart().catch(() => {});
    fetchWishlist().catch(() => {});
  }, [isAuthenticated, fetchCart, fetchWishlist]);

  useEffect(() => {
    api
      .get("/products/homepage")
      .then((res) => {
        const d = res.data?.data;
        const bar = d?.promotional_bar;
        if (bar?.message) setPromoText(bar.message);
        if (Array.isArray(d?.categories)) {
          const grouped = {};
          for (const cat of d.categories) {
            if (!cat.parent_id && cat.slug) {
              grouped[cat.slug] = cat.children || [];
            }
          }
          setSubcategoriesByMain(grouped);
        }
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
        .get("/products/search/suggestions", { params: { q: trimmed } })
        .then((res) => {
          setSuggestions(res.data?.data || { products: [], categories: [] });
          setShowSuggestions(true);
        })
        .catch(() => {
          setSuggestions({ products: [], categories: [] });
        });
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
    setNewsletterMsg("");
    try {
      const res = await api.post("/users/newsletter", values);
      setNewsletterMsg(
        res.data?.message || "Welcome to Taantira Saree Atelier.",
      );
      reset();
    } catch (err) {
      setNewsletterMsg(
        err.response?.data?.message || "Unable to subscribe right now.",
      );
    }
  };

  const bagCount = items.reduce(
    (sum, item) => sum + Number(item.quantity || 1),
    0,
  );
  const wishlistCount = wishlistItems.length;
  const isAdmin = (user?.roles || []).some(
    (r) => r !== "customer" && r !== "delivery_partner",
  );
  const isPartner = (user?.roles || []).includes("delivery_partner");

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#FFF9F2] text-[#3D1023]">
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-5 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2.5 sm:bottom-6 sm:right-6"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              data-testid="global-toast"
              className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#C39A52]/60 bg-white/95 p-3 shadow-2xl backdrop-blur-md transition-all"
            >
              {toast.imageUrl ? (
                <img
                  src={toast.imageUrl}
                  alt={toast.subtitle || toast.title}
                  className="h-14 w-12 shrink-0 rounded-xl border border-[#D9A0A9]/40 object-cover object-top"
                />
              ) : (
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    toast.type === "error"
                      ? "bg-rose-50 text-rose-700"
                      : toast.type === "wishlist"
                        ? "bg-[#F5E7E8] text-[#641B32]"
                        : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {toast.type === "error" ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : toast.type === "wishlist" ? (
                    <Heart className="h-5 w-5 fill-[#641B32] text-[#641B32]" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-[#3D1023]">
                    {toast.title}
                  </p>
                  {toast.badgeText && (
                    <span className="rounded-full bg-[#641B32] px-2 py-0.5 text-[10px] font-semibold text-[#FFF9F2]">
                      {toast.badgeText}
                    </span>
                  )}
                </div>
                {toast.subtitle && (
                  <p className="mt-0.5 truncate text-xs text-[#641B32]/85">
                    {toast.subtitle}
                  </p>
                )}
                {toast.actionTo && toast.actionLabel && (
                  <Link
                    to={toast.actionTo}
                    onClick={() => dismissToast(toast.id)}
                    className="mt-1 inline-block text-[11px] font-bold text-[#A83F5E] underline underline-offset-2 hover:text-[#641B32]"
                  >
                    {toast.actionLabel} &rarr;
                  </Link>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 cursor-pointer rounded-full p-1 text-[#641B32]/60 hover:bg-[#F5E7E8] hover:text-[#3D1023]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Promotional Top Bar (Exact Reference Style) */}
      <div className="bg-[#3D1023] px-4 py-2 text-center text-[11px] font-medium tracking-wide text-[#FFF9F2] sm:text-xs">
        <span className="inline-flex flex-wrap items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#C39A52]" />
          <span>{promoText}</span>
          <Sparkles className="h-3.5 w-3.5 text-[#C39A52]" />
        </span>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-[#D9A0A9]/35 bg-[#FFF9F2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-3.5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="cursor-pointer rounded-lg p-1.5 text-[#641B32] hover:bg-[#F5E7E8] lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <Link to="/" className="flex flex-col">
              <span className="font-serif text-xl font-bold tracking-[0.24em] text-[#641B32] sm:text-2xl">
                TAANTIRA
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-[#A83F5E]/85 sm:text-[10px]">
                Handloom Sarees &amp; Jewellery
              </span>
            </Link>
          </div>

          {/* Center Pill Search Input */}
          <div className="relative hidden max-w-md flex-1 md:block">
            <form onSubmit={onSearchSubmit} className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#641B32]/55" />
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
                onFocus={() =>
                  searchQuery.trim().length >= 2 && setShowSuggestions(true)
                }
                onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                placeholder="Search Banarasi, Kanjivaram, Paithani, Sarees & Jewellery..."
                className="w-full rounded-full border border-[#D9A0A9]/60 bg-white py-2 pl-10 pr-4 text-xs text-[#3D1023] placeholder-[#641B32]/50 focus:border-[#641B32] focus:outline-none sm:text-sm"
              />
            </form>

            {showSuggestions &&
              (suggestions.products?.length > 0 ||
                suggestions.categories?.length > 0) && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[#D9A0A9]/50 bg-white shadow-xl">
                  {suggestions.categories?.length > 0 && (
                    <div className="border-b border-[#F5E7E8] px-4 py-2">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#A83F5E]">
                        Categories
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.categories.map((cat) => (
                          <Link
                            key={cat.id || cat.slug}
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
                          key={prod.id || prod.slug}
                          to={`/products/${prod.slug}`}
                          className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-[#FFF9F2]"
                        >
                          {prod.images?.[0]?.image_url ? (
                            <img
                              src={prod.images[0].image_url}
                              alt={prod.name}
                              className="h-11 w-9 rounded object-cover object-top"
                            />
                          ) : (
                            <div className="flex h-11 w-9 items-center justify-center rounded bg-[#F5E7E8] text-[#641B32]">
                              <Camera className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-[#3D1023]">
                              {prod.name}
                            </p>
                            <p className="text-[11px] text-[#A83F5E]">
                              {prod.fabric}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Right Action Icons & Auth Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden whitespace-nowrap rounded-full border border-[#D9A0A9]/70 bg-white px-3 py-1.5 text-xs font-medium text-[#641B32] hover:bg-[#F5E7E8] sm:inline-flex"
              >
                Admin Portal
              </Link>
            )}
            {isPartner && (
              <Link
                to="/delivery"
                className="hidden whitespace-nowrap rounded-full border border-[#D9A0A9]/70 bg-white px-3 py-1.5 text-xs font-medium text-[#641B32] hover:bg-[#F5E7E8] sm:inline-flex"
              >
                Partner Hub
              </Link>
            )}
            <Link
              to={isAuthenticated ? "/account/wishlist" : "/wishlist"}
              className="relative rounded-full p-2 text-[#641B32] transition hover:bg-[#F5E7E8]"
              aria-label="Wishlist"
            >
              <Heart
                className={`h-5 w-5 ${wishlistCount > 0 ? "fill-[#641B32]" : ""}`}
              />
              {wishlistCount > 0 && (
                <span
                  data-testid="wishlist-count-badge"
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C39A52] px-1 text-[10px] font-bold text-[#3D1023]"
                >
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              className="relative rounded-full p-2 text-[#641B32] transition hover:bg-[#F5E7E8]"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="h-5 w-5" />
              {bagCount > 0 && (
                <span
                  data-testid="cart-count-badge"
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#641B32] px-1 text-[10px] font-bold text-[#FFF9F2]"
                >
                  {bagCount}
                </span>
              )}
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/account"
                  className="inline-flex whitespace-nowrap items-center gap-1.5 rounded-full bg-[#641B32] px-3.5 py-1.5 text-xs font-semibold text-[#FFF9F2] hover:bg-[#3D1023]"
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {user.full_name?.split(" ")[0]}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign out"
                  className="cursor-pointer rounded-full p-2 text-[#641B32] hover:bg-[#F5E7E8]"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/login"
                  className="whitespace-nowrap rounded-full bg-[#641B32] px-3.5 py-1.5 text-xs font-semibold text-[#FFF9F2] transition hover:bg-[#3D1023] sm:px-4"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden whitespace-nowrap rounded-full border border-[#D9A0A9] bg-white px-4 py-1.5 text-xs font-semibold text-[#641B32] transition hover:bg-[#F5E7E8] sm:inline-flex"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Exact Reference Category Navigation Bar with Dropdowns */}
        <nav className="hidden border-t border-[#D9A0A9]/25 bg-white lg:block">
          <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#3D1023] xl:gap-6">
            {STORE_NAV_LINKS.map((item) => {
              const subs = item.mainSlug
                ? subcategoriesByMain[item.mainSlug] || []
                : [];
              return (
                <div key={item.to} className="group relative">
                  <Link
                    to={item.to}
                    className="inline-flex items-center gap-1 whitespace-nowrap py-0.5 text-[#3D1023] transition hover:text-[#641B32]"
                  >
                    <span>{item.label}</span>
                    {subs.length > 0 && (
                      <ChevronDown className="h-3 w-3 text-[#641B32]/70" />
                    )}
                  </Link>
                  {subs.length > 0 && (
                    <div className="invisible absolute left-0 top-full z-50 w-56 rounded-xl border border-[#D9A0A9]/40 bg-white py-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                      <Link
                        to={item.to}
                        className="block border-b border-[#F5E7E8] px-4 py-2 text-[11px] font-bold text-[#641B32] hover:bg-[#FFF9F2]"
                      >
                        All {item.label}
                      </Link>
                      {subs.map((sub) => (
                        <Link
                          key={sub.slug}
                          to={`/collections/${item.mainSlug}?subcategories=${encodeURIComponent(sub.slug)}`}
                          className="block px-4 py-1.5 text-[11px] font-medium normal-case tracking-normal text-[#3D1023] hover:bg-[#FFF9F2] hover:text-[#641B32]"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
              <Link
                to="/collections/regional-handloom-sarees"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-[#FFF9F2] px-3 py-2 text-[#3D1023]"
              >
                REGIONAL HANDLOOM
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-[#F5E7E8] px-3 py-2 text-[#641B32]"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg bg-[#F5E7E8] px-3 py-2 text-[#641B32]"
              >
                Register
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
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-14 md:grid-cols-4">
          <div className="md:col-span-1">
            <h3 className="font-serif text-xl font-bold tracking-[0.2em] text-[#FFF9F2]">
              TAANTIRA
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-[#F5E7E8]/80">
              Dedicated to Indian handloom sarees (90% curated weaves) paired
              with heirloom saree jewellery (10% curated capsule).
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C39A52]">
              Sarees &amp; Jewellery
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-[#F5E7E8]/85">
              <li>
                <Link
                  to="/collections/banarasi-sarees"
                  className="hover:text-white"
                >
                  Banarasi Silk Sarees
                </Link>
              </li>
              <li>
                <Link
                  to="/collections/kanjivaram-sarees"
                  className="hover:text-white"
                >
                  Kanjivaram Silk Sarees
                </Link>
              </li>
              <li>
                <Link
                  to="/collections/paithani-tussar-sarees"
                  className="hover:text-white"
                >
                  Paithani &amp; Tussar Sarees
                </Link>
              </li>
              <li>
                <Link
                  to="/collections/organza-georgette-sarees"
                  className="hover:text-white"
                >
                  Organza &amp; Georgette Sarees
                </Link>
              </li>
              <li>
                <Link
                  to="/collections/jamdani-chanderi-sarees"
                  className="hover:text-white"
                >
                  Jamdani &amp; Chanderi Sarees
                </Link>
              </li>
              <li>
                <Link
                  to="/collections/nauvari-sarees"
                  className="hover:text-white"
                >
                  Nauvari / 9 Vaari Sarees
                </Link>
              </li>
              <li>
                <Link
                  to="/collections/jewellery"
                  className="text-[#C39A52] hover:text-white"
                >
                  Saree Jewellery Capsule
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C39A52]">
              Client &amp; Partner Portals
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-[#F5E7E8]/85">
              <li>
                <Link to="/account" className="hover:text-white">
                  Customer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/account/orders" className="hover:text-white">
                  Track Order &amp; Delivery OTP
                </Link>
              </li>
              <li>
                <Link to="/account/returns" className="hover:text-white">
                  Returns &amp; Exchanges
                </Link>
              </li>
              <li>
                <Link to="/delivery" className="hover:text-white">
                  Delivery Partner Portal
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white">
                  Admin &amp; Staff Portal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#C39A52]">
              Atelier Journal
            </h4>
            <p className="mb-3 text-xs text-[#F5E7E8]/80">
              Receive private weave previews and seasonal heirloom releases.
            </p>
            <form
              onSubmit={handleSubmit(onNewsletterSubmit)}
              className="flex flex-col gap-2"
            >
              <input
                type="email"
                {...register("email")}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-[#D9A0A9]/40 bg-[#641B32] px-3 py-2 text-xs text-[#FFF9F2] placeholder-[#F5E7E8]/60 focus:border-[#C39A52] focus:outline-none"
              />
              {errors.email && (
                <p className="text-[11px] text-[#D9A0A9]">
                  {errors.email.message}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cursor-pointer rounded-lg bg-[#C39A52] px-4 py-2 text-xs font-semibold text-[#3D1023] transition hover:bg-[#D9A0A9] disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
              {newsletterMsg && (
                <p className="text-[11px] text-[#C39A52]">{newsletterMsg}</p>
              )}
            </form>
          </div>
        </div>
        <div className="border-t border-[#641B32] px-6 py-4 text-center text-[11px] text-[#F5E7E8]/70">
          &copy; {new Date().getFullYear()} Taantira Handloom Sarees &amp;
          Jewellery Atelier. Crafted in India.
        </div>
      </footer>
    </div>
  );
}
