import { create } from 'zustand';
import api, { getAuthToken } from '../services/api';
import { useToastStore } from './useToastStore';

const GUEST_WISHLIST_KEY = 'taantira_guest_wishlist';

const readGuestWishlist = () => {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGuestWishlist = (items) => {
  try {
    localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
};

export const useWishlistStore = create((set, get) => ({
  items: readGuestWishlist(),
  loading: false,

  fetchWishlist: async () => {
    if (!getAuthToken()) {
      const localItems = readGuestWishlist();
      set({ items: localItems, loading: false });
      return localItems;
    }
    set({ loading: true });
    try {
      const res = await api.get('/users/wishlist');
      const serverItems = (res.data?.data?.items || []).map((entry) => ({
        id: entry.product_id || entry.product?.id,
        product: entry.product,
      }));
      set({ items: serverItems, loading: false });
      return serverItems;
    } catch {
      const localItems = readGuestWishlist();
      set({ items: localItems, loading: false });
      return localItems;
    }
  },

  isWishlisted: (productId) => {
    const target = Number(productId);
    return get().items.some((entry) => Number(entry.id || entry.product?.id) === target);
  },

  toggleWishlist: async (product) => {
    if (!product?.id) return false;
    const targetId = Number(product.id);
    const currentlySaved = get().isWishlisted(targetId);
    const token = getAuthToken();

    let nextItems;
    if (currentlySaved) {
      nextItems = get().items.filter((entry) => Number(entry.id || entry.product?.id) !== targetId);
    } else {
      nextItems = [...get().items, { id: targetId, product }];
    }

    set({ items: nextItems });
    if (!token) {
      writeGuestWishlist(nextItems);
    }

    let finalSaved = !currentlySaved;
    if (token) {
      try {
        const res = await api.post('/users/wishlist/toggle', { product_id: targetId });
        finalSaved = Boolean(res.data?.data?.wishlisted);
        await get().fetchWishlist();
      } catch {
        // Keep optimistic local fallback state
      }
    }

    const totalSaved = get().items.length;
    useToastStore.getState().showToast({
      type: 'wishlist',
      title: finalSaved ? 'Saved to Wishlist' : 'Removed from Wishlist',
      subtitle: product.name,
      imageUrl: product.images?.[0]?.image_url || null,
      badgeText: `Wishlist: ${totalSaved}`,
      actionLabel: 'View Wishlist',
      actionTo: token ? '/account/wishlist' : '/wishlist',
    });

    return finalSaved;
  },

  syncGuestWishlistToServer: async () => {
    if (!getAuthToken()) return;
    const guestItems = readGuestWishlist();
    if (guestItems.length > 0) {
      for (const entry of guestItems) {
        const pid = Number(entry.id || entry.product?.id);
        if (!pid) continue;
        try {
          const res = await api.post('/users/wishlist/toggle', { product_id: pid });
          if (!res.data?.data?.wishlisted) {
            await api.post('/users/wishlist/toggle', { product_id: pid });
          }
        } catch {
          // Ignore sync failures for stale entries
        }
      }
      writeGuestWishlist([]);
    }
    await get().fetchWishlist();
  },
}));
