import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';

export default function AccountWishlistPage() {
  const [items, setItems] = useState([]);

  const loadWishlist = () => {
    api.get('/users/wishlist').then((res) => setItems(res.data?.data?.items || [])).catch(() => {});
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleToggle = async (product) => {
    await api.post('/users/wishlist/toggle', { product_id: product.id });
    loadWishlist();
  };

  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-bold text-[#3D1023]">Saved Wishlist</h1>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-8 text-center text-sm">
          Your wishlist is empty.{' '}
          <Link to="/collections/all" className="font-semibold text-[#641B32] underline">
            Explore Taantira pieces
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <ProductCard key={w.id} product={w.product} isWishlisted onToggleWishlist={handleToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
