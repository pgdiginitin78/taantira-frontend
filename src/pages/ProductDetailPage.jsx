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
import { ZoomIn, ShoppingBag, Zap, ShieldCheck, RotateCcw, Sparkles, MessageCircle } from 'lucide-react';
import api from '../services/api';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatINR, calcDiscountPercent, formatDateOnly } from '../utils/formatters';
import { reviewValidationSchema } from '../validations/schemas';
import ProductCard from '../components/ProductCard';
import { FALLBACK_PRODUCTS } from '../utils/fallbackCatalog';

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
  const [selectedImage, setSelectedImage] = useState('');
  const [zoomActive, setZoomActive] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Category-dependent options
  const [matchingBlouse, setMatchingBlouse] = useState(false);
  const [blouseNotes, setBlouseNotes] = useState('');
  const [petticoat, setPetticoat] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftBox, setGiftBox] = useState(false);
  const [toteBag, setToteBag] = useState(false);
  const [customNotes, setCustomNotes] = useState('');

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

  const loadProduct = () => {
    api
      .get(`/products/${slug}`)
      .then((res) => {
        const d = res.data?.data;
        setDetail(d);
        setSelectedImage(d?.product?.images?.[0]?.image_url || '/assets/products/saree-burgundy.jpg');
        setSelectedVariant(d?.product?.variants?.[0] || null);
      })
      .catch(() => {
        const found = FALLBACK_PRODUCTS.find((p) => p.slug === slug) || FALLBACK_PRODUCTS[0];
        setDetail({
          product: { ...found, reviews: [], questions: [] },
          matching_products: FALLBACK_PRODUCTS.slice(5, 7),
          similar_products: FALLBACK_PRODUCTS.slice(1, 5),
        });
        setSelectedImage(found.images?.[0]?.image_url);
        setSelectedVariant(found.variants?.[0] || null);
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
        setSelectedImage(d?.product?.images?.[0]?.image_url || '/assets/products/saree-burgundy.jpg');
        setSelectedVariant(d?.product?.variants?.[0] || null);
      })
      .catch(() => {
        if (!active) return;
        const found = FALLBACK_PRODUCTS.find((p) => p.slug === slug) || FALLBACK_PRODUCTS[0];
        setDetail({
          product: { ...found, reviews: [], questions: [] },
          matching_products: FALLBACK_PRODUCTS.slice(5, 7),
          similar_products: FALLBACK_PRODUCTS.slice(1, 5),
        });
        setSelectedImage(found.images?.[0]?.image_url);
        setSelectedVariant(found.variants?.[0] || null);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (!detail?.product) {
    return <div className="p-12 text-center text-sm text-[#641B32]">Loading garment specifications...</div>;
  }

  const product = detail.product;
  const category = product.primaryCategory || {};
  const images = product.images?.length ? product.images : [{ id: 1, image_url: '/assets/products/saree-burgundy.jpg' }];
  const baseUnit = Number(selectedVariant?.price_override || product.sale_price || product.base_price);
  const addonCost =
    (category.supports_blouse_option && matchingBlouse ? 1200 : 0) +
    (category.supports_petticoat_option && petticoat ? 650 : 0) +
    (category.supports_gift_options !== false && giftWrap ? 150 : 0) +
    (category.supports_gift_options !== false && giftBox ? 350 : 0) +
    (category.supports_gift_options !== false && toteBag ? 290 : 0);
  const effectiveUnit = baseUnit + addonCost;
  const discount = calcDiscountPercent(product.base_price, product.sale_price);
  const availableStock = selectedVariant ? Number(selectedVariant.stock_qty) - Number(selectedVariant.reserved_qty || 0) : 0;

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
          matching_blouse: category.supports_blouse_option ? matchingBlouse : false,
          blouse_stitching_notes: category.supports_blouse_option ? blouseNotes || null : null,
          petticoat: category.supports_petticoat_option ? petticoat : false,
          gift_wrap: category.supports_gift_options !== false ? giftWrap : false,
          gift_box: category.supports_gift_options !== false ? giftBox : false,
          tote_bag: category.supports_gift_options !== false ? toteBag : false,
          customisation_notes: category.supports_customisation ? customNotes || null : null,
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
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-8 sm:px-6">
      {/* Main Product Section */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Image Gallery + Zoom + Thumbnails */}
        <div className="space-y-4 lg:col-span-6">
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-[#D9A0A9]/50 bg-[#F5E7E8]">
            <img
              src={selectedImage}
              alt={product.name}
              onClick={() => setZoomActive((z) => !z)}
              className={`h-full w-full cursor-zoom-in object-cover object-top transition duration-500 ${
                zoomActive ? 'scale-125 cursor-zoom-out' : 'scale-100'
              }`}
            />
            <button
              type="button"
              onClick={() => setZoomActive((z) => !z)}
              className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-[#641B32] shadow"
            >
              <ZoomIn className="h-3.5 w-3.5" /> {zoomActive ? 'Reset Zoom' : 'Zoom Garment'}
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {images.map((img) => (
              <button
                key={img.id || img.image_url}
                type="button"
                onClick={() => setSelectedImage(img.image_url)}
                className={`h-24 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  selectedImage === img.image_url ? 'border-[#641B32]' : 'border-transparent opacity-75 hover:opacity-100'
                }`}
              >
                <img src={img.image_url} alt={img.alt_text || product.name} className="h-full w-full object-cover object-top" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Specifications & Actions */}
        <div className="space-y-6 lg:col-span-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#A83F5E]">
              <Link to={`/collections/${category.slug || 'all'}`} className="font-semibold uppercase tracking-widest hover:underline">
                {category.name || 'Collection'}
              </Link>
              <span>&bull;</span>
              <span>SKU: {selectedVariant?.sku || product.sku}</span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-bold text-[#3D1023]">{product.name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <Rating value={Number(product.rating_avg || 5)} precision={0.1} readOnly size="small" />
              <span className="text-xs font-medium text-[#641B32]">
                {Number(product.rating_avg || 5).toFixed(1)} ({product.review_count || 0} Reviews)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 border-y border-[#D9A0A9]/40 py-4">
            <span className="text-3xl font-bold text-[#641B32]">{formatINR(effectiveUnit)}</span>
            {discount > 0 && (
              <>
                <span className="text-base text-[#641B32]/50 line-through">{formatINR(product.base_price)}</span>
                <Chip label={`${discount}% OFF`} size="small" color="secondary" />
              </>
            )}
            <span className="ml-auto text-xs font-semibold text-[#A8AD91]">
              {availableStock > 0 ? `In Stock (${availableStock} available)` : 'Currently Out of Stock'}
            </span>
          </div>

          {/* Variants */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#3D1023]">
              Select Size &amp; Shade: <span className="text-[#A83F5E]">{selectedVariant?.color_name} / {selectedVariant?.size}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {(product.variants || []).map((variant) => {
                const active = selectedVariant?.id === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariant(variant)}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                      active
                        ? 'border-[#641B32] bg-[#641B32] text-[#FFF9F2]'
                        : 'border-[#D9A0A9]/60 bg-white text-[#3D1023] hover:bg-[#F5E7E8]'
                    }`}
                  >
                    <span>{variant.size}</span>
                    <span>&bull;</span>
                    <span>{variant.color_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category-Dependent Options */}
          <div className="space-y-3 rounded-2xl border border-[#D9A0A9]/40 bg-white p-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#641B32]">
              <Sparkles className="h-4 w-4 text-[#C39A52]" /> Atelier Tailoring &amp; Gifting Options
            </p>

            {category.supports_blouse_option && (
              <div className="space-y-2">
                <FormControlLabel
                  control={<Checkbox checked={matchingBlouse} onChange={(e) => setMatchingBlouse(e.target.checked)} size="small" />}
                  label={<span className="text-xs font-medium text-[#3D1023]">Add Custom Tailored Matching Blouse (+{formatINR(1200)})</span>}
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

            {category.supports_petticoat_option && (
              <FormControlLabel
                control={<Checkbox checked={petticoat} onChange={(e) => setPetticoat(e.target.checked)} size="small" />}
                label={<span className="text-xs font-medium text-[#3D1023]">Add Pure Cotton Satin Matching Petticoat (+{formatINR(650)})</span>}
              />
            )}

            {category.supports_gift_options !== false && (
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

            {category.supports_customisation && (
              <TextField
                size="small"
                fullWidth
                label="Customisation / Hemming Notes (Optional)"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
              />
            )}
          </div>

          {/* Quantity + CTA */}
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

          {/* Garment Specifications */}
          <div className="space-y-3 rounded-2xl border border-[#D9A0A9]/40 bg-white p-5 text-xs leading-relaxed text-[#3D1023]">
            <p className="text-sm font-bold text-[#641B32]">Craft &amp; Provenance</p>
            <p>{product.description}</p>
            {product.story && <p className="italic text-[#641B32]/85">{product.story}</p>}
            <dl className="grid grid-cols-1 gap-2 border-t border-[#F5E7E8] pt-3 sm:grid-cols-2">
              <div><dt className="font-semibold text-[#A83F5E]">Fabric</dt><dd>{product.fabric}</dd></div>
              <div><dt className="font-semibold text-[#A83F5E]">Occasion</dt><dd>{product.occasion}</dd></div>
              <div><dt className="font-semibold text-[#A83F5E]">Length &amp; Width</dt><dd>{product.length_width || 'Standard Atelier Fit'}</dd></div>
              <div><dt className="font-semibold text-[#A83F5E]">Wash Care</dt><dd>{product.wash_care || 'Dry clean recommended'}</dd></div>
              <div><dt className="font-semibold text-[#A83F5E]">Manufacturing</dt><dd>{product.manufacturing_info || 'Taantira Atelier, India'}</dd></div>
              <div><dt className="font-semibold text-[#A83F5E]">Country of Origin</dt><dd>{product.country_of_origin || 'India'}</dd></div>
            </dl>
            <div className="flex flex-wrap gap-4 border-t border-[#F5E7E8] pt-3 text-[#641B32]">
              <span className="inline-flex items-center gap-1.5 font-medium"><RotateCcw className="h-3.5 w-3.5" /> {product.return_policy}</span>
              <span className="inline-flex items-center gap-1.5 font-medium"><ShieldCheck className="h-3.5 w-3.5" /> Quality Assured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Matching & Similar Products */}
      {detail.matching_products?.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-2xl font-bold text-[#3D1023]">Complete the Look — Matching Pieces</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {detail.matching_products.map((mp) => (
              <ProductCard key={mp.id} product={mp} />
            ))}
          </div>
        </section>
      )}

      {detail.similar_products?.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-2xl font-bold text-[#3D1023]">Similar Creations</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {detail.similar_products.map((sp) => (
              <ProductCard key={sp.id} product={sp} />
            ))}
          </div>
        </section>
      )}

      {/* Reviews & Questions */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Reviews */}
        <div className="space-y-4 rounded-2xl border border-[#D9A0A9]/40 bg-white p-6">
          <h2 className="font-serif text-xl font-bold text-[#3D1023]">Customer Reviews</h2>
          {(product.reviews || []).length === 0 ? (
            <p className="text-xs text-[#641B32]/75">No reviews yet. Be the first to share your thoughts.</p>
          ) : (
            <div className="space-y-3">
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

          <form onSubmit={reviewForm.handleSubmit(onSubmitReview)} className="space-y-3 border-t border-[#F5E7E8] pt-4">
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
              render={({ field }) => (
                <TextField {...field} size="small" fullWidth label="Headline" />
              )}
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

        {/* Questions & Answers */}
        <div className="space-y-4 rounded-2xl border border-[#D9A0A9]/40 bg-white p-6">
          <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-[#3D1023]">
            <MessageCircle className="h-5 w-5 text-[#641B32]" /> Questions &amp; Answers
          </h2>
          {(product.questions || []).length === 0 ? (
            <p className="text-xs text-[#641B32]/75">Have a sizing or weave question? Ask our atelier team below.</p>
          ) : (
            <div className="space-y-3">
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

          <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)} className="space-y-3 border-t border-[#F5E7E8] pt-4">
            <Controller
              name="question"
              control={questionForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  fullWidth
                  label="Ask a question about fabric, fit, or tailoring"
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
