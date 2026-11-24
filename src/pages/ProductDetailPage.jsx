import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Button,
  Checkbox,
  FormControlLabel,
  Rating,
  TextField,
  Alert,
  Chip,
} from '@mui/material';
import {
  ShoppingBag,
  Zap,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  MessageCircle,
  Heart,
  Gem,
  MapPin,
  ChevronRight,
  Truck,
} from 'lucide-react';
import api from '../services/api';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatINR, calcDiscountPercent, formatDateOnly } from '../utils/formatters';
import { reviewValidationSchema } from '../validations/schemas';
import ProductCard from '../components/ProductCard';
import SareeImageGallery from '../components/SareeImageGallery';
import {
  FALLBACK_PRODUCTS,
  getMatchingJewellery,
} from '../utils/fallbackCatalog';

const questionSchema = yup.object({
  question: yup.string().trim().min(5, 'Enter at least 5 characters').required('Question is required'),
});

export default function ProductDetailPage() {
  const { slug } = useParams();
  return <ProductDetailContent key={slug} slug={slug} />;
}

function ProductDetailContent({ slug }) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addItem = useCartStore((s) => s.addItem);

  const [detail, setDetail] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);

  // Saree tailoring & gift options
  const [matchingBlouse, setMatchingBlouse] = useState(false);
  const [blouseNotes, setBlouseNotes] = useState('');
  const [petticoat, setPetticoat] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftBox, setGiftBox] = useState(false);
  const [toteBag, setToteBag] = useState(false);
  const [customNotes, setCustomNotes] = useState('');

  // PIN code serviceability check
  const [pincode, setPincode] = useState('400050');
  const [pincodeInfo, setPincodeInfo] = useState(null);
  const [pincodeErr, setPincodeErr] = useState('');

  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');

  const reviewForm = useForm({
    resolver: yupResolver(reviewValidationSchema),
    defaultValues: { rating: 5, title: '', comment: '' },
  });

  const questionForm = useForm({
    resolver: yupResolver(questionSchema),
    defaultValues: { question: '' },
  });

  const buildFallbackDetail = (targetSlug) => {
    const found = FALLBACK_PRODUCTS.find((p) => p.slug === targetSlug) || FALLBACK_PRODUCTS[0];
    const mainSlug = found.primaryCategory?.parent?.slug || found.primaryCategory?.slug;
    const siblingSarees = FALLBACK_PRODUCTS.filter(
      (p) =>
        p.id !== found.id &&
        (p.primaryCategory?.slug === found.primaryCategory?.slug ||
          p.primaryCategory?.parent?.slug === mainSlug)
    ).slice(0, 4);
    const jewelProduct = FALLBACK_PRODUCTS.find((p) => p.primaryCategory?.slug === 'jewellery');

    return {
      product: { ...found, reviews: [], questions: [] },
      matching_products: jewelProduct && found.primaryCategory?.slug !== 'jewellery' ? [jewelProduct] : [],
      similar_products: siblingSarees,
    };
  };

  const loadProduct = () => {
    api
      .get(`/products/${slug}`)
      .then((res) => {
        const d = res.data?.data;
        setDetail(d);
        setSelectedVariant(d?.product?.variants?.[0] || null);
      })
      .catch(() => {
        const fallback = buildFallbackDetail(slug);
        setDetail(fallback);
        setSelectedVariant(fallback.product.variants?.[0] || null);
      });
  };

  useEffect(() => {
    let active = true;
    api
      .get(`/products/${slug}`)
      .then((res) => {
        if (!active) return;
        const d = res.data?.data;
        setDetail(d);
        setSelectedVariant(d?.product?.variants?.[0] || null);
      })
      .catch(() => {
        if (!active) return;
        const fallback = buildFallbackDetail(slug);
        setDetail(fallback);
        setSelectedVariant(fallback.product.variants?.[0] || null);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (!detail?.product) {
    return <div className="p-12 text-center text-sm text-[#641B32]">Loading saree specifications...</div>;
  }

  const product = detail.product;
  const subCategory = product.primaryCategory || {};
  const mainCategory = subCategory.parent || (subCategory.slug === 'jewellery' ? subCategory : { name: product.category || 'Sarees', slug: 'sarees' });
  const isJewellery = subCategory.slug === 'jewellery';

  const matchingJewelleryList =
    product.matching_jewellery?.length > 0
      ? product.matching_jewellery
      : !isJewellery
      ? getMatchingJewellery(mainCategory.slug)
      : [];

  const baseUnit = Number(selectedVariant?.price_override || product.sale_price || product.base_price);
  const addonCost =
    (subCategory.supports_blouse_option && matchingBlouse ? 1200 : 0) +
    (subCategory.supports_petticoat_option && petticoat ? 650 : 0) +
    (subCategory.supports_gift_options !== false && giftWrap ? 150 : 0) +
    (subCategory.supports_gift_options !== false && giftBox ? 350 : 0) +
    (subCategory.supports_gift_options !== false && toteBag ? 290 : 0);
  const effectiveUnit = baseUnit + addonCost;
  const discount = calcDiscountPercent(product.base_price, product.sale_price);
  const availableStock = selectedVariant
    ? Number(selectedVariant.stock_qty) - Number(selectedVariant.reserved_qty || 0)
    : 0;

  const handleToggleWishlist = async () => {
    setActionErr('');
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${slug}` } });
      return;
    }
    try {
      const res = await api.post('/users/wishlist/toggle', { product_id: product.id });
      const active = Boolean(res.data?.data?.wishlisted);
      setWishlisted(active);
      setActionMsg(active ? 'Saved to your Taantira wishlist.' : 'Removed from wishlist.');
    } catch {
      setWishlisted((w) => !w);
    }
  };

  const handleBagAction = async (buyNow = false) => {
    setActionErr('');
    setActionMsg('');
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${slug}` } });
      return;
    }
    if (!selectedVariant) return;
    try {
      await addItem({
        product_id: product.id,
        variant_id: selectedVariant.id,
        quantity,
        custom_options: {
          matching_blouse: subCategory.supports_blouse_option ? matchingBlouse : false,
          blouse_stitching_notes: subCategory.supports_blouse_option ? blouseNotes || null : null,
          petticoat: subCategory.supports_petticoat_option ? petticoat : false,
          gift_wrap: subCategory.supports_gift_options !== false ? giftWrap : false,
          gift_box: subCategory.supports_gift_options !== false ? giftBox : false,
          tote_bag: subCategory.supports_gift_options !== false ? toteBag : false,
          customisation_notes: subCategory.supports_customisation ? customNotes || null : null,
        },
      });
      if (buyNow) {
        navigate('/checkout');
      } else {
        setActionMsg('Added to your shopping bag.');
      }
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Unable to add item.');
    }
  };

  const handlePincodeCheck = async (e) => {
    e.preventDefault();
    setPincodeErr('');
    const trimmed = pincode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setPincodeErr('Enter a valid 6-digit Indian PIN code.');
      setPincodeInfo(null);
      return;
    }
    try {
      const res = await api.get(`/checkout/pincode/${trimmed}`);
      setPincodeInfo(res.data?.data);
    } catch {
      const metro = ['400001', '400050', '400051', '560001', '110001'].includes(trimmed);
      setPincodeInfo({
        pincode: trimmed,
        serviceable: true,
        cod_available: true,
        own_partner_available: metro,
        zone_name: metro ? 'Taantira Express Atelier Zone' : 'Insured Pan-India Handloom Courier',
        estimated_hours: metro ? 24 : 96,
      });
    }
  };

  const onSubmitReview = async (values) => {
    try {
      await api.post('/reviews', { product_id: product.id, ...values });
      reviewForm.reset();
      loadProduct();
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Sign in to submit a review.');
    }
  };

  const onSubmitQuestion = async (values) => {
    try {
      await api.post(`/products/${product.id}/questions`, values);
      questionForm.reset();
      loadProduct();
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Sign in to ask a question.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-6 sm:px-6 lg:py-8">
      {/* Structured Reference-Concept Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D9A0A9]/40 pb-3 text-xs text-[#641B32]/80">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link to="/" className="hover:text-[#641B32] hover:underline">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={isJewellery ? '/collections/jewellery' : '/collections/sarees'} className="hover:text-[#641B32] hover:underline">
            {isJewellery ? 'Saree Jewellery' : 'Sarees'}
          </Link>
          {!isJewellery && mainCategory?.name && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to={`/collections/${mainCategory.slug}`} className="hover:text-[#641B32] hover:underline">
                {mainCategory.name}
              </Link>
            </>
          )}
          {!isJewellery && subCategory?.name && subCategory.name !== mainCategory?.name && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link
                to={`/collections/${mainCategory.slug}?subcategories=${encodeURIComponent(subCategory.slug)}`}
                className="font-semibold text-[#3D1023] hover:text-[#641B32] hover:underline"
              >
                {subCategory.name}
              </Link>
            </>
          )}
        </div>
        <span className="font-medium text-[#A83F5E]">SKU: {selectedVariant?.sku || product.sku}</span>
      </nav>

      {/* Main Two-Column Reference-Inspired Product Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Column (~52% desktop): Multi-Angle Magnifier Gallery + Curated Jewellery Pairings */}
        <div className="flex flex-col gap-8 lg:col-span-6">
          <SareeImageGallery key={product.slug} product={product} />

          {/* Category-Matched Saree Jewellery Recommendations */}
          {matchingJewelleryList.length > 0 && (
            <div className="rounded-2xl border border-[#D9A0A9]/50 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#641B32]">
                  <Gem className="h-4 w-4 text-[#C39A52]" /> Curated Jewellery for {mainCategory.name}
                </p>
                <Link to="/collections/jewellery" className="text-xs font-semibold text-[#A83F5E] hover:underline">
                  View Capsule
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {matchingJewelleryList.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-start gap-3 rounded-xl border border-[#F5E7E8] bg-[#FFF9F2] p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#D9A0A9]/50 bg-white text-[#C39A52]">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <Gem className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.productSlug ? (
                        <Link
                          to={`/products/${item.productSlug}`}
                          className="text-xs font-bold text-[#3D1023] hover:text-[#641B32] hover:underline"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <p className="text-xs font-bold text-[#3D1023]">{item.name}</p>
                      )}
                      <p className="text-[11px] font-medium text-[#A83F5E]">{item.style}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-[#641B32]/80">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (~48% desktop): Product Info, Core Specifications, Purchase CTA & Delivery Check */}
        <div className="flex flex-col gap-5 lg:col-span-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#A83F5E]">
                {mainCategory.name}
                {subCategory?.name && subCategory.name !== mainCategory.name ? ` · ${subCategory.name}` : ''}
              </p>
              <h1 className="mt-1.5 font-serif text-3xl font-bold leading-snug text-[#3D1023]">
                {product.name}
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <Rating value={Number(product.rating_avg || 5)} precision={0.1} readOnly size="small" />
                <span className="text-xs font-medium text-[#641B32]">
                  {Number(product.rating_avg || 5).toFixed(1)} ({product.review_count || 0} Reviews)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-label="Save to wishlist"
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                wishlisted
                  ? 'border-[#641B32] bg-[#641B32] text-[#FFF9F2]'
                  : 'border-[#D9A0A9] bg-white text-[#641B32] hover:bg-[#F5E7E8]'
              }`}
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">{wishlisted ? 'Saved' : 'Favorite'}</span>
            </button>
          </div>

          {/* Minimal Catalogue Specifications Grid matching requirement (category, fabric, productName + subcategory) */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-[#D9A0A9]/40 bg-white p-4 text-xs sm:grid-cols-3">
            <div>
              <dt className="font-semibold uppercase tracking-wider text-[#A83F5E]">Category</dt>
              <dd className="mt-0.5 font-medium text-[#3D1023]">{mainCategory.name}</dd>
            </div>
            {!isJewellery && subCategory?.name && (
              <div>
                <dt className="font-semibold uppercase tracking-wider text-[#A83F5E]">Subcategory</dt>
                <dd className="mt-0.5 font-medium text-[#3D1023]">{subCategory.name}</dd>
              </div>
            )}
            <div>
              <dt className="font-semibold uppercase tracking-wider text-[#A83F5E]">Fabric</dt>
              <dd className="mt-0.5 font-medium text-[#3D1023]">{product.fabric}</dd>
            </div>
            {product.length_width && (
              <div>
                <dt className="font-semibold uppercase tracking-wider text-[#A83F5E]">Length</dt>
                <dd className="mt-0.5 font-medium text-[#3D1023]">{product.length_width}</dd>
              </div>
            )}
            {product.wash_care && (
              <div>
                <dt className="font-semibold uppercase tracking-wider text-[#A83F5E]">Care</dt>
                <dd className="mt-0.5 font-medium text-[#3D1023]">{product.wash_care}</dd>
              </div>
            )}
          </dl>

          <p className="text-sm leading-relaxed text-[#3D1023]/90">{product.description}</p>

          {/* Drape Options / Variant Selection */}
          {(product.variants || []).length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#3D1023]">
                Drape Option: <span className="text-[#A83F5E]">{selectedVariant?.size}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {(product.variants || []).map((variant) => {
                  const active = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                        active
                          ? 'border-[#641B32] bg-[#641B32] text-[#FFF9F2]'
                          : 'border-[#D9A0A9]/60 bg-white text-[#3D1023] hover:bg-[#F5E7E8]'
                      }`}
                    >
                      {variant.size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Highlighted Purchase & Price Box (inspired by reference screenshot) */}
          <div className="flex flex-col gap-4 rounded-2xl border border-[#D9A0A9]/50 bg-[#F5E7E8]/45 p-5">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-[#641B32]">{formatINR(effectiveUnit)}</span>
              {discount > 0 && (
                <>
                  <span className="text-base text-[#641B32]/50 line-through">
                    {formatINR(product.base_price)}
                  </span>
                  <Chip label={`${discount}% OFF`} size="small" color="secondary" />
                </>
              )}
              <span className="ml-auto text-xs font-semibold text-[#641B32]">
                {availableStock > 0 ? `In Stock (${availableStock} available)` : 'Currently Out of Stock'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-[#D9A0A9] bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 text-sm font-bold text-[#641B32]"
                >
                  -
                </button>
                <span className="px-3 text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, availableStock), q + 1))}
                  className="px-3.5 py-2.5 text-sm font-bold text-[#641B32]"
                >
                  +
                </button>
              </div>
              <Button
                variant="contained"
                color="primary"
                size="large"
                disabled={availableStock <= 0}
                onClick={() => handleBagAction(false)}
                startIcon={<ShoppingBag className="h-4 w-4" />}
                className="flex-1 py-3"
              >
                Add to Bag
              </Button>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                disabled={availableStock <= 0}
                onClick={() => handleBagAction(true)}
                startIcon={<Zap className="h-4 w-4" />}
                className="flex-1 py-3"
              >
                Buy Now
              </Button>
            </div>

            {actionMsg && <Alert severity="success">{actionMsg}</Alert>}
            {actionErr && <Alert severity="error">{actionErr}</Alert>}
          </div>

          {/* Atelier Tailoring & Gifting Options */}
          <div className="flex flex-col gap-2 rounded-2xl border border-[#D9A0A9]/40 bg-white p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#641B32]">
              <Sparkles className="h-4 w-4 text-[#C39A52]" /> Atelier Tailoring &amp; Gifting Options
            </p>

            {subCategory.supports_blouse_option && (
              <div className="flex flex-col gap-2">
                <FormControlLabel
                  control={
                    <Checkbox checked={matchingBlouse} onChange={(e) => setMatchingBlouse(e.target.checked)} size="small" />
                  }
                  label={
                    <span className="text-xs font-medium text-[#3D1023]">
                      Add Custom Tailored Matching Blouse (+{formatINR(1200)})
                    </span>
                  }
                />
                {matchingBlouse && (
                  <TextField
                    size="small"
                    fullWidth
                    label="Blouse Size / Neckline Preferences"
                    value={blouseNotes}
                    onChange={(e) => setBlouseNotes(e.target.value)}
                  />
                )}
              </div>
            )}

            {subCategory.supports_petticoat_option && (
              <FormControlLabel
                control={<Checkbox checked={petticoat} onChange={(e) => setPetticoat(e.target.checked)} size="small" />}
                label={
                  <span className="text-xs font-medium text-[#3D1023]">
                    Add Pure Cotton Satin Matching Petticoat (+{formatINR(650)})
                  </span>
                }
              />
            )}

            {subCategory.supports_gift_options !== false && (
              <div className="flex flex-wrap gap-3">
                <FormControlLabel
                  control={<Checkbox checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} size="small" />}
                  label={<span className="text-xs text-[#3D1023]">Gift Wrap (+{formatINR(150)})</span>}
                />
                <FormControlLabel
                  control={<Checkbox checked={giftBox} onChange={(e) => setGiftBox(e.target.checked)} size="small" />}
                  label={<span className="text-xs text-[#3D1023]">Keepsake Gift Box (+{formatINR(350)})</span>}
                />
                <FormControlLabel
                  control={<Checkbox checked={toteBag} onChange={(e) => setToteBag(e.target.checked)} size="small" />}
                  label={<span className="text-xs text-[#3D1023]">Muslin Tote Bag (+{formatINR(290)})</span>}
                />
              </div>
            )}

            {subCategory.supports_customisation && (
              <TextField
                size="small"
                fullWidth
                label="Fall-Pico / Hemming Notes (Optional)"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
              />
            )}
          </div>

          {/* Delivery & PIN Code Check Card (inspired by screenshot delivery block) */}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-sm font-bold text-[#3D1023]">
                <MapPin className="h-4 w-4 text-[#641B32]" /> Delivery Availability &amp; Dispatch
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#A83F5E]">
                <Truck className="h-3.5 w-3.5" /> Free shipping above {formatINR(2999)}
              </span>
            </div>

            <form onSubmit={handlePincodeCheck} className="flex items-start gap-2">
              <TextField
                size="small"
                fullWidth
                label="Enter 6-digit PIN Code"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
              <Button type="submit" variant="outlined" color="primary" className="h-10 shrink-0">
                Check
              </Button>
            </form>

            {pincodeErr && <p className="font-medium text-red-700">{pincodeErr}</p>}
            {pincodeInfo && (
              <div className="rounded-xl bg-[#FFF9F2] p-3 text-[#3D1023]">
                <p className="font-semibold text-[#641B32]">
                  {pincodeInfo.zone_name} (PIN {pincodeInfo.pincode})
                </p>
                <p className="mt-1 text-[#3D1023]/80">
                  Estimated dispatch &amp; delivery: within {pincodeInfo.estimated_hours <= 24 ? '24 hours' : '3–4 business days'} ·{' '}
                  {pincodeInfo.cod_available ? 'COD & UPI Available' : 'Prepaid Only'}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-4 border-t border-[#F5E7E8] pt-3 text-[#641B32]">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <RotateCcw className="h-3.5 w-3.5" /> 7-day easy return on uncustomized sarees
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> Handloom Authenticity Assured
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Matching & Similar Creations */}
      {detail.matching_products?.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-2xl font-bold text-[#3D1023]">
            Complete the Look — Heritage Saree Jewellery
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {detail.matching_products.map((mp) => (
              <ProductCard key={mp.id} product={mp} />
            ))}
          </div>
        </section>
      )}

      {detail.similar_products?.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-2xl font-bold text-[#3D1023]">
            More in {subCategory?.name || mainCategory?.name}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {detail.similar_products.map((sp) => (
              <ProductCard key={sp.id} product={sp} />
            ))}
          </div>
        </section>
      )}

      {/* Reviews & Questions */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#D9A0A9]/40 bg-white p-6">
          <h2 className="font-serif text-xl font-bold text-[#3D1023]">Customer Reviews</h2>
          {(product.reviews || []).length === 0 ? (
            <p className="text-xs text-[#641B32]/75">No reviews yet. Be the first to share your thoughts.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {product.reviews.map((rev) => (
                <div key={rev.id} className="rounded-xl bg-[#FFF9F2] p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{rev.author?.full_name || 'Customer'}</span>
                    <Rating value={rev.rating} readOnly size="small" />
                  </div>
                  {rev.title && <p className="mt-1 font-semibold">{rev.title}</p>}
                  <p className="mt-1 text-[#3D1023]/85">{rev.comment}</p>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={reviewForm.handleSubmit(onSubmitReview)}
            className="flex flex-col gap-3 border-t border-[#F5E7E8] pt-4"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[#641B32]">Write a Review</p>
            <Controller
              name="rating"
              control={reviewForm.control}
              render={({ field }) => (
                <Rating value={Number(field.value)} onChange={(_, val) => field.onChange(val || 5)} />
              )}
            />
            <Controller
              name="title"
              control={reviewForm.control}
              render={({ field }) => <TextField {...field} size="small" fullWidth label="Headline" />}
            />
            <Controller
              name="comment"
              control={reviewForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  label="Your Experience"
                  error={Boolean(reviewForm.formState.errors.comment)}
                  helperText={reviewForm.formState.errors.comment?.message}
                />
              )}
            />
            <Button type="submit" variant="outlined" color="primary" size="small">
              Submit Review
            </Button>
          </form>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-[#D9A0A9]/40 bg-white p-6">
          <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#3D1023]">
            <MessageCircle className="h-5 w-5 text-[#641B32]" /> Questions &amp; Answers
          </h2>
          {(product.questions || []).length === 0 ? (
            <p className="text-xs text-[#641B32]/75">
              Have a weave, border, or draping question? Ask our atelier team below.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {product.questions.map((q) => (
                <div key={q.id} className="rounded-xl bg-[#FFF9F2] p-3 text-xs">
                  <p className="font-semibold text-[#3D1023]">Q: {q.question}</p>
                  <p className="mt-1 text-[#641B32]">
                    {q.answer ? `A: ${q.answer}` : 'Awaiting atelier response.'}
                  </p>
                  <p className="mt-1 text-[10px] text-[#641B32]/60">{formatDateOnly(q.created_at)}</p>
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={questionForm.handleSubmit(onSubmitQuestion)}
            className="flex flex-col gap-3 border-t border-[#F5E7E8] pt-4"
          >
            <Controller
              name="question"
              control={questionForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  fullWidth
                  label="Ask a question about fabric, weave, or tailoring"
                  error={Boolean(questionForm.formState.errors.question)}
                  helperText={questionForm.formState.errors.question?.message}
                />
              )}
            />
            <Button type="submit" variant="outlined" color="primary" size="small">
              Ask Question
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
