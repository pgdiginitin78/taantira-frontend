import { Heart, Eye, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatINR, calcDiscountPercent } from '../utils/formatters';

export default function ProductCard({ product, onQuickView, onToggleWishlist, isWishlisted = false }) {
  const primaryImage = product.images?.find((img) => img.is_primary)?.image_url || product.images?.[0]?.image_url || '/assets/products/saree-burgundy.jpg';
  const effectivePrice = product.sale_price || product.base_price;
  const discount = calcDiscountPercent(product.base_price, product.sale_price);
  const totalStock = (product.variants || []).reduce((sum, v) => sum + Number(v.stock_qty || 0), 0);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[#D9A0A9]/40 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5E7E8]">
        <Link to={`/products/${product.slug}`} className="block h-full w-full">
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
          />
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-[#641B32] px-2.5 py-0.5 text-[11px] font-semibold text-[#FFF9F2]">
              {discount}% OFF
            </span>
          )}
          {product.is_new_arrival && (
            <span className="rounded-full bg-[#C39A52] px-2.5 py-0.5 text-[11px] font-semibold text-[#3D1023]">
              NEW
            </span>
          )}
          {totalStock <= 0 && (
            <span className="rounded-full bg-[#3D1023]/90 px-2.5 py-0.5 text-[11px] font-medium text-[#FFF9F2]">
              Sold Out
            </span>
          )}
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          {onToggleWishlist && (
            <button
              type="button"
              onClick={() => onToggleWishlist(product)}
              aria-label="Toggle wishlist"
              className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition ${
                isWishlisted
                  ? 'border-[#641B32] bg-[#641B32] text-[#FFF9F2]'
                  : 'border-[#D9A0A9]/60 bg-white/95 text-[#641B32] hover:bg-[#F5E7E8]'
              }`}
            >
              <Heart className="h-4 w-4" />
            </button>
          )}
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              aria-label="Quick view product"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D9A0A9]/60 bg-white/95 text-[#641B32] shadow-sm transition hover:bg-[#F5E7E8]"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs text-[#A83F5E]">
            <span className="font-medium uppercase tracking-wider">
              {product.primaryCategory?.name || 'Taantira'}
            </span>
            {Number(product.rating_avg) > 0 && (
              <span className="inline-flex items-center gap-1 font-medium text-[#3D1023]">
                <Star className="h-3.5 w-3.5 fill-[#C39A52] text-[#C39A52]" />
                {Number(product.rating_avg).toFixed(1)}
              </span>
            )}
          </div>
          <Link
            to={`/products/${product.slug}`}
            className="line-clamp-2 text-sm font-semibold text-[#3D1023] transition hover:text-[#641B32]"
          >
            {product.name}
          </Link>
          <p className="mt-1 text-xs text-[#641B32]/75">{product.fabric}</p>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2 border-t border-[#F5E7E8] pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-[#641B32]">{formatINR(effectivePrice)}</span>
            {discount > 0 && (
              <span className="text-xs text-[#641B32]/50 line-through">{formatINR(product.base_price)}</span>
            )}
          </div>
          <span className="text-[11px] font-medium text-[#A8AD91]">
            {(product.variants || []).length} {(product.variants || []).length === 1 ? 'Option' : 'Options'}
          </span>
        </div>
      </div>
    </div>
  );
}
