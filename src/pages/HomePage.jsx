import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Gem,
  Grid,
  Leaf,
  Truck,
} from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import { useWishlistStore } from "../store/useWishlistStore";
import { useCartStore } from "../store/useCartStore";
import {
  FALLBACK_CATEGORIES,
  buildFallbackHomepageData,
} from "../utils/fallbackCatalog";

const HERO_SLIDES = [
  {
    eyebrow: "HANDLOOM SAREES & JEWELLERY",
    titleLine1: "Timeless",
    titleLine2: "Indian",
    titleItalic: "Weaves",
    subtitle:
      "Handcrafted Sarees, Heritage Weaves & Elegant Jewellery for Every Occasion",
    ctaPrimary: { label: "Shop Sarees", to: "/collections/sarees" },
    ctaSecondary: { label: "Explore Jewellery", to: "/collections/jewellery" },
    image: "/assets/banners/hero-timeless.jpg",
  },
  {
    eyebrow: "MAHARASHTRIAN NINE-YARD EDIT",
    titleLine1: "Regal",
    titleLine2: "Nauvari",
    titleItalic: "Drapes",
    subtitle:
      "Authentic Traditional Paithani, Peshwai, Brahmani, Koli & Ready-to-Wear 9 Vaari Sarees",
    ctaPrimary: { label: "Shop Nauvari", to: "/collections/nauvari-sarees" },
    ctaSecondary: { label: "Explore Jewellery", to: "/collections/jewellery" },
    image: "/assets/banners/hero-timeless.jpg",
  },
  {
    eyebrow: "VARANASI & KANCHIPURAM SILKS",
    titleLine1: "Bridal",
    titleLine2: "Zari",
    titleItalic: "Heirlooms",
    subtitle:
      "Pure Katan Banarasi, Korvai Kanjivaram & Antique Gold Zari Sarees for Festive Ceremonies",
    ctaPrimary: { label: "Shop Banarasi", to: "/collections/banarasi-sarees" },
    ctaSecondary: {
      label: "Shop Kanjivaram",
      to: "/collections/kanjivaram-sarees",
    },
    image: "/assets/banners/hero-timeless.jpg",
  },
  {
    eyebrow: "CURATED 10% JEWELLERY CAPSULE",
    titleLine1: "Paired",
    titleLine2: "Heritage",
    titleItalic: "Jewels",
    subtitle:
      "Champagne Gold Chandbalis, Kundan Jhumkas & Traditional Naths Finely Matched to Every Drape",
    ctaPrimary: { label: "Shop Jewellery", to: "/collections/jewellery" },
    ctaSecondary: { label: "View All Sarees", to: "/collections/sarees" },
    image: "/assets/banners/hero-timeless.jpg",
  },
];

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

const getInitialHomepageState = () => {
  const catalog = buildFallbackHomepageData();
  return {
    banners: [
      {
        id: 1,
        title: "Timeless Indian Weaves",
        subtitle:
          "Handcrafted Sarees, Heritage Weaves & Elegant Jewellery for Every Occasion",
        image_url: "/assets/banners/hero-timeless.jpg",
        cta_text: "Shop Sarees",
        cta_link: "/collections/sarees",
      },
    ],
    ...catalog,
    best_sellers: [],
    best_sellers_available: false,
    category_showcases: {
      sarees: catalog.handwoven_sarees,
      nauvari: catalog.nauvari_sarees,
      jewellery: catalog.jewellery_products,
    },
  };
};

