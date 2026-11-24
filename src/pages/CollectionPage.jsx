import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import { Pagination, Slider, Checkbox, FormControlLabel, Button } from '@mui/material';
import { SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import { FALLBACK_CATEGORIES, FALLBACK_COLLECTIONS, FALLBACK_PRODUCTS } from '../utils/fallbackCatalog';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'bestselling', label: 'Best Selling' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export default function CollectionPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [banner, setBanner] = useState(null);
  const [facets, setFacets] = useState({ sizes: [], colors: [], fabrics: [], occasions: [] });
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loadedKey, setLoadedKey] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const [priceRange, setPriceRange] = useState([0, 40000]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedFabric, setSelectedFabric] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);
  const [page, setPage] = useState(1);

  const queryTerm = searchParams.get('q') || '';
  const requestKey = `${slug}|${queryTerm}|${priceRange.join('-')}|${selectedSize}|${selectedColor}|${selectedFabric}|${selectedOccasion}|${inStockOnly}|${sortOption.value}|${page}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;
    api
      .get('/products', {
        params: {
          collection: slug,
          q: queryTerm || undefined,
          minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
          maxPrice: priceRange[1] < 40000 ? priceRange[1] : undefined,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
          fabric: selectedFabric || undefined,
          occasion: selectedOccasion || undefined,
          inStock: inStockOnly ? 'true' : undefined,
          sort: sortOption.value,
          page,
          limit: 12,
        },
      })
      .then((res) => {
        if (!active) return;
        const d = res.data?.data;
        setProducts(d?.products || []);
        setBanner(d?.banner || null);
        setFacets(d?.facets || { sizes: [], colors: [], fabrics: [], occasions: [] });
        setMeta(res.data?.meta || { total: 0, page: 1, totalPages: 1 });
        setLoadedKey(requestKey);
      })
      .catch(() => {
        if (!active) return;
        const matchedCat = FALLBACK_CATEGORIES.find((c) => c.slug === slug);
        const matchedCol = FALLBACK_COLLECTIONS.find((c) => c.slug === slug);
        setBanner(matchedCat || matchedCol || null);

        const filtered = FALLBACK_PRODUCTS.filter((p) => {
          if (slug === 'sarees') return p.primaryCategory?.slug !== 'jewellery';
          if (slug === 'jewellery') return p.primaryCategory?.slug === 'jewellery';
          if (slug === 'new-arrivals') return p.is_new_arrival;
          if (slug === 'best-sellers') return p.is_best_seller;
          if (slug === 'festive-collections') return p.is_featured || p.is_trending;
          if (slug && slug !== 'all') return p.primaryCategory?.slug === slug;
          return true;
        }).filter((p) => {
          const price = Number(p.sale_price || p.base_price);
          if (price < priceRange[0] || price > priceRange[1]) return false;
          if (selectedFabric && !p.fabric.toLowerCase().includes(selectedFabric.toLowerCase())) return false;
          if (selectedOccasion && !p.occasion.toLowerCase().includes(selectedOccasion.toLowerCase())) return false;
          if (queryTerm) {
            const q = queryTerm.toLowerCase();
            return (
              p.name.toLowerCase().includes(q) ||
              p.fabric.toLowerCase().includes(q) ||
              p.occasion.toLowerCase().includes(q)
            );
          }
          return true;
        });

        setProducts(filtered);
        setFacets({
          sizes: ['Free Size (5.5m)', 'One Size'],
          colors: [
            { name: 'Deep Burgundy', hex: '#641B32' },
            { name: 'Berry Rose', hex: '#A83F5E' },
            { name: 'Dark Maroon', hex: '#3D1023' },
            { name: 'Warm Ivory', hex: '#FFF9F2' },
            { name: 'Blush Pink', hex: '#F5E7E8' },
            { name: 'Champagne Gold', hex: '#C39A52' },
          ],
          fabrics: [...new Set(FALLBACK_PRODUCTS.map((p) => p.fabric))],
          occasions: [...new Set(FALLBACK_PRODUCTS.map((p) => p.occasion))],
        });
        setMeta({ total: filtered.length, page: 1, totalPages: 1 });
        setLoadedKey(requestKey);
      });
    return () => {
      active = false;
    };
  }, [requestKey, slug, queryTerm, priceRange, selectedSize, selectedColor, selectedFabric, selectedOccasion, inStockOnly, sortOption, page]);

  const clearFilters = () => {
    setPriceRange([0, 40000]);
    setSelectedSize('');
    setSelectedColor('');
    setSelectedFabric('');
    setSelectedOccasion('');
    setInStockOnly(false);
    setSortOption(SORT_OPTIONS[0]);
    setPage(1);
    if (queryTerm) setSearchParams({});
  };

  const title = useMemo(() => {
    if (banner?.name) return banner.name;
    if (slug === 'sarees') return 'Handloom Sarees (90% Collection)';
    if (slug === 'jewellery') return 'Saree Jewellery (10% Capsule)';
    if (queryTerm) return `Search: "${queryTerm}"`;
    return (slug || 'All Sarees & Jewellery').replace(/-/g, ' ');
  }, [banner, slug, queryTerm]);

  return (
    <div className="flex flex-col gap-8 pb-16">
      <section className="border-b border-[#D9A0A9]/40 bg-[#3D1023] text-[#FFF9F2]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 py-10 sm:px-6 md:grid-cols-12">
          <div className="flex flex-col gap-2 md:col-span-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C39A52]">Taantira Curated Atelier</p>
            <h1 className="font-serif text-3xl font-bold capitalize sm:text-4xl">{title}</h1>
            <p className="max-w-2xl text-sm text-[#F5E7E8]/85">
              {banner?.description || '90% Pure Handloom Sarees paired with 10% Heirloom Saree Jewellery.'}
            </p>
          </div>
          <div className="text-left md:col-span-4 md:text-right">
            <span className="inline-block rounded-full border border-[#C39A52]/40 bg-[#641B32] px-4 py-2 text-xs font-semibold text-[#FFF9F2]">
              {meta.total} {meta.total === 1 ? 'Piece' : 'Pieces'} Available
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12">
        <aside className="flex flex-col gap-5 rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 shadow-sm lg:col-span-3 lg:self-start">
          <div className="flex items-center justify-between border-b border-[#F5E7E8] pb-3">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-[#3D1023]">
              <SlidersHorizontal className="h-4 w-4 text-[#641B32]" /> Refine Selection
            </span>
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-[#A83F5E] hover:underline">
              Reset
            </button>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#641B32]">
              Price Range (Rs {priceRange[0]} - Rs {priceRange[1]})
            </p>
            <Slider value={priceRange} onChange={(_, v) => setPriceRange(v)} min={0} max={40000} step={500} valueLabelDisplay="auto" />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#641B32]">Size</p>
            <div className="flex flex-wrap gap-1.5">
              {(facets.sizes.length ? facets.sizes : ['Free Size (5.5m)', 'One Size']).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize((prev) => (prev === sz ? '' : sz))}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                    selectedSize === sz
                      ? 'border-[#641B32] bg-[#641B32] text-[#FFF9F2]'
                      : 'border-[#D9A0A9]/60 bg-[#FFF9F2] text-[#3D1023]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#641B32]">Shade / Colour</p>
            <div className="flex flex-wrap gap-1.5">
              {facets.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColor((prev) => (prev === c.name ? '' : c.name))}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    selectedColor === c.name
                      ? 'border-[#641B32] bg-[#641B32] text-white'
                      : 'border-[#D9A0A9]/60 bg-white text-[#3D1023]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {facets.fabrics.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#641B32]">Weave / Material</p>
              <Select
                isClearable
                placeholder="All weaves..."
                value={selectedFabric ? { value: selectedFabric, label: selectedFabric } : null}
                onChange={(opt) => setSelectedFabric(opt?.value || '')}
                options={facets.fabrics.map((f) => ({ value: f, label: f }))}
                className="text-xs"
              />
            </div>
          )}

          {facets.occasions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#641B32]">Occasion</p>
              <Select
                isClearable
                placeholder="All occasions..."
                value={selectedOccasion ? { value: selectedOccasion, label: selectedOccasion } : null}
                onChange={(opt) => setSelectedOccasion(opt?.value || '')}
                options={facets.occasions.map((o) => ({ value: o, label: o }))}
                className="text-xs"
              />
            </div>
          )}

          <FormControlLabel
            control={<Checkbox checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} size="small" />}
            label={<span className="text-xs font-medium text-[#3D1023]">In Stock Only</span>}
          />
        </aside>

        <div className="flex flex-col gap-6 lg:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#D9A0A9]/40 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-[#641B32]">
              Showing {products.length} of {meta.total} pieces
            </p>
            <div className="w-56">
              <Select
                value={sortOption}
                onChange={(opt) => setSortOption(opt || SORT_OPTIONS[0])}
                options={SORT_OPTIONS}
                isSearchable={false}
                className="text-xs"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="aspect-[3/4] animate-pulse rounded-2xl bg-[#F5E7E8]" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-[#D9A0A9]/50 bg-white p-12 text-center">
              <p className="text-base font-semibold text-[#3D1023]">No pieces match the selected filters.</p>
              <Button onClick={clearFilters} variant="outlined" color="primary" className="mt-4">
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onQuickView={setQuickViewProduct} />
              ))}
            </div>
          )}

          {meta.totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination count={meta.totalPages} page={page} onChange={(_, val) => setPage(val)} color="primary" />
            </div>
          )}
        </div>
      </div>

      <QuickViewModal
        product={quickViewProduct}
        open={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
