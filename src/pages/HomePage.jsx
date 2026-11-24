import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Sparkles, ShieldCheck, Truck } from 'lucide-react';
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

export default function HomePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [data, setData] = useState(null);
  const [offlinePreview, setOfflinePreview] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());

  useEffect(() => {
    api
      .get('/products/homepage')
      .then((res) => {
        setData(res.data?.data);
        setOfflinePreview(false);
      })
      .catch(() => {
        setOfflinePreview(true);
        setData({
          banners: [
            {
              id: 1,
              title: 'The Festive Heritage Edit',
              subtitle: 'Handwoven Banarasi Silks, Organza Drapes & Heirloom Lehengas',
              image_url: '/assets/banners/hero-festive.jpg',
              cta_text: 'Explore Festive Collection',
              cta_link: '/collections/festive-collections',
            },
          ],
          categories: FALLBACK_CATEGORIES,
          collections: FALLBACK_COLLECTIONS,
          new_arrivals: FALLBACK_PRODUCTS.filter((p) => p.is_new_arrival),
          best_sellers: FALLBACK_PRODUCTS.filter((p) => p.is_best_seller),
          trending_products: FALLBACK_PRODUCTS.filter((p) => p.is_trending),
          category_showcases: {
            sarees: FALLBACK_PRODUCTS.filter((p) => p.primaryCategory?.slug === 'sarees'),
            dresses: FALLBACK_PRODUCTS.filter((p) => p.primaryCategory?.slug === 'dresses'),
            kurtas: FALLBACK_PRODUCTS.filter((p) => p.primaryCategory?.slug === 'kurtas'),
            suits: FALLBACK_PRODUCTS.filter((p) => p.primaryCategory?.slug === 'suits'),
            lehengas: FALLBACK_PRODUCTS.filter((p) => p.primaryCategory?.slug === 'lehengas'),
            accessories: FALLBACK_PRODUCTS.filter((p) => p.primaryCategory?.slug === 'accessories'),
          },
          customer_reviews: [
            {
              id: 1,
              rating: 5,
              title: 'Exquisite Banarasi craftsmanship',
              comment: 'The deep burgundy silk glows under evening light without feeling heavy.',
              author: { full_name: 'Ananya Deshmukh' },
              product: { name: 'Aaradhya Deep Burgundy Banarasi Silk Saree', slug: 'aaradhya-burgundy-banarasi-silk-saree' },
            },
            {
              id: 2,
              rating: 5,
              title: 'Effortless evening drape',
              comment: 'Soft mulberry lining, zero sheerness, and rich berry tones.',
              author: { full_name: 'Meera Iyer' },
              product: { name: 'Meher Berry Rose Pleated Silk-Georgette Dress', slug: 'meher-berry-rose-pleated-silk-georgette-dress' },
            },
          ],
        });
      });
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

  const hero = data?.banners?.[0] || {
    title: 'The Festive Heritage Edit',
    subtitle: 'Handwoven Banarasi Silks, Organza Drapes & Heirloom Lehengas',
    image_url: '/assets/banners/hero-festive.jpg',
    cta_text: 'Explore Festive Collection',
    cta_link: '/collections/festive-collections',
  };

  const categories = data?.categories || FALLBACK_CATEGORIES;
  const showcases = data?.category_showcases || {};

  return (
    <div className="space-y-16 pb-16">
      {offlinePreview && (
        <div className="bg-[#F5E7E8] px-4 py-2 text-center text-xs font-medium text-[#641B32]">
          Previewing local seeded Taantira catalog (start MySQL Community Edition and run backend migrations/seeders for live database sync).
        </div>
      )}

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-[#3D1023]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:py-14">
          <div className="space-y-5 text-[#FFF9F2] lg:col-span-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C39A52]/50 bg-[#641B32] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-[#C39A52]">
              <Sparkles className="h-3.5 w-3.5" /> Taantira Atelier 2026
            </span>
            <h1 className="font-serif text-4xl font-bold leading-tight text-[#FFF9F2] sm:text-5xl">
              {hero.title}
            </h1>
            <p className="text-sm leading-relaxed text-[#F5E7E8]/90 sm:text-base">{hero.subtitle}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to={hero.cta_link || '/collections/festive-collections'}
                className="inline-flex items-center gap-2 rounded-full bg-[#C39A52] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#3D1023] transition hover:bg-[#D9A0A9]"
              >
                {hero.cta_text || 'Explore Collection'} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/collections/new-arrivals"
                className="inline-flex items-center gap-2 rounded-full border border-[#F5E7E8]/40 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[#FFF9F2] transition hover:bg-[#641B32]"
              >
                Shop New Arrivals
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4 text-xs text-[#F5E7E8]/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#C39A52]" /> Authentic Handloom Silk
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

      {/* Shop by Category */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Curated Silhouettes" title="Shop by Category" linkTo="/collections/all" />
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
                <p className="text-sm font-semibold text-[#3D1023] group-hover:text-[#641B32]">{cat.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Just Arrived" title="New Arrivals" linkTo="/collections/new-arrivals" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.new_arrivals || []).slice(0, 4).map((product) => (
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

      {/* Best Sellers */}
      <section className="bg-[#F5E7E8]/45 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader eyebrow="Atelier Signatures" title="Best Sellers" linkTo="/collections/best-sellers" />
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
        </div>
      </section>

      {/* Trending & Festive Collections */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Trending Now" title="Trending & Festive Highlights" linkTo="/collections/festive-collections" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(data?.trending_products || []).slice(0, 4).map((product) => (
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

      {/* Category Spotlights: Sarees, Dresses, Kurtas, Suits, Lehengas, Accessories */}
      <section className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6">
        {[
          { key: 'sarees', title: 'Heirloom Sarees', eyebrow: 'Banarasi & Organza' },
          { key: 'lehengas', title: 'Celebratory Lehengas', eyebrow: 'Bridal & Mehendi' },
          { key: 'suits', title: 'Anarkali & Palazzo Suits', eyebrow: 'Evening Couture' },
          { key: 'kurtas', title: 'Chanderi Kurta Sets', eyebrow: 'Daytime Poise' },
          { key: 'dresses', title: 'Modern Silk Dresses', eyebrow: 'Fluid Drapes' },
          { key: 'accessories', title: 'Silk Potlis & Brass Accents', eyebrow: 'Finishing Touches' },
        ].map(({ key, title, eyebrow }) => {
          const items = showcases[key] || [];
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <SectionHeader eyebrow={eyebrow} title={title} linkTo={`/collections/${key}`} />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={setQuickViewProduct}
                    onToggleWishlist={handleToggleWishlist}
                    isWishlisted={wishlistedIds.has(product.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Customer Reviews */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader eyebrow="Client Voices" title="Verified Customer Reviews" />
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
