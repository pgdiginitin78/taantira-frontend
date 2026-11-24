import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Sparkles, ShieldCheck, Truck, Gem } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { useAuthStore } from '../store/useAuthStore';
import {
  FALLBACK_CATEGORIES,
  FALLBACK_COLLECTIONS,
  FALLBACK_PRODUCTS,
} from '../utils/fallbackCatalog';

function SectionHeader({ eyebrow, title, linkTo, linkLabel = 'View All' }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A83F5E]">{eyebrow}</p>
        <h2 className="mt-1 font-serif text-2xl font-bold text-[#3D1023] sm:text-3xl">{title}</h2>
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

const buildFallbackHomepage = () => {
  const sarees = FALLBACK_PRODUCTS.filter((p) => p.primaryCategory?.slug !== 'jewellery');
  const jewellery = FALLBACK_PRODUCTS.filter((p) => p.primaryCategory?.slug === 'jewellery');
  return {
    banners: [
      {
        id: 1,
        title: 'Heirloom Handloom Sarees',
        subtitle: '90% Handwoven Banarasi, Kanjivaram, Paithani & Jamdani Sarees • 10% Curated Saree Jewellery',
        image_url: '/assets/banners/hero-festive.jpg',
        cta_text: 'Explore Sarees',
        cta_link: '/collections/sarees',
      },
    ],
    categories: FALLBACK_CATEGORIES,
    collections: FALLBACK_COLLECTIONS,
    new_arrivals: FALLBACK_PRODUCTS.filter((p) => p.is_new_arrival),
    best_sellers: FALLBACK_PRODUCTS.filter((p) => p.is_best_seller),
    trending_products: FALLBACK_PRODUCTS.filter((p) => p.is_trending),
    category_showcases: {
      sarees,
      banarasi: sarees.filter((p) => p.primaryCategory?.slug === 'banarasi-sarees'),
      kanjivaram: sarees.filter((p) => p.primaryCategory?.slug === 'kanjivaram-sarees'),
      paithani_tussar: sarees.filter((p) => p.primaryCategory?.slug === 'paithani-tussar-sarees'),
      organza_jamdani: sarees.filter((p) =>
        ['organza-georgette-sarees', 'jamdani-handloom-sarees'].includes(p.primaryCategory?.slug)
      ),
      jewellery,
    },
    customer_reviews: [
      {
        id: 1,
        rating: 5,
        title: 'Exquisite Banarasi craftsmanship',
        comment: 'The deep burgundy silk glows under evening light without feeling heavy. Custom blouse stitching fit like a dream.',
        author: { full_name: 'Ananya Deshmukh' },
        product: { name: 'Aaradhya Deep Burgundy Banarasi Silk Saree', slug: 'aaradhya-burgundy-banarasi-silk-saree' },
      },
      {
        id: 2,
        rating: 5,
        title: 'Authentic Kanchipuram lustre',
        comment: 'Crisp antique gold temple weave and rich berry rose silk drape. Paired it with the Ruhani chandbalis.',
        author: { full_name: 'Meera Iyer' },
        product: { name: 'Meenakshi Berry Rose Kanjivaram Silk Saree', slug: 'meenakshi-berry-rose-kanjivaram-saree' },
      },
      {
        id: 3,
        rating: 5,
        title: 'Featherlight saree earrings',
        comment: 'The champagne gold chandbali set pairs effortlessly with both Banarasi and Tussar silk weaves.',
        author: { full_name: 'Rhea Kulkarni' },
        product: { name: 'Ruhani Champagne Gold & Pearl Chandbali Jewellery Set', slug: 'ruhani-champagne-gold-pearl-chandbali-set' },
      },
    ],
  };
};

