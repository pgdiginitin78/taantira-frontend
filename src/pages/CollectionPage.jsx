import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Select from "react-select";
import {
  Pagination,
  Checkbox,
  FormControlLabel,
  Button,
  Drawer,
  TextField,
} from "@mui/material";
import { SlidersHorizontal, X, Search, RotateCcw } from "lucide-react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import QuickViewModal from "../components/QuickViewModal";
import { useWishlistStore } from "../store/useWishlistStore";
import { useCartStore } from "../store/useCartStore";
import {
  FALLBACK_CATEGORIES,
  FALLBACK_COLLECTIONS,
  filterFallbackProducts,
  getFallbackFacets,
} from "../utils/fallbackCatalog";

const SORT_OPTIONS = [
  { value: "newest", label: "Curated Order" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const parseCsv = (str) =>
  String(str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const updateCsvList = (current, item) =>
  current.includes(item)
    ? current.filter((x) => x !== item)
    : [...current, item];

export default function CollectionPage() {
  const { slug = "sarees" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [banner, setBanner] = useState(null);
  const [facets, setFacets] = useState(getFallbackFacets);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loadedKey, setLoadedKey] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const wishlistItems = useWishlistStore((s) => s.items);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const addItem = useCartStore((s) => s.addItem);
  const wishlistedIds = useMemo(
    () =>
      new Set(
        wishlistItems.map((entry) => Number(entry.id || entry.product?.id)),
      ),
    [wishlistItems],
  );

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

  const selectedCategories = useMemo(
    () => parseCsv(searchParams.get("categories")),
    [searchParams],
  );
  const selectedSubcategories = useMemo(
    () => parseCsv(searchParams.get("subcategories")),
    [searchParams],
  );
  const selectedFabrics = useMemo(
    () => parseCsv(searchParams.get("fabrics")),
    [searchParams],
  );
  const queryTerm = searchParams.get("q") || "";
  const sortKey = searchParams.get("sort") || "newest";
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10) || 1,
  );

  const [searchDraft, setSearchDraft] = useState(null);
  const searchInput = searchDraft !== null ? searchDraft : queryTerm;

  const sortOption = useMemo(
    () => SORT_OPTIONS.find((opt) => opt.value === sortKey) || SORT_OPTIONS[0],
    [sortKey],
  );

  const updateUrlParams = useCallback(
    (updates, resetPage = true) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, val] of Object.entries(updates)) {
        if (Array.isArray(val)) {
          if (val.length > 0) next.set(key, val.join(","));
          else next.delete(key);
        } else if (
          val !== null &&
          val !== undefined &&
          String(val).trim() !== ""
        ) {
          next.set(key, String(val));
        } else {
          next.delete(key);
        }
      }
      if (resetPage && updates.page === undefined) {
        next.delete("page");
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const requestKey = `${slug}|${selectedCategories.join(",")}|${selectedSubcategories.join(",")}|${selectedFabrics.join(",")}|${queryTerm}|${sortOption.value}|${page}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let active = true;
    api
      .get("/products", {
        params: {
          collection: slug,
          categories: selectedCategories.length
            ? selectedCategories.join(",")
            : undefined,
          subcategories: selectedSubcategories.length
            ? selectedSubcategories.join(",")
            : undefined,
          fabrics: selectedFabrics.length
            ? selectedFabrics.join(",")
            : undefined,
          q: queryTerm || undefined,
          sort: sortOption.value,
          page,
          limit: 24,
        },
      })
      .then((res) => {
        if (!active) return;
        const d = res.data?.data;
        setProducts(d?.products || []);
        setBanner(d?.banner || null);
        if (d?.facets?.categories) setFacets(d.facets);
        setMeta(res.data?.meta || { total: 0, page: 1, totalPages: 1 });
        setLoadedKey(requestKey);
      })
      .catch(() => {
        if (!active) return;
        const matchedCat =
          FALLBACK_CATEGORIES.find((c) => c.slug === slug) ||
          FALLBACK_CATEGORIES.flatMap((c) => c.children || []).find(
            (s) => s.slug === slug,
          );
        const matchedCol = FALLBACK_COLLECTIONS.find((c) => c.slug === slug);
        setBanner(matchedCat || matchedCol || null);

        const result = filterFallbackProducts({
          slug,
          categories: selectedCategories,
          subcategories: selectedSubcategories,
          fabrics: selectedFabrics,
          q: queryTerm,
          page,
          limit: 24,
        });

        let sortedProducts = [...result.products];
        if (sortOption.value === "price_asc") {
          sortedProducts.sort(
            (a, b) =>
              Number(a.sale_price ?? a.base_price) -
              Number(b.sale_price ?? b.base_price),
          );
        } else if (sortOption.value === "price_desc") {
          sortedProducts.sort(
            (a, b) =>
              Number(b.sale_price ?? b.base_price) -
              Number(a.sale_price ?? a.base_price),
          );
        } else if (sortOption.value === "name_asc") {
          sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        }

        setProducts(sortedProducts);
        setFacets(result.facets);
        setMeta(result.pagination);
        setLoadedKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [
    requestKey,
    slug,
    selectedCategories,
    selectedSubcategories,
    selectedFabrics,
    queryTerm,
    sortOption.value,
    page,
  ]);

  // Subcategories filtered intelligently based on selected categories (or active collection route if it is a main category)
  const routeMainCat = FALLBACK_CATEGORIES.some(
    (c) => c.slug === slug && slug !== "jewellery",
  )
    ? slug
    : null;
  const visibleSubcategories = useMemo(() => {
    const allSubs = facets.subcategories || [];
    if (selectedCategories.length > 0) {
      return allSubs.filter((s) => selectedCategories.includes(s.parent_slug));
    }
    if (routeMainCat) {
      return allSubs.filter((s) => s.parent_slug === routeMainCat);
    }
    return allSubs;
  }, [facets.subcategories, selectedCategories, routeMainCat]);

  const toggleCategory = (catSlug) => {
    const nextCats = updateCsvList(selectedCategories, catSlug);
    const allowedSubs = new Set(
      (facets.subcategories || [])
        .filter(
          (s) => nextCats.length === 0 || nextCats.includes(s.parent_slug),
        )
        .map((s) => s.slug),
    );
    const prunedSubs = selectedSubcategories.filter((s) => allowedSubs.has(s));
    updateUrlParams({ categories: nextCats, subcategories: prunedSubs });
  };

  const toggleSubcategory = (subSlug) => {
    updateUrlParams({
      subcategories: updateCsvList(selectedSubcategories, subSlug),
    });
  };

  const toggleFabric = (fabName) => {
    updateUrlParams({ fabrics: updateCsvList(selectedFabrics, fabName) });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const cleaned = searchInput.trim();
    setSearchDraft(null);
    updateUrlParams({ q: cleaned });
  };

  const clearAllFilters = () => {
    setSearchDraft(null);
    setSearchParams({}, { replace: true });
  };

  const activeFilterCount =
    selectedCategories.length +
    selectedSubcategories.length +
    selectedFabrics.length +
    (queryTerm ? 1 : 0);

  const title = useMemo(() => {
    if (banner?.name) return banner.name;
    if (slug === "sarees") return "Complete Saree Catalogue";
    if (slug === "jewellery") return "Heritage Saree Jewellery";
    if (queryTerm) return `Search Results: "${queryTerm}"`;
    return (slug || "All Sarees").replace(/-/g, " ");
  }, [banner, slug, queryTerm]);

  const renderFilterSidebar = () => (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-[#F5E7E8] pb-3">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-[#3D1023]">
          <SlidersHorizontal className="h-4 w-4 text-[#641B32]" />
          Filter Catalogue{" "}
          {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
        </span>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#A83F5E] hover:underline"
          >
            <RotateCcw className="h-3 w-3" /> Clear All
          </button>
        )}
      </div>

      {/* Search within collection */}
      <form onSubmit={handleSearchSubmit} className="flex gap-1.5">
        <TextField
          size="small"
          fullWidth
          label="Search saree name, category, fabric"
          value={searchInput}
          onChange={(e) => setSearchDraft(e.target.value)}
        />
        <button
          type="submit"
          aria-label="Apply search filter"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#641B32] text-[#FFF9F2] hover:bg-[#3D1023]"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>

      {/* Main Category Checkboxes */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[#641B32]">
            Category{" "}
            {selectedCategories.length > 0
              ? `(${selectedCategories.length})`
              : ""}
          </p>
          {selectedCategories.length > 0 && (
            <button
              type="button"
              onClick={() => updateUrlParams({ categories: [] })}
              className="cursor-pointer text-[11px] font-semibold text-[#A83F5E] hover:underline"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex max-h-60 flex-col gap-1 overflow-y-auto pr-1">
          {(facets.categories || []).map((cat) => (
            <FormControlLabel
              key={cat.slug}
              control={
                <Checkbox
                  size="small"
                  checked={selectedCategories.includes(cat.slug)}
                  onChange={() => toggleCategory(cat.slug)}
                />
              }
              label={
                <span className="text-xs text-[#3D1023]">
                  {cat.name}{" "}
                  <span className="text-[#A83F5E]">({cat.count})</span>
                </span>
              }
            />
          ))}
        </div>
      </div>

      {/* Subcategory Checkboxes */}
      {visibleSubcategories.length > 0 && (
        <div className="border-t border-[#F5E7E8] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-[#641B32]">
              Subcategory{" "}
              {selectedSubcategories.length > 0
                ? `(${selectedSubcategories.length})`
                : ""}
            </p>
            {selectedSubcategories.length > 0 && (
              <button
                type="button"
                onClick={() => updateUrlParams({ subcategories: [] })}
                className="cursor-pointer text-[11px] font-semibold text-[#A83F5E] hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto pr-1">
            {visibleSubcategories.map((sub) => (
              <FormControlLabel
                key={sub.slug}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedSubcategories.includes(sub.slug)}
                    onChange={() => toggleSubcategory(sub.slug)}
                  />
                }
                label={
                  <span className="text-xs text-[#3D1023]">
                    {sub.name}{" "}
                    <span className="text-[#A83F5E]">({sub.count})</span>
                  </span>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Fabric Checkboxes */}
      {(facets.fabrics || []).length > 0 && (
        <div className="border-t border-[#F5E7E8] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-[#641B32]">
              Fabric{" "}
              {selectedFabrics.length > 0 ? `(${selectedFabrics.length})` : ""}
            </p>
            {selectedFabrics.length > 0 && (
              <button
                type="button"
                onClick={() => updateUrlParams({ fabrics: [] })}
                className="cursor-pointer text-[11px] font-semibold text-[#A83F5E] hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          <div className="flex max-h-60 flex-col gap-1 overflow-y-auto pr-1">
            {facets.fabrics.map((fab) => (
              <FormControlLabel
                key={fab.name}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedFabrics.includes(fab.name)}
                    onChange={() => toggleFabric(fab.name)}
                  />
                }
                label={
                  <span className="text-xs text-[#3D1023]">
                    {fab.name}{" "}
                    <span className="text-[#A83F5E]">({fab.count})</span>
                  </span>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-8 pb-16">
      <section className="border-b border-[#D9A0A9]/40 bg-[#3D1023] text-[#FFF9F2]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-6 px-4 py-10 sm:px-6 md:grid-cols-12">
          <div className="flex flex-col gap-2 md:col-span-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C39A52]">
              Taantira Curated Atelier
            </p>
            <h1 className="font-serif text-3xl font-bold capitalize sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm text-[#F5E7E8]/85">
              {banner?.description ||
                "Explore 210 heritage sarees across 7 main weaves and 42 subcategories, alongside curated Saree Jewellery."}
            </p>
          </div>
          <div className="text-left md:col-span-4 md:text-right">
            <span className="inline-block rounded-full border border-[#C39A52]/40 bg-[#641B32] px-4 py-2 text-xs font-semibold text-[#FFF9F2]">
              {meta.total} {meta.total === 1 ? "Piece" : "Pieces"} Matching
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12">
        {/* Desktop Sidebar */}
        <aside className="hidden rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 shadow-sm lg:col-span-3 lg:block lg:self-start">
          {renderFilterSidebar()}
        </aside>

        {/* Mobile Filter Drawer */}
        <Drawer
          anchor="left"
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
        >
          <div className="flex h-full w-80 max-w-full flex-col justify-between bg-[#FFF9F2] p-5">
            <div className="overflow-y-auto">{renderFilterSidebar()}</div>
            <div className="border-t border-[#D9A0A9]/40 pt-3">
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Show {meta.total} Pieces
              </Button>
            </div>
          </div>
        </Drawer>

        {/* Product Grid Area */}
        <div className="flex flex-col gap-6 lg:col-span-9">
          {/* Toolbar + Active Filter Badges */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#D9A0A9]/40 bg-white px-4 py-3.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#641B32] px-3 py-1.5 text-xs font-semibold text-[#641B32] lg:hidden"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters{" "}
                  {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
                </button>
                <p className="text-xs font-medium text-[#641B32]">
                  Showing {products.length} of {meta.total} pieces
                </p>
              </div>
              <div className="w-52">
                <Select
                  value={sortOption}
                  onChange={(opt) =>
                    updateUrlParams({ sort: opt?.value || "newest" })
                  }
                  options={SORT_OPTIONS}
                  isSearchable={false}
                  className="text-xs"
                />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-[#F5E7E8] pt-3">
                {selectedCategories.map((cSlug) => {
                  const catObj = (facets.categories || []).find(
                    (c) => c.slug === cSlug,
                  );
                  return (
                    <button
                      key={`cat-${cSlug}`}
                      type="button"
                      onClick={() => toggleCategory(cSlug)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#641B32] px-3 py-1 text-xs font-medium text-[#FFF9F2] hover:bg-[#3D1023]"
                    >
                      <span>{catObj?.name || cSlug}</span>
                      <X className="h-3 w-3" />
                    </button>
                  );
                })}

                {selectedSubcategories.map((sSlug) => {
                  const subObj = (facets.subcategories || []).find(
                    (s) => s.slug === sSlug,
                  );
                  return (
                    <button
                      key={`sub-${sSlug}`}
                      type="button"
                      onClick={() => toggleSubcategory(sSlug)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#A83F5E] px-3 py-1 text-xs font-medium text-[#FFF9F2] hover:bg-[#641B32]"
                    >
                      <span>{subObj?.name || sSlug}</span>
                      <X className="h-3 w-3" />
                    </button>
                  );
                })}

                {selectedFabrics.map((fab) => (
                  <button
                    key={`fab-${fab}`}
                    type="button"
                    onClick={() => toggleFabric(fab)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#C39A52] bg-[#FFF9F2] px-3 py-1 text-xs font-semibold text-[#3D1023] hover:bg-[#F5E7E8]"
                  >
                    <span>Fabric: {fab}</span>
                    <X className="h-3 w-3" />
                  </button>
                ))}

                {queryTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchDraft(null);
                      updateUrlParams({ q: "" });
                    }}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#D9A0A9] bg-white px-3 py-1 text-xs font-medium text-[#3D1023]"
                  >
                    <span>Search: &ldquo;{queryTerm}&rdquo;</span>
                    <X className="h-3 w-3" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="ml-auto cursor-pointer text-xs font-semibold text-[#641B32] hover:underline"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="aspect-[3/4] animate-pulse rounded-2xl bg-[#F5E7E8]"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#D9A0A9]/50 bg-white p-12 text-center">
              <p className="text-base font-semibold text-[#3D1023]">
                No sarees match the current filter combination.
              </p>
              <p className="max-w-md text-xs text-[#641B32]/80">
                Try removing one or more category, subcategory, or fabric
                filters to view matching pieces.
              </p>
              <Button
                onClick={clearAllFilters}
                variant="contained"
                color="primary"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                  onToggleWishlist={toggleWishlist}
                  onQuickAddToCart={handleQuickAddToCart}
                  isWishlisted={wishlistedIds.has(Number(product.id))}
                />
              ))}
            </div>
          )}

          {meta.totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination
                count={meta.totalPages}
                page={page}
                onChange={(_, val) => updateUrlParams({ page: val }, false)}
                color="primary"
              />
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
