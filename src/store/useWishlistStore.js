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
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  isWishlisted: (productId) => {
    const target = Number(productId);
    return get().items.some((entry) => Number(entry.id || entry.product?.id) === target);
  },

  toggleWishlist: async (product) => {
    if (!product?.id) return false;
    const targetId = Number(product.id);
    const previousItems = get().items;
    const currentlySaved = get().isWishlisted(targetId);
    const token = getAuthToken();

    let nextItems;
    if (currentlySaved) {
      nextItems = previousItems.filter((entry) => Number(entry.id || entry.product?.id) !== targetId);
    } else {
      nextItems = [...previousItems, { id: targetId, product }];
    }

    set({ items: nextItems });

    if (!token) {
      writeGuestWishlist(nextItems);
      const finalSaved = !currentlySaved;
      useToastStore.getState().showToast({
        type: 'wishlist',
        title: finalSaved ? 'Saved to Wishlist' : 'Removed from Wishlist',
        subtitle: product.name,
        imageUrl: product.images?.[0]?.image_url || null,
        badgeText: `Wishlist: ${nextItems.length}`,
        actionLabel: 'View Wishlist',
        actionTo: '/wishlist',
      });
      return finalSaved;
    }

    try {
      const res = await api.post('/users/wishlist/toggle', {
        product_id: targetId,
        variant_id: product.variants?.[0]?.id || null,
      });
      const finalSaved = Boolean(res.data?.data?.wishlisted);
      const refreshedItems = await get().fetchWishlist();
      useToastStore.getState().showToast({
        type: 'wishlist',
        title: finalSaved ? 'Saved to Wishlist' : 'Removed from Wishlist',
        subtitle: product.name,
        imageUrl: product.images?.[0]?.image_url || null,
        badgeText: `Wishlist: ${refreshedItems.length}`,
        actionLabel: 'View Wishlist',
        actionTo: '/account/wishlist',
      });
      return finalSaved;
    } catch (err) {
      set({ items: previousItems });
      useToastStore.getState().showToast({
        type: 'error',
        title: 'Could Not Save Wishlist',
        subtitle: err.response?.data?.message || 'Unable to update your database wishlist. Please try again.',
      });
      throw err;
    }
  },

  syncGuestWishlistToServer: async () => {
    if (!getAuthToken()) return;
    const guestItems = readGuestWishlist();
    if (guestItems.length > 0) {
      const existingServer = await get().fetchWishlist().catch(() => []);
      const existingIds = new Set(existingServer.map((entry) => Number(entry.id || entry.product?.id)));
      const remaining = [];
      for (const entry of guestItems) {
        const pid = Number(entry.id || entry.product?.id);
        if (!pid || existingIds.has(pid)) continue;
        try {
          await api.post('/users/wishlist/toggle', {
            product_id: pid,
            variant_id: entry.product?.variants?.[0]?.id || null,
          });
        } catch {
          remaining.push(entry);
        }
      }
      writeGuestWishlist(remaining);
    }
    await get().fetchWishlist().catch(() => []);
  },
}));
