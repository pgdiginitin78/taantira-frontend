import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import ProductCard from '../components/ProductCard';

export default function WishlistPage() {
  const { items, fetchWishlist, toggleWishlist, isWishlisted } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleQuickAddCart = async (product) => {
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#D9A0A9]/40 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A83F5E]">
            Saved Trousseau
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#3D1023]">
            Your Wishlist ({items.length})
          </h1>
        </div>
        <Link
          to="/collections/sarees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#641B32] hover:text-[#A83F5E]"
        >
          Continue Browsing <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-[#D9A0A9]" />
          <p className="mt-3 text-base font-semibold text-[#3D1023]">Your wishlist is empty.</p>
          <p className="mt-1 text-xs text-[#641B32]/80">
            Tap the heart icon on any handloom saree or jewellery piece to save it here.
          </p>
          <Link
            to="/collections/sarees"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#641B32] px-6 py-2.5 text-xs font-semibold text-[#FFF9F2] hover:bg-[#3D1023]"
          >
            Explore Sarees
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items
            .filter((entry) => Boolean(entry.product))
            .map((entry) => (
              <ProductCard
                key={entry.id || entry.product.id}
                product={entry.product}
                isWishlisted={isWishlisted(entry.product.id)}
                onToggleWishlist={toggleWishlist}
                onQuickAddToCart={handleQuickAddCart}
              />
            ))}
        </div>
      )}
    </div>
  );
}
