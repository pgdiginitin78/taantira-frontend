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
} from '@mui/material';
import {
  ShoppingBag,
  Zap,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  MessageCircle,
  Gem,
  ChevronRight,
  Truck,
  Home,
  Flame,
  Gift,
  Award,
  ShoppingCart,
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

const COLOR_SWATCH_CLASSES = [
  { name: 'Wine Burgundy', bg: 'bg-[#641B32]' },
  { name: 'Dark Maroon', bg: 'bg-[#8A2343]' },
  { name: 'Royal Crimson', bg: 'bg-[#B31B34]' },
  { name: 'Berry Rose', bg: 'bg-[#C96B84]' },
  { name: 'Dusty Blush', bg: 'bg-[#EEB9BE]' },
  { name: 'Warm Ivory', bg: 'bg-[#EFE0C8]' },
  { name: 'Antique Gold', bg: 'bg-[#C39A52]' },
  { name: 'Emerald Green', bg: 'bg-[#125236]' },
  { name: 'Midnight Indigo', bg: 'bg-[#1F2D4D]' },
];

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
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCH_CLASSES[0].name);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  // Optional Saree tailoring & gift checkboxes
  const [matchingBlouse, setMatchingBlouse] = useState(false);
  const [blouseNotes, setBlouseNotes] = useState('');
  const [petticoat, setPetticoat] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftBox, setGiftBox] = useState(false);

  // PIN code serviceability check
  const [pincode, setPincode] = useState('');
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
  const mainCategory =
    subCategory.parent ||
    (subCategory.slug === 'jewellery'
      ? subCategory
      : { name: product.category || 'Sarees', slug: 'sarees' });
  const isJewellery = subCategory.slug === 'jewellery';

  const matchingJewelleryList =
    product.matching_jewellery?.length > 0
      ? product.matching_jewellery
      : !isJewellery
      ? getMatchingJewellery(mainCategory.slug)
      : [];

  const linkedChandbali = (detail.matching_products || [])[0] || FALLBACK_PRODUCTS.find((p) => p.primaryCategory?.slug === 'jewellery');

  const baseUnit = Number(selectedVariant?.price_override || product.sale_price || product.base_price);
  const addonCost =
    (subCategory.supports_blouse_option && matchingBlouse ? 1200 : 0) +
    (subCategory.supports_petticoat_option && petticoat ? 650 : 0) +
    (subCategory.supports_gift_options !== false && giftWrap ? 150 : 0) +
    (subCategory.supports_gift_options !== false && giftBox ? 350 : 0);
  const effectiveUnit = baseUnit + addonCost;
  const discount = calcDiscountPercent(product.base_price, product.sale_price);
  const availableStock = selectedVariant
    ? Number(selectedVariant.stock_qty) - Number(selectedVariant.reserved_qty || 0)
    : 0;
  const hasRealSales = Number(product.sales_count || 0) > 0;

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

  const handleShare = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      setActionMsg('Product link copied to clipboard.');
    } catch {
      setActionMsg('Copy URL from your address bar to share.');
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
          customisation_notes: selectedColor ? `Preferred Shade: ${selectedColor}` : null,
        },
      });
      if (buyNow) {
        navigate('/checkout');
      } else {
        setActionMsg('Added to your shopping cart.');
      }
    } catch (err) {
      setActionErr(err.response?.data?.message || 'Unable to add item.');
    }
  };

  const handleAddMatchingItem = async (item) => {
    if (item.productSlug) {
      navigate(`/products/${item.productSlug}`);
      return;
    }
    if (linkedChandbali?.variants?.[0]) {
      if (!isAuthenticated) {
        navigate('/login', { state: { from: `/products/${slug}` } });
        return;
      }
      try {
        await addItem({ product_id: linkedChandbali.id, variant_id: linkedChandbali.variants[0].id, quantity: 1 });
        setActionMsg(`Added ${linkedChandbali.name} to your cart.`);
      } catch {
        navigate('/collections/jewellery');
      }
      return;
    }
    navigate('/collections/jewellery');
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
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-5 sm:px-6">
      {/* Breadcrumb Bar matching exact reference hierarchy */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-[#641B32]/75">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-[#641B32] hover:underline">
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-[#D9A0A9]" />
        <Link to={isJewellery ? '/collections/jewellery' : '/collections/sarees'} className="hover:text-[#641B32] hover:underline">
          {isJewellery ? 'Saree Jewellery' : 'Sarees'}
        </Link>
        {!isJewellery && mainCategory?.name && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-[#D9A0A9]" />
            <Link to={`/collections/${mainCategory.slug}`} className="hover:text-[#641B32] hover:underline">
              {mainCategory.name}
            </Link>
          </>
        )}
        {!isJewellery && subCategory?.name && subCategory.name !== mainCategory?.name && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-[#D9A0A9]" />
            <Link
              to={`/collections/${mainCategory.slug}?subcategories=${encodeURIComponent(subCategory.slug)}`}
              className="hover:text-[#641B32] hover:underline"
            >
              {subCategory.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-[#D9A0A9]" />
        <span className="font-semibold text-[#3D1023]">{product.name}</span>
      </nav>

      {/* Main 3-Column Reference Product Details Section */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-start">
        {/* Column 1: Left Multi-Angle Saree Gallery (5 cols) */}
        <div className="lg:col-span-5">
          <SareeImageGallery
            key={product.slug}
            product={product}
            wishlisted={wishlisted}
            onToggleWishlist={handleToggleWishlist}
            onShare={handleShare}
          />
        </div>

        {/* Column 2: Center Product Info, Swatches, Quantity, Add to Cart, PIN Check, Trust Strip & Tabs (4 cols) */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          {hasRealSales ? (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#F7E8D0] px-3 py-1 text-xs font-semibold text-[#8A5A12]">
              <Flame className="h-3.5 w-3.5 text-[#C39A52]" /> Bestseller
            </span>
          ) : (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#F7E8D0] px-3 py-1 text-xs font-semibold text-[#8A5A12]">
              <Sparkles className="h-3.5 w-3.5 text-[#C39A52]" /> Handloom Heritage
            </span>
          )}

          <div>
            <h1 className="font-serif text-2xl font-bold leading-snug text-[#3D1023] sm:text-[26px]">
              {product.name}
            </h1>
            <p className="mt-1 text-xs text-[#641B32]/80">
              {mainCategory.name} &nbsp;|&nbsp; Fabric: <span className="font-medium text-[#3D1023]">{product.fabric}</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Rating value={Number(product.rating_avg || 5)} precision={0.1} readOnly size="small" />
              <span className="text-xs font-medium text-[#3D1023]">
                {Number(product.rating_avg || 5).toFixed(1)} ({product.review_count || 0} reviews)
              </span>
            </div>
          </div>

          {/* Price Row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-bold text-[#641B32]">{formatINR(effectiveUnit)}</span>
            {discount > 0 && (
              <>
                <span className="text-base text-[#641B32]/45 line-through">{formatINR(product.base_price)}</span>
                <span className="rounded-md bg-[#F7E8D0] px-2.5 py-0.5 text-xs font-semibold text-[#8A5A12]">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>

          {/* Shade Swatches */}
          {!isJewellery && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-[#3D1023]">
                Color: <span className="font-normal text-[#641B32]">{selectedColor}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_SWATCH_CLASSES.map((swatch) => {
                  const active = selectedColor === swatch.name;
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      onClick={() => setSelectedColor(swatch.name)}
                      title={swatch.name}
                      aria-label={swatch.name}
                      className={`h-7 w-7 rounded-full border-2 border-white shadow-sm transition ${swatch.bg} ${
                        active ? 'ring-2 ring-[#641B32] ring-offset-1' : 'hover:scale-105'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Stock Indicator Row */}
          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#3D1023]">Quantity:</span>
              <div className="flex items-center rounded-full border border-[#D9A0A9]/70 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1 text-sm font-bold text-[#641B32]"
                >
                  -
                </button>
                <span className="min-w-6 text-center text-xs font-semibold text-[#3D1023]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, availableStock), q + 1))}
                  className="px-3 py-1 text-sm font-bold text-[#641B32]"
                >
                  +
                </button>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <span className={`h-2 w-2 rounded-full ${availableStock > 0 ? 'bg-emerald-600' : 'bg-red-600'}`} />
              {availableStock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Primary Pill Action Buttons: Add to Cart & Buy Now */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={availableStock <= 0}
              onClick={() => handleBagAction(false)}
              className="flex items-center justify-center gap-2 rounded-full bg-[#641B32] px-4 py-3 text-xs font-semibold text-[#FFF9F2] shadow-sm transition hover:bg-[#3D1023] disabled:opacity-50 sm:text-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Add to Cart</span>
            </button>
            <button
              type="button"
              disabled={availableStock <= 0}
              onClick={() => handleBagAction(true)}
              className="flex items-center justify-center gap-2 rounded-full border border-[#C39A52] bg-[#FFF9F2] px-4 py-3 text-xs font-semibold text-[#3D1023] transition hover:bg-[#F5E7E8] disabled:opacity-50 sm:text-sm"
            >
              <Zap className="h-4 w-4 text-[#C39A52]" />
              <span>Buy Now</span>
            </button>
          </div>

          {actionMsg && <Alert severity="success">{actionMsg}</Alert>}
          {actionErr && <Alert severity="error">{actionErr}</Alert>}

          {/* Check Delivery Box matching Image 1 */}
          <form
            onSubmit={handlePincodeCheck}
            className="flex items-center gap-2 rounded-xl border border-[#D9A0A9]/50 bg-[#FDF7F2] px-3 py-2"
          >
            <Truck className="h-4 w-4 shrink-0 text-[#641B32]" />
            <span className="hidden text-xs font-medium text-[#3D1023] sm:inline">Check Delivery</span>
            <input
              type="text"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              placeholder="Enter your PIN code"
              className="min-w-0 flex-1 rounded-full border border-[#D9A0A9]/60 bg-white px-3 py-1.5 text-xs text-[#3D1023] placeholder-[#641B32]/50 focus:border-[#641B32] focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-[#3D1023] px-4 py-1.5 text-xs font-semibold text-[#FFF9F2] transition hover:bg-[#641B32]"
            >
              Check
            </button>
          </form>
          {pincodeErr && <p className="text-xs font-medium text-red-700">{pincodeErr}</p>}
          {pincodeInfo && (
            <p className="rounded-xl bg-[#FDF7F2] px-3 py-2 text-xs text-[#3D1023]">
              <strong className="text-[#641B32]">{pincodeInfo.zone_name} ({pincodeInfo.pincode}):</strong>{' '}
              Delivery within {pincodeInfo.estimated_hours <= 24 ? '24 hours' : '3–4 days'} ·{' '}
              {pincodeInfo.cod_available ? 'COD & UPI Available' : 'Prepaid'}
            </p>
          )}

          {/* 4 Trust Badges Strip matching Image 1 */}
          <div className="grid grid-cols-4 gap-2 border-b border-[#D9A0A9]/30 pb-4 pt-1 text-center text-[10px] leading-tight text-[#3D1023]">
            <div className="flex flex-col items-center gap-1">
              <Gift className="h-4 w-4 text-[#641B32]" />
              <span>Free Shipping Above ₹2,999</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <RotateCcw className="h-4 w-4 text-[#641B32]" />
              <span>Easy Returns</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-[#641B32]" />
              <span>Secure Payments</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Award className="h-4 w-4 text-[#641B32]" />
              <span>Authentic Handloom</span>
            </div>
          </div>

          {/* 4-Tab Section matching Image 1 ("Product Details", "Fabric & Care", "Delivery & Returns", "Reviews") */}
          <div>
            <div className="flex flex-wrap gap-5 border-b border-[#D9A0A9]/35 text-xs font-semibold">
              {[
                { key: 'details', label: 'Product Details' },
                { key: 'fabric', label: 'Fabric & Care' },
                { key: 'delivery', label: 'Delivery & Returns' },
                { key: 'reviews', label: `Reviews (${product.review_count || 0})` },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`pb-2.5 transition ${
                    activeTab === t.key
                      ? 'border-b-2 border-[#641B32] text-[#641B32]'
                      : 'text-[#3D1023]/65 hover:text-[#641B32]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="pt-3 text-xs leading-relaxed text-[#3D1023]/90">
              {activeTab === 'details' && (
                <div className="flex flex-col gap-3">
                  <p>{product.description}</p>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-3 border border-[#D9A0A9]/30">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-[#A83F5E]">Category</span>
                      <span className="font-semibold text-[#3D1023]">{mainCategory.name}</span>
                    </div>
                    {!isJewellery && subCategory?.name && (
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-[#A83F5E]">Subcategory</span>
                        <span className="font-semibold text-[#3D1023]">{subCategory.name}</span>
                      </div>
                    )}
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-[#A83F5E]">Fabric</span>
                      <span className="font-semibold text-[#3D1023]">{product.fabric}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-[#A83F5E]">SKU</span>
                      <span className="font-semibold text-[#3D1023]">{selectedVariant?.sku || product.sku}</span>
                    </div>
                  </div>
                  {(subCategory.supports_blouse_option || subCategory.supports_gift_options !== false) && (
                    <div className="flex flex-col gap-1.5 rounded-xl border border-[#D9A0A9]/35 bg-white p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#641B32]">
                        Atelier Tailoring &amp; Gifting
                      </p>
                      {subCategory.supports_blouse_option && (
                        <>
                          <FormControlLabel
                            control={<Checkbox checked={matchingBlouse} onChange={(e) => setMatchingBlouse(e.target.checked)} size="small" />}
                            label={<span className="text-xs">Custom Tailored Blouse (+{formatINR(1200)})</span>}
                          />
                          {matchingBlouse && (
                            <TextField size="small" fullWidth label="Blouse Measurements / Notes" value={blouseNotes} onChange={(e) => setBlouseNotes(e.target.value)} />
                          )}
                        </>
                      )}
                      {subCategory.supports_petticoat_option && (
                        <FormControlLabel
                          control={<Checkbox checked={petticoat} onChange={(e) => setPetticoat(e.target.checked)} size="small" />}
                          label={<span className="text-xs">Cotton Satin Petticoat (+{formatINR(650)})</span>}
                        />
                      )}
                      <div className="flex flex-wrap gap-2">
                        <FormControlLabel
                          control={<Checkbox checked={giftWrap} onChange={(e) => setGiftWrap(e.target.checked)} size="small" />}
                          label={<span className="text-xs">Gift Wrap (+{formatINR(150)})</span>}
                        />
                        <FormControlLabel
                          control={<Checkbox checked={giftBox} onChange={(e) => setGiftBox(e.target.checked)} size="small" />}
                          label={<span className="text-xs">Keepsake Box (+{formatINR(350)})</span>}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'fabric' && (
                <div className="flex flex-col gap-2">
                  <p><strong>Material:</strong> {product.fabric}</p>
                  {product.length_width && <p><strong>Dimensions:</strong> {product.length_width}</p>}
                  <p><strong>Care Guide:</strong> {product.wash_care || 'Dry clean recommended. Store folded in soft unbleached muslin.'}</p>
                </div>
              )}

              {activeTab === 'delivery' && (
                <div className="flex flex-col gap-2">
                  <p>Insured doorstep delivery across India with live OTP handoff verification.</p>
                  <p>Complimentary shipping on orders above ₹2,999. 7-day easy return on uncustomized sarees.</p>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="flex flex-col gap-3">
                  {(product.reviews || []).length === 0 ? (
                    <p>No customer reviews yet for this saree.</p>
                  ) : (
                    product.reviews.map((rev) => (
                      <div key={rev.id} className="rounded-xl bg-white p-3 border border-[#D9A0A9]/30">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{rev.author?.full_name || 'Patron'}</span>
                          <Rating value={rev.rating} readOnly size="small" />
                        </div>
                        {rev.title && <p className="mt-1 font-semibold">{rev.title}</p>}
                        <p className="mt-1">{rev.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Right "Complete Your Look - Matching Jewellery" Card matching Image 1 (3 cols) */}
        <aside className="rounded-2xl border border-[#C39A52]/40 bg-[#FDF8F2] p-5 shadow-sm lg:col-span-3">
          <div className="text-center">
            <h2 className="font-serif text-lg font-bold text-[#3D1023]">Complete Your Look</h2>
            <p className="text-xs text-[#A83F5E]">Matching Jewellery</p>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {(matchingJewelleryList.length > 0
              ? matchingJewelleryList.slice(0, 3)
              : [
                  {
                    name: 'Ruhani Pearl Chandbali',
                    style: '₹2,990',
                    image_url: '/assets/products/jewellery-chandbali.jpg',
                    productSlug: 'ruhani-champagne-gold-pearl-chandbali-set',
                  },
                ]
            ).map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-xl border border-[#D9A0A9]/45 bg-white p-2.5 shadow-sm transition hover:border-[#641B32]/50"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#D9A0A9]/40 bg-[#FFF9F2] text-[#C39A52]">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <Gem className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#3D1023]">{item.name}</p>
                  <p className="truncate text-[11px] text-[#641B32]/80">{item.style}</p>
                  {item.productSlug && (
                    <p className="mt-0.5 text-xs font-bold text-[#641B32]">₹2,990</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleAddMatchingItem(item)}
                  aria-label={`View or add ${item.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#641B32] text-[#FFF9F2] transition hover:bg-[#3D1023]"
                >
                  <ShoppingBag className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Similar Creations & Atelier Reviews/Q&A Below Fold */}
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#D9A0A9]/40 bg-white p-6">
          <h2 className="font-serif text-xl font-bold text-[#3D1023]">Write a Review</h2>
          <form onSubmit={reviewForm.handleSubmit(onSubmitReview)} className="flex flex-col gap-3">
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
          {(product.questions || []).length > 0 && (
            <div className="flex flex-col gap-2">
              {product.questions.map((q) => (
                <div key={q.id} className="rounded-xl bg-[#FFF9F2] p-3 text-xs">
                  <p className="font-semibold text-[#3D1023]">Q: {q.question}</p>
                  <p className="mt-1 text-[#641B32]">{q.answer ? `A: ${q.answer}` : 'Awaiting atelier response.'}</p>
                  <p className="mt-1 text-[10px] text-[#641B32]/60">{formatDateOnly(q.created_at)}</p>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)} className="flex flex-col gap-3">
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
