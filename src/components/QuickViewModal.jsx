import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, Button } from '@mui/material';
import { X, ShoppingBag, ArrowRight, Camera, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatINR } from '../utils/formatters';
import { useCartStore } from '../store/useCartStore';

export default function QuickViewModal({ product, open, onClose }) {
  const addItem = useCartStore((s) => s.addItem);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!product) return null;

  const variants = product.variants || [];
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0] || null;
  const primaryImage = product.images?.[0]?.image_url || null;
  const price = selectedVariant?.price_override || product.sale_price || product.base_price;

  const handleAddToBag = async () => {
    if (!selectedVariant) return;
    setSubmitting(true);
    setFeedback('');
    try {
      await addItem({
        product_id: product.id,
        variant_id: selectedVariant.id,
        quantity: 1,
        productPreview: product,
      });
      setAddedSuccess(true);
      setFeedback('Added to your Taantira shopping bag.');
      setTimeout(() => setAddedSuccess(false), 2200);
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Unable to add item right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle className="flex items-center justify-between border-b border-[#F5E7E8] bg-[#FFF9F2] text-[#3D1023]">
        <span className="text-base font-semibold">{product.name}</span>
        <IconButton onClick={onClose} size="small" aria-label="Close quick view">
          <X className="h-5 w-5 text-[#641B32]" />
        </IconButton>
      </DialogTitle>
      <DialogContent className="bg-[#FFF9F2] p-6">
        <div className="grid grid-cols-1 gap-6 pt-3 md:grid-cols-2">
          <div className="aspect-[3/4] overflow-hidden rounded-xl bg-[#F5E7E8]">
            {primaryImage ? (
              <img src={primaryImage} alt={product.name} className="h-full w-full object-cover object-top" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-[#641B32]">
                <Camera className="h-8 w-8 text-[#A83F5E]" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider">Image Needed (0/5 Angles)</p>
                <p className="mt-1 text-xs text-[#3D1023]/75">{product.fabric}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#A83F5E]">
                {product.primaryCategory?.name} &bull; {product.fabric}
              </p>
              <p className="text-2xl font-bold text-[#641B32]">{formatINR(price)}</p>
              <p className="text-sm leading-relaxed text-[#3D1023]/85">{product.short_description || product.description}</p>

              <div className="pt-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#3D1023]">Select Size & Shade</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const active = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        disabled={v.stock_qty <= 0}
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          setFeedback('');
                        }}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? 'border-[#641B32] bg-[#641B32] text-[#FFF9F2]'
                            : 'border-[#D9A0A9] bg-white text-[#3D1023] hover:bg-[#F5E7E8]'
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        {v.size} &bull; {v.color_name} ({v.stock_qty} left)
                      </button>
                    );
                  })}
                </div>
              </div>

              {feedback && (
                <div className="rounded-lg bg-[#F5E7E8] px-3 py-2 text-xs font-medium text-[#641B32]">
                  {feedback}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="contained"
                color="primary"
                disabled={submitting || !selectedVariant || selectedVariant.stock_qty <= 0}
                onClick={handleAddToBag}
                startIcon={addedSuccess ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                className="py-2.5"
              >
                {submitting ? 'Adding...' : addedSuccess ? 'Added to Bag' : 'Add to Shopping Bag'}
              </Button>
              <Link
                to={`/products/${product.slug}`}
                onClick={onClose}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#641B32]/30 px-4 py-2 text-xs font-semibold text-[#641B32] transition hover:bg-[#F5E7E8]"
              >
                View Full Garment Details & Tailoring Options <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