export default function HomePage() {
  const wishlistItems = useWishlistStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const addItem = useCartStore((s) => s.addItem);
  const [data, setData] = useState(getInitialHomepageState);
  const [slideIdx, setSlideIdx] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const wishlistedIds = new Set(
    wishlistItems.map((entry) => Number(entry.id || entry.product?.id)),
  );

  useEffect(() => {
    let active = true;
    api
      .get("/products/homepage")
      .then((res) => {
        if (active && res.data?.data?.categories?.length) {
          setData(res.data.data);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleToggleWishlist = (product) => toggleWishlist(product);

  const handleQuickAddToCart = async (product) => {
    const variant = product?.variants?.[0];
    if (!variant) return;
    await addItem({
      product_id: product.id,
      variant_id: variant.id,
      quantity: 1,
      productPreview: product,
    });
  };

  const activeSlide = HERO_SLIDES[slideIdx] || HERO_SLIDES[0];
  const categories = data?.categories || FALLBACK_CATEGORIES;
  const showcases = data?.category_showcases || {};
  const nauvariCategory =
    categories.find((c) => c.slug === "nauvari-sarees") ||
    FALLBACK_CATEGORIES.find((c) => c.slug === "nauvari-sarees");
  const nauvariSubcategories = nauvariCategory?.children || [];
  const nauvariList = data?.nauvari_sarees || showcases.nauvari || [];
  const realBestSellers = data?.best_sellers || [];

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Full-Bleed Editorial Hero Section Matching Uploaded Reference Layout */}
      <section className="relative w-full overflow-hidden bg-[#3D1023] ">
        <img
          src={activeSlide.image}
          alt={`${activeSlide.titleLine1} ${activeSlide.titleLine2} ${activeSlide.titleItalic}`}
          className="absolute inset-0 h-full w-full object-cover object-right"
        />

        {/* Deep Maroon Editorial Scrim preserving clear portrait framing on right */}
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
              {activeSlide.eyebrow}
            </p>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1.06] text-[#FFF9F2] sm:text-5xl lg:text-[64px]">
              {activeSlide.titleLine1}
              <br />
              <span>{activeSlide.titleLine2} </span>
              <span className="font-normal italic text-[#E4BA6F]">
                {activeSlide.titleItalic}
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#F5E7E8]/90 sm:text-base">
              {activeSlide.subtitle}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3.5">
              <Link
                to={activeSlide.ctaPrimary.to}
                className="inline-flex items-center gap-2 rounded-full border border-[#C39A52]/70 bg-[#641B32] px-7 py-2.5 text-sm font-medium text-[#FFF9F2] shadow-lg transition hover:bg-[#4B1224]"
              >
                <span>{activeSlide.ctaPrimary.label}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={activeSlide.ctaSecondary.to}
                className="inline-flex items-center gap-2 rounded-full border border-[#FFF9F2]/55 bg-white/10 px-7 py-2.5 text-sm font-medium text-[#FFF9F2] backdrop-blur-sm transition hover:bg-white/20"
              >
                {activeSlide.ctaSecondary.label}
              </Link>
            </div>
          </div>

          {/* 4 Bottom Value Pillars matching reference footer strip */}
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

        {/* Left & Right Hero Slide Controls */}
        <button
          type="button"
          onClick={() =>
            setSlideIdx(
              (i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length,
            )
          }
          aria-label="Previous hero slide"
          className="absolute bottom-3 left-4 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/85 text-[#3D1023] shadow transition hover:bg-white sm:bottom-auto sm:left-4 sm:top-1/2 sm:h-9 sm:w-9 sm:-translate-y-1/2"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setSlideIdx((i) => (i + 1) % HERO_SLIDES.length)}
          aria-label="Next hero slide"
          className="absolute bottom-3 right-4 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/85 text-[#3D1023] shadow transition hover:bg-white sm:bottom-auto sm:right-4 sm:top-1/2 sm:h-9 sm:w-9 sm:-translate-y-1/2"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Bottom Center Slider Indicators */}
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSlideIdx(idx)}
              aria-label={`Hero slide ${idx + 1}`}
              className={`h-2 w-2 cursor-pointer rounded-full transition ${
                idx === slideIdx
                  ? "bg-[#3D1023] ring-2 ring-[#FFF9F2]"
                  : "bg-[#FFF9F2]/60 hover:bg-[#FFF9F2]"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Shop by Saree Weave & Jewellery (All 7 Main Saree Categories + Jewellery) */}
      <section className="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="7 Main Saree Houses • 42 Subcategories"
          title="Shop by Weave &amp; Craft"
          linkTo="/collections/all"
        />
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
                    : `${(cat.children || []).length || 5} Subcategories`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Dedicated Nauvari / 9 Vaari Collection Section */}
      <section className="border-y border-[#D9A0A9]/40 bg-[#F5E7E8]/55 py-14">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <SectionHeader
            eyebrow="Dedicated Maharashtrian Nine-Yard Edit"
            title="Nauvari / 9 Vaari Sarees"
            linkTo="/collections/nauvari-sarees"
            linkLabel="Explore All 30 Nauvari Sarees"
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
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
        <SectionHeader
          eyebrow="Photographed Handloom Highlights"
          title="Handwoven Saree Collection"
          linkTo="/collections/sarees"
          linkLabel="Browse All 210 Sarees"
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(showcases.sarees || data?.handwoven_sarees || [])
            .slice(0, 8)
            .map((product) => (
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
      </section>

      <section className="bg-[#F5E7E8]/55 py-14">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <SectionHeader
            eyebrow="10% Curated Capsule"
            title="Heritage Saree Jewellery"
            linkTo="/collections/jewellery"
            linkLabel="View Jewellery"
          />
          <div className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-[#D9A0A9]/50 bg-white p-6 shadow-sm lg:grid-cols-12">
            <div className="lg:col-span-4">
              {(showcases.jewellery || data?.jewellery_products || [])
                .slice(0, 1)
                .map((product) => (
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
