import { useState } from 'react';
import { Heart, Eye, Camera, ShoppingBag, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatINR, calcDiscountPercent } from '../utils/formatters';

export default function ProductCard({
  product,
  onQuickView,
  onToggleWishlist,
  onQuickAddToCart,
  isWishlisted = false,
}) {
  const [justAdded, setJustAdded] = useState(false);

  const primaryImage =
    product.images?.find((img) => img.is_primary)?.image_url ||
    product.images?.[0]?.image_url ||
    null;
  const effectivePrice = product.sale_price || product.base_price;
  const discount = calcDiscountPercent(product.base_price, product.sale_price);
  const totalStock = (product.variants || []).reduce((sum, v) => sum + Number(v.stock_qty || 0), 0);
  const availableAngles = (product.images || []).filter((img) => Boolean(img.image_url)).length;
  const mainCatName = product.primaryCategory?.parent?.name || product.category || 'Taantira';
  const subCatName = product.primaryCategory?.name || product.subcategory || '';
  const hasRealSales = Number(product.sales_count || 0) > 0;

  const handleCardAdd = async () => {
    if (!onQuickAddToCart || totalStock <= 0) return;
    await onQuickAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2200);
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-[#D9A0A9]/40 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5E7E8]">
        <Link to={`/products/${product.slug}`} className="block h-full w-full">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#FFF9F2] to-[#F5E7E8] p-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D9A0A9]/70 bg-white text-[#641B32] shadow-sm">
                <Camera className="h-5 w-5" />
              </div>
              <span className="mt-3 rounded-full border border-[#C39A52]/60 bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#641B32]">
                Image Needed · {availableAngles}/5 Angles
              </span>
              <p className="mt-3 font-serif text-sm font-semibold text-[#3D1023] line-clamp-2">
                {product.name}
              </p>
              <p className="mt-1 text-[11px] font-medium text-[#A83F5E]">
                {mainCatName}
                {subCatName && subCatName !== mainCatName ? ` · ${subCatName}` : ''}
              </p>
              <p className="mt-0.5 text-[11px] text-[#641B32]/75">{product.fabric}</p>
            </div>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-[#641B32] px-2.5 py-0.5 text-[11px] font-semibold text-[#FFF9F2]">
              {discount}% OFF
            </span>
          )}
          {hasRealSales && (
            <span className="rounded-full bg-[#C39A52] px-2.5 py-0.5 text-[11px] font-semibold text-[#3D1023]">
              Best Seller
            </span>
          )}
          {product.is_nauvari && (
            <span className="rounded-full bg-[#3D1023] px-2.5 py-0.5 text-[11px] font-semibold text-[#FFF9F2]">
              9 Vaari
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
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border shadow-sm transition ${
                isWishlisted
                  ? 'border-[#641B32] bg-[#641B32] text-[#FFF9F2] ring-2 ring-[#C39A52]/50'
                  : 'border-[#D9A0A9]/60 bg-white/95 text-[#641B32] hover:bg-[#F5E7E8]'
              }`}
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          )}
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              aria-label="Quick view product"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[#D9A0A9]/60 bg-white/95 text-[#641B32] shadow-sm transition hover:bg-[#F5E7E8]"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2 text-[11px] text-[#A83F5E]">
            <span className="truncate font-medium uppercase tracking-wider">
              {subCatName || mainCatName}
            </span>
            {isWishlisted && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F5E7E8] px-2 py-0.5 text-[10px] font-semibold text-[#641B32]">
                Saved
              </span>
            )}
          </div>
          <Link
            to={`/products/${product.slug}`}
            className="line-clamp-2 text-sm font-semibold text-[#3D1023] transition hover:text-[#641B32]"
          >
            {product.name}
          </Link>
          <p className="mt-1 text-xs text-[#641B32]/75">
            {mainCatName !== subCatName ? `${mainCatName} · ` : ''}
            {product.fabric}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#F5E7E8] pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-[#641B32]">{formatINR(effectivePrice)}</span>
            {discount > 0 && (
              <span className="text-xs text-[#641B32]/50 line-through">{formatINR(product.base_price)}</span>
            )}
          </div>
          {onQuickAddToCart && totalStock > 0 ? (
            <button
              type="button"
              onClick={handleCardAdd}
              className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                justAdded
                  ? 'bg-emerald-700 text-white'
                  : 'border border-[#641B32]/30 bg-[#FFF9F2] text-[#641B32] hover:bg-[#641B32] hover:text-[#FFF9F2]'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="h-3 w-3" /> Added
                </>
              ) : (
                <>
                  <ShoppingBag className="h-3 w-3" /> Add
                </>
              )}
            </button>
          ) : (
            <span className="text-[11px] font-medium text-[#A83F5E]">
              {availableAngles > 0 ? `${availableAngles}/5 Photos` : '0/5 Photos'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
