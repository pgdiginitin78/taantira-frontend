import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Gem,
  Grid,
  Leaf,
  RefreshCw,
  Truck,
} from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import { useWishlistStore } from "../store/useWishlistStore";
import { useCartStore } from "../store/useCartStore";

const formatBannerHeading = (rawTitle = "") => {
  const words = String(rawTitle || "Timeless Indian Weaves").trim().split(/\s+/);
  if (words.length <= 1) {
    return { line1: words[0] || "Timeless", line2: "", italic: "" };
  }
  if (words.length === 2) {
    return { line1: words[0], line2: "", italic: words[1] };
  }
  return {
    line1: words[0],
    line2: words.slice(1, -1).join(" "),
    italic: words[words.length - 1],
  };
};

function SectionHeader({ eyebrow, title, linkTo, linkLabel = "View All" }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A83F5E]">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-serif text-2xl font-bold text-[#3D1023] sm:text-3xl">
          {title}
        </h2>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#641B32] transition hover:text-[#A83F5E]"
        >
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const wishlistItems = useWishlistStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const addItem = useCartStore((s) => s.addItem);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [slideIdx, setSlideIdx] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const wishlistedIds = new Set(
    wishlistItems.map((entry) => Number(entry.id || entry.product?.id)),
  );

  const fetchHomepage = useCallback(async () => {
    try {
      const res = await api.get("/products/homepage");
      setData(res.data?.data || null);
      setLoadError("");
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
          "Unable to load live storefront catalogue from database.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get("/products/homepage")
      .then((res) => {
        if (!active) return;
        setData(res.data?.data || null);
        setLoadError("");
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(
          err.response?.data?.message ||
            "Unable to load live storefront catalogue from database.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const loadHomepage = () => {
    setLoading(true);
    setLoadError("");
    fetchHomepage();
  };

  const handleToggleWishlist = (product) => {
    Promise.resolve(toggleWishlist(product)).catch(() => {});
  };

  const handleQuickAddToCart = async (product) => {
    const variant = product?.variants?.[0];
    if (!variant) return;
    return addItem({
      product_id: product.id,
      variant_id: variant.id,
      quantity: 1,
      productPreview: product,
    });
  };

  const banners = data?.banners || [];
  const safeSlideIdx = banners.length > 0 ? slideIdx % banners.length : 0;
  const activeBanner = banners[safeSlideIdx] || null;
  const headingParts = formatBannerHeading(activeBanner?.title);
  const categories = data?.categories || [];
  const showcases = data?.category_showcases || {};
  const nauvariCategory = categories.find((c) => c.slug === "nauvari-sarees");
  const nauvariSubcategories = nauvariCategory?.children || [];
  const nauvariList = data?.nauvari_sarees || showcases.nauvari || [];
  const handwovenList = showcases.sarees || data?.handwoven_sarees || [];
  const jewelleryList = showcases.jewellery || data?.jewellery_products || [];
  const realBestSellers = data?.best_sellers || [];

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Full-Bleed Editorial Hero Section Loaded From Database Banners Table */}
      <section className="relative w-full overflow-hidden bg-[#3D1023]">
        {activeBanner ? (
          <>
            <img
              src={activeBanner.image_url}
              alt={activeBanner.title}
              className="absolute inset-0 h-full w-full object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#3D1023] via-[#3D1023]/85 to-[#3D1023]/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3D1023]/55 via-transparent to-transparent" />

            <div className="relative z-10 mx-auto flex min-h-[480px] max-w-[1440px] flex-col justify-between px-6 py-8 sm:min-h-[540px] sm:px-14 lg:min-h-[700px] lg:px-16">
              <div className="flex items-center justify-between">
                <span className="font-serif text-base tracking-[0.28em] text-[#FFF9F2]/90 sm:text-lg">
                  TAANTIRA
                </span>
              </div>

              <div className="my-auto max-w-xl py-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-[#F5E7E8]/90">
                  HANDLOOM SAREES &amp; JEWELLERY
                </p>
                <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1.06] text-[#FFF9F2] sm:text-5xl lg:text-[64px]">
                  {headingParts.line1}
                  <br />
                  {headingParts.line2 && <span>{headingParts.line2} </span>}
                  {headingParts.italic && (
                    <span className="font-normal italic text-[#E4BA6F]">
                      {headingParts.italic}
                    </span>
                  )}
                </h1>
                {activeBanner.subtitle && (
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-[#F5E7E8]/90 sm:text-base">
                    {activeBanner.subtitle}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3.5">
                  <Link
                    to={activeBanner.cta_link || "/collections/sarees"}
                    className="inline-flex items-center gap-2 rounded-full border border-[#C39A52]/70 bg-[#641B32] px-7 py-2.5 text-sm font-medium text-[#FFF9F2] shadow-lg transition hover:bg-[#4B1224]"
                  >
                    <span>{activeBanner.cta_text || "Shop Sarees"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={
                      activeBanner.cta_link === "/collections/jewellery"
                        ? "/collections/sarees"
                        : "/collections/jewellery"
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-[#FFF9F2]/55 bg-white/10 px-7 py-2.5 text-sm font-medium text-[#FFF9F2] backdrop-blur-sm transition hover:bg-white/20"
                  >
                    {activeBanner.cta_link === "/collections/jewellery"
                      ? "View All Sarees"
                      : "Explore Jewellery"}
                  </Link>
                </div>
              </div>

              <div className="grid max-w-xl grid-cols-2 gap-4 pb-4 sm:grid-cols-4 sm:gap-0 sm:divide-x sm:divide-[#FFF9F2]/25">
                <div className="flex flex-col items-start gap-1.5 sm:pr-4">
                  <Grid className="h-5 w-5 text-[#FFF9F2]/90" />
                  <p className="text-xs leading-tight text-[#FFF9F2]/90">
                    Authentic Handloom
                  </p>
                </div>
                <div className="flex flex-col items-start gap-1.5 sm:px-4">
                  <Leaf className="h-5 w-5 text-[#FFF9F2]/90" />
                  <p className="text-xs leading-tight text-[#FFF9F2]/90">
                    Artisanal Craftsmanship
                  </p>
                </div>
                <div className="flex flex-col items-start gap-1.5 sm:px-4">
                  <Gem className="h-5 w-5 text-[#FFF9F2]/90" />
                  <p className="text-xs leading-tight text-[#FFF9F2]/90">
                    Premium Quality
                  </p>
                </div>
                <div className="flex flex-col items-start gap-1.5 sm:pl-4">
                  <Truck className="h-5 w-5 text-[#FFF9F2]/90" />
                  <p className="text-xs leading-tight text-[#FFF9F2]/90">
                    Pan India Delivery
                  </p>
                </div>
              </div>
            </div>

            {banners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSlideIdx(
                      (i) => (i - 1 + banners.length) % banners.length,
                    )
                  }
                  aria-label="Previous hero slide"
                  className="absolute bottom-3 left-4 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/85 text-[#3D1023] shadow transition hover:bg-white sm:bottom-auto sm:left-4 sm:top-1/2 sm:h-9 sm:w-9 sm:-translate-y-1/2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSlideIdx((i) => (i + 1) % banners.length)
                  }
                  aria-label="Next hero slide"
                  className="absolute bottom-3 right-4 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/85 text-[#3D1023] shadow transition hover:bg-white sm:bottom-auto sm:right-4 sm:top-1/2 sm:h-9 sm:w-9 sm:-translate-y-1/2"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
                  {banners.map((b, idx) => (
                    <button
                      key={b.id || idx}
                      type="button"
                      onClick={() => setSlideIdx(idx)}
                      aria-label={`Hero slide ${idx + 1}`}
                      className={`h-2 w-2 cursor-pointer rounded-full transition ${
                        idx === safeSlideIdx
                          ? "bg-[#3D1023] ring-2 ring-[#FFF9F2]"
                          : "bg-[#FFF9F2]/60 hover:bg-[#FFF9F2]"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="mx-auto flex min-h-[420px] max-w-[1440px] flex-col items-center justify-center gap-4 px-6 py-12 text-center text-[#FFF9F2]">
            {loading ? (
              <div className="h-72 w-full animate-pulse rounded-2xl bg-[#641B32]/40" />
            ) : (
              <>
                <p className="text-sm text-[#F5E7E8]">
                  {loadError || "Storefront banners are currently empty."}
                </p>
                <button
                  type="button"
                  onClick={loadHomepage}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#C39A52] px-5 py-2 text-xs font-semibold text-[#3D1023] hover:bg-[#D9A0A9]"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Retry Database Load
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {/* Shop by Saree Weave & Jewellery (Loaded Live From Database Categories) */}
      <section className="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="Curated Saree Houses & Jewellery"
          title="Shop by Weave &amp; Craft"
          linkTo="/collections/all"
        />
        {loading && categories.length === 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-[#F5E7E8]"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#D9A0A9]/50 bg-white p-8 text-center">
            <p className="text-sm text-[#641B32]">
              {loadError || "No active categories found in the database."}
            </p>
            <button
              type="button"
              onClick={loadHomepage}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#641B32] px-5 py-2 text-xs font-semibold text-[#FFF9F2]"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                to={`/collections/${cat.slug}`}
                className="group overflow-hidden rounded-2xl border border-[#D9A0A9]/40 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="aspect-[3/4] overflow-hidden bg-[#F5E7E8]">
                  <img
                    src={cat.image_url || "/assets/products/saree-burgundy.jpg"}
                    alt={cat.name}
                    className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3.5 text-center">
                  <p className="text-xs font-semibold text-[#3D1023] group-hover:text-[#641B32] sm:text-sm">
                    {cat.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#A83F5E]">
                    {cat.slug === "jewellery"
                      ? "Heirloom Pairing Capsule"
                      : `${(cat.children || []).length} Subcategories`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Dedicated Nauvari / 9 Vaari Collection Section */}
      <section className="border-y border-[#D9A0A9]/40 bg-[#F5E7E8]/55 py-14">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <SectionHeader
            eyebrow="Dedicated Maharashtrian Nine-Yard Edit"
            title="Nauvari / 9 Vaari Sarees"
            linkTo="/collections/nauvari-sarees"
            linkLabel="Explore All Nauvari Sarees"
          />

          {nauvariSubcategories.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {nauvariSubcategories.map((sub) => (
                <Link
                  key={sub.slug}
                  to={`/collections/nauvari-sarees?subcategories=${encodeURIComponent(sub.slug)}`}
                  className="rounded-full border border-[#641B32]/30 bg-white px-4 py-1.5 text-xs font-semibold text-[#641B32] shadow-sm transition hover:bg-[#641B32] hover:text-[#FFF9F2]"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="aspect-[3/4] animate-pulse rounded-2xl bg-white/70"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {nauvariList.slice(0, 6).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                  onToggleWishlist={handleToggleWishlist}
                  onQuickAddToCart={handleQuickAddToCart}
                  isWishlisted={wishlistedIds.has(Number(product.id))}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="Live Database Catalogue Highlights"
          title="Handwoven Saree Collection"
          linkTo="/collections/sarees"
          linkLabel="Browse All Sarees"
        />
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-[#F5E7E8]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {handwovenList.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickViewProduct}
                onToggleWishlist={handleToggleWishlist}
                onQuickAddToCart={handleQuickAddToCart}
                isWishlisted={wishlistedIds.has(Number(product.id))}
              />
            ))}
          </div>
        )}
      </section>

      <section className="bg-[#F5E7E8]/55 py-14">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <SectionHeader
            eyebrow="Curated Capsule"
            title="Heritage Saree Jewellery"
            linkTo="/collections/jewellery"
            linkLabel="View Jewellery"
          />
          <div className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-[#D9A0A9]/50 bg-white p-6 shadow-sm lg:grid-cols-12">
            <div className="lg:col-span-4">
              {loading ? (
                <div className="aspect-[3/4] animate-pulse rounded-2xl bg-[#F5E7E8]" />
              ) : (
                jewelleryList.slice(0, 1).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={setQuickViewProduct}
                    onToggleWishlist={handleToggleWishlist}
                    onQuickAddToCart={handleQuickAddToCart}
                    isWishlisted={wishlistedIds.has(Number(product.id))}
                  />
                ))
              )}
            </div>
            <div className="flex flex-col gap-4 lg:col-span-8 lg:px-6">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#F5E7E8] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#641B32]">
                <Gem className="h-3.5 w-3.5 text-[#C39A52]" /> Curated Saree
                Pairing
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#3D1023] sm:text-3xl">
                Designed Exclusively for Silk &amp; Nauvari Drapes
              </h3>
              <p className="text-sm leading-relaxed text-[#641B32]/85">
                Ninety percent of Taantira is devoted to heirloom Indian
                sarees—Banarasi, Kanjivaram, Paithani, Tussar, Organza, Jamdani,
                Nauvari, and Regional Handlooms. Our Heritage Jewellery capsule
                completes every drape with filigree champagne gold, pearls, and
                regional ornaments without snagging delicate silk weaves.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  to="/collections/jewellery"
                  className="inline-flex items-center gap-2 rounded-full bg-[#641B32] px-5 py-2.5 text-xs font-semibold text-[#FFF9F2] hover:bg-[#3D1023]"
                >
                  Shop Saree Jewellery <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/collections/nauvari-sarees"
                  className="inline-flex items-center gap-2 rounded-full border border-[#641B32]/30 px-5 py-2.5 text-xs font-semibold text-[#641B32] hover:bg-[#F5E7E8]"
                >
                  Explore Nauvari Edit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="Verified Order Metrics"
          title="Best Selling Sarees"
          linkTo="/collections/sarees"
          linkLabel="View Full Catalogue"
        />
        {realBestSellers.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {realBestSellers.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickViewProduct}
                onToggleWishlist={handleToggleWishlist}
                onQuickAddToCart={handleQuickAddToCart}
                isWishlisted={wishlistedIds.has(Number(product.id))}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#D9A0A9]/50 bg-white p-6 text-sm text-[#641B32]/85">
            Best Selling Sarees populate automatically from live customer orders
            placed in Taantira&apos;s backend database (products with zero
            recorded sales are never artificially marked as best sellers).
          </div>
        )}
      </section>

      <QuickViewModal
        product={quickViewProduct}
        open={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
