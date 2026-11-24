import { create } from 'zustand';
import api, { getAuthToken } from '../services/api';
import { useToastStore } from './useToastStore';
import { useWishlistStore } from './useWishlistStore';

const GUEST_CART_KEY = 'taantira_guest_cart';

const readGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
};

const buildGuestSummary = (items) => {
  const lineItems = items.map((item) => {
    const unit = Number(
      item.variant?.price_override || item.product?.sale_price || item.product?.base_price || 0
    );
    return {
      ...item,
      cart_item_id: item.id,
      unit_price: unit,
      line_subtotal: unit * Number(item.quantity || 1),
    };
  });
  const subtotal = lineItems.reduce((sum, l) => sum + Number(l.line_subtotal || 0), 0);
  const shippingFee = subtotal === 0 || subtotal >= 2999 ? 0 : 149;
  return {
    lineItems,
    subtotal,
    discountAmount: 0,
    coupon: null,
    taxAmount: 0,
    shippingFee,
    totalAmount: subtotal + shippingFee,
    upiVpa: 'taantira.atelier@upi',
    upiPayeeName: 'Taantira Handloom & Couture Atelier',
    freeShippingThreshold: 2999,
  };
};

const initialGuestItems = getAuthToken() ? [] : readGuestCart();

export const useCartStore = create((set, get) => ({
  items: initialGuestItems,
  summary: buildGuestSummary(initialGuestItems),
  loading: false,

  fetchCart: async (pincode = null) => {
    if (!getAuthToken()) {
      const localItems = readGuestCart();
      const summary = buildGuestSummary(localItems);
      set({ items: localItems, summary, loading: false });
      return { items: localItems, summary };
    }
    set({ loading: true });
    try {
      const res = await api.get('/cart', { params: pincode ? { pincode } : {} });
      const data = res.data.data;
      set({ items: data.items || [], summary: data.summary || {}, loading: false });
      return data;
    } catch {
      set({ loading: false });
      return null;
    }
  },

  addItem: async ({ product_id, variant_id, quantity = 1, custom_options = null, productPreview = null }) => {
    const token = getAuthToken();

    if (!token) {
      const existing = readGuestCart();
      const idx = existing.findIndex(
        (i) => Number(i.product_id) === Number(product_id) && Number(i.variant_id) === Number(variant_id)
      );
      let nextItems;
      if (idx >= 0) {
        nextItems = existing.map((item, i) =>
          i === idx ? { ...item, quantity: Number(item.quantity || 1) + Number(quantity || 1) } : item
        );
      } else {
        const variant =
          (productPreview?.variants || []).find((v) => Number(v.id) === Number(variant_id)) ||
          productPreview?.variants?.[0] || { id: variant_id, size: 'Free Size', color_name: 'Signature Hue' };
        nextItems = [
          ...existing,
          {
            id: `guest-${Date.now()}`,
            product_id,
            variant_id,
            quantity,
            custom_options,
            custom_options_json: custom_options || {},
            product: productPreview || { id: product_id, name: 'Taantira Garment' },
            variant,
          },
        ];
      }
      writeGuestCart(nextItems);
      const summary = buildGuestSummary(nextItems);
      set({ items: nextItems, summary });

      const bagCount = nextItems.reduce((sum, i) => sum + Number(i.quantity || 1), 0);
      useToastStore.getState().showToast({
        type: 'cart',
        title: 'Added to Shopping Bag',
        subtitle: productPreview?.name || 'Taantira Handloom Creation',
        imageUrl: productPreview?.images?.[0]?.image_url || null,
        badgeText: `Cart: ${bagCount}`,
        actionLabel: 'View Cart',
        actionTo: '/cart',
      });
      return { items: nextItems, summary };
    }

    const res = await api.post('/cart/items', { product_id, variant_id, quantity, custom_options });
    const data = res.data.data;
    const nextItems = data.items || [];
    set({ items: nextItems, summary: data.summary || {} });

    const addedRecord = nextItems.find((i) => Number(i.product_id) === Number(product_id));
    const bagCount = nextItems.reduce((sum, i) => sum + Number(i.quantity || 1), 0);
    useToastStore.getState().showToast({
      type: 'cart',
      title: 'Added to Shopping Bag',
      subtitle: productPreview?.name || addedRecord?.product?.name || 'Taantira Handloom Creation',
      imageUrl: productPreview?.images?.[0]?.image_url || addedRecord?.product?.images?.[0]?.image_url || null,
      badgeText: `Cart: ${bagCount}`,
      actionLabel: 'View Cart',
      actionTo: '/cart',
    });

    return data;
  },

  updateQty: async (itemId, quantity) => {
    if (!getAuthToken()) {
      const nextItems = readGuestCart()
        .map((i) => (i.id === itemId ? { ...i, quantity: Math.max(1, Number(quantity)) } : i));
      writeGuestCart(nextItems);
      const summary = buildGuestSummary(nextItems);
      set({ items: nextItems, summary });
      return { items: nextItems, summary };
    }
    const res = await api.put(`/cart/items/${itemId}`, { quantity });
    const data = res.data.data;
    set({ items: data.items || [], summary: data.summary || {} });
    return data;
  },

  removeItem: async (itemId) => {
    if (!getAuthToken()) {
      const nextItems = readGuestCart().filter((i) => i.id !== itemId);
      writeGuestCart(nextItems);
      const summary = buildGuestSummary(nextItems);
      set({ items: nextItems, summary });
      return { items: nextItems, summary };
    }
    const res = await api.delete(`/cart/items/${itemId}`);
    const data = res.data.data;
    set({ items: data.items || [], summary: data.summary || {} });
    return data;
  },

  moveToWishlist: async (itemId) => {
    if (!getAuthToken()) {
      const current = readGuestCart();
      const targetItem = current.find((i) => i.id === itemId);
      const nextItems = current.filter((i) => i.id !== itemId);
      writeGuestCart(nextItems);
      const summary = buildGuestSummary(nextItems);
      set({ items: nextItems, summary });
      if (targetItem?.product) {
        const wishlistStore = useWishlistStore.getState();
        if (!wishlistStore.isWishlisted(targetItem.product.id)) {
          await wishlistStore.toggleWishlist(targetItem.product);
        }
      }
      return { items: nextItems, summary };
    }
    const res = await api.post(`/cart/items/${itemId}/move-to-wishlist`);
    const data = res.data.data;
    set({ items: data.items || [], summary: data.summary || {} });
    await useWishlistStore.getState().fetchWishlist();
    return data;
  },

  applyCoupon: async (code) => {
    const res = await api.post('/cart/coupon', { code });
    const data = res.data.data;
    set({ items: data.items || [], summary: data.summary || {} });
    return data;
  },

  removeCoupon: async () => {
    const res = await api.delete('/cart/coupon');
    const data = res.data.data;
    set({ items: data.items || [], summary: data.summary || {} });
    return data;
  },

  syncGuestCartToServer: async () => {
    if (!getAuthToken()) return;
    const guestItems = readGuestCart();
    if (guestItems.length > 0) {
      for (const item of guestItems) {
        try {
          await api.post('/cart/items', {
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity || 1,
            custom_options: item.custom_options || null,
          });
        } catch {
          // Ignore invalid guest items
        }
      }
      writeGuestCart([]);
    }
    await get().fetchCart();
  },

  clearLocalCart: () => {
    writeGuestCart([]);
    set({
      items: [],
      summary: buildGuestSummary([]),
    });
  },
}));