export default function HomePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [data, setData] = useState(buildFallbackHomepage);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());

  useEffect(() => {
    let active = true;
    api
      .get('/products/homepage')
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

  const handleToggleWishlist = async (product) => {
    if (!isAuthenticated) return;
    try {
      const res = await api.post('/users/wishlist/toggle', { product_id: product.id });
      const active = res.data?.data?.wishlisted;
      setWishlistedIds((prev) => {
        const next = new Set(prev);
        if (active) next.add(product.id);
        else next.delete(product.id);
        return next;
      });
    } catch {
      // Ignore error
    }
  };

  const hero = data?.banners?.[0] || buildFallbackHomepage().banners[0];
  const categories = data?.categories || FALLBACK_CATEGORIES;
  const showcases = data?.category_showcases || {};

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-[#3D1023]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:py-14">
          <div className="flex flex-col gap-5 text-[#FFF9F2] lg:col-span-5">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#C39A52]/50 bg-[#641B32] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#C39A52]">
              <Sparkles className="h-3.5 w-3.5" /> Taantira Saree Atelier 2026
            </span>
            <h1 className="font-serif text-4xl font-bold leading-tight text-[#FFF9F2] sm:text-5xl">
              {hero.title}
            </h1>
            <p className="text-sm leading-relaxed text-[#F5E7E8]/90 sm:text-base">{hero.subtitle}</p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/collections/sarees"
                className="inline-flex items-center gap-2 rounded-full bg-[#C39A52] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#3D1023] transition hover:bg-[#D9A0A9]"
              >
                Explore Sarees (90%) <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/collections/jewellery"
                className="inline-flex items-center gap-2 rounded-full border border-[#F5E7E8]/40 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#FFF9F2] transition hover:bg-[#641B32]"
              >
                <Gem className="h-3.5 w-3.5 text-[#C39A52]" /> Saree Jewellery (10%)
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-[#F5E7E8]/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#C39A52]" /> Pure Handloom Silk Mark
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#C39A52]" /> Live OTP-Verified Delivery
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-3xl border border-[#C39A52]/40 shadow-2xl">
              <img
                src={hero.image_url}
                alt={hero.title}
                className="aspect-[16/9] w-full object-cover object-top"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Saree Weave & Jewellery */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="90% Sarees • 10% Jewellery" title="Shop by Weave &amp; Craft" linkTo="/collections/all" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/collections/${cat.slug}`}
              className="group overflow-hidden rounded-2xl border border-[#D9A0A9]/40 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="aspect-[3/4] overflow-hidden bg-[#F5E7E8]">
                <img
                  src={cat.image_url || '/assets/products/saree-burgundy.jpg'}
                  alt={cat.name}
                  className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-3 text-center">
                <p className="text-xs font-semibold text-[#3D1023] group-hover:text-[#641B32] sm:text-sm">{cat.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* All Signature Sarees (90% Core Catalogue) */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="90% Atelier Focus" title="Handwoven Saree Collection" linkTo="/collections/sarees" linkLabel="Explore All Sarees" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(showcases.sarees || []).slice(0, 8).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={setQuickViewProduct}
              onToggleWishlist={handleToggleWishlist}
              isWishlisted={wishlistedIds.has(product.id)}
            />
          ))}
        </div>
      </section>

      {/* Saree Jewellery Pairing Capsule (10% Curated Jewellery) */}
      <section className="bg-[#F5E7E8]/55 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow="10% Curated Capsule" title="Heritage Saree Jewellery" linkTo="/collections/jewellery" linkLabel="View Jewellery" />
          <div className="grid grid-cols-1 items-center gap-8 rounded-3xl border border-[#D9A0A9]/50 bg-white p-6 shadow-sm lg:grid-cols-12">
            <div className="lg:col-span-4">
              {(showcases.jewellery || []).slice(0, 1).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                  onToggleWishlist={handleToggleWishlist}
                  isWishlisted={wishlistedIds.has(product.id)}
                />
              ))}
            </div>
            <div className="flex flex-col gap-4 lg:col-span-8 lg:px-6">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#F5E7E8] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#641B32]">
                <Gem className="h-3.5 w-3.5 text-[#C39A52]" /> Curated Saree Pairing
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#3D1023] sm:text-3xl">
                Designed Exclusively for Silk Drapes
              </h3>
              <p className="text-sm leading-relaxed text-[#641B32]/85">
                Ninety percent of Taantira is devoted to heirloom Indian sarees—Banarasi, Kanjivaram, Paithani, Tussar, Organza, and Jamdani. The remaining ten percent is our finishing touch: handcrafted champagne-gold and pearl jewellery designed never to snag delicate silk weaves.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  to="/collections/jewellery"
                  className="inline-flex items-center gap-2 rounded-full bg-[#641B32] px-5 py-2.5 text-xs font-semibold text-[#FFF9F2] hover:bg-[#3D1023]"
                >
                  Shop Saree Jewellery <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/collections/best-sellers"
                  className="inline-flex items-center gap-2 rounded-full border border-[#641B32]/30 px-5 py-2.5 text-xs font-semibold text-[#641B32] hover:bg-[#F5E7E8]"
                >
                  Best Selling Sarees
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Patron Favorites" title="Best Selling Sarees &amp; Accents" linkTo="/collections/best-sellers" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.best_sellers || []).slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={setQuickViewProduct}
              onToggleWishlist={handleToggleWishlist}
              isWishlisted={wishlistedIds.has(product.id)}
            />
          ))}
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Client Voices" title="Verified Patron Reviews" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {(data?.customer_reviews || []).slice(0, 3).map((review) => (
            <div key={review.id} className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-1 text-[#C39A52]">
                {Array.from({ length: review.rating || 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#C39A52]" />
                ))}
              </div>
              <p className="mt-3 text-sm font-bold text-[#3D1023]">{review.title || 'Cherished Craft'}</p>
              <p className="mt-2 text-xs leading-relaxed text-[#641B32]/85">&ldquo;{review.comment}&rdquo;</p>
              <div className="mt-4 border-t border-[#F5E7E8] pt-3 text-xs">
                <p className="font-semibold text-[#3D1023]">{review.author?.full_name || 'Verified Buyer'}</p>
                {review.product && (
                  <Link to={`/products/${review.product.slug}`} className="text-[#A83F5E] hover:underline">
                    {review.product.name}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <QuickViewModal
        product={quickViewProduct}
        open={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
