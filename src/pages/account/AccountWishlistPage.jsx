import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../../store/useWishlistStore';
import { useCartStore } from '../../store/useCartStore';
import ProductCard from '../../components/ProductCard';

export default function AccountWishlistPage() {
  const { items, fetchWishlist, toggleWishlist, isWishlisted } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9A0A9]/40 pb-4">
        <h1 className="font-serif text-2xl font-bold text-[#3D1023]">
          Saved Wishlist ({items.length})
        </h1>
        <Link
          to="/collections/sarees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#641B32] hover:text-[#A83F5E]"
        >
          Browse More Sarees <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-10 text-center">
          <Heart className="mx-auto h-8 w-8 text-[#D9A0A9]" />
          <p className="mt-2 text-sm text-[#641B32]/80">No saved sarees or jewellery in your wishlist yet.</p>
          <Link
            to="/collections/sarees"
            className="mt-4 inline-block rounded-full bg-[#641B32] px-5 py-2 text-xs font-semibold text-[#FFF9F2]"
          >
            Browse Weaves
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items
            .filter((entry) => Boolean(entry.product))
            .map((entry) => (
              <ProductCard
                key={entry.id || entry.product.id}
                product={entry.product}
                isWishlisted={isWishlisted(entry.product.id)}
                onToggleWishlist={toggleWishlist}
                onQuickAddToCart={handleQuickAddToCart}
              />
            ))}
        </div>
      )}
    </div>
  );
}
