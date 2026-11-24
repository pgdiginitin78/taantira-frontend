import { create } from 'zustand';
import api, { getAuthToken } from '../services/api';

export const useCartStore = create((set) => ({
  items: [],
  summary: {
    lineItems: [],
    subtotal: 0,
    discountAmount: 0,
    coupon: null,
    taxAmount: 0,
    shippingFee: 0,
    totalAmount: 0,
    upiVpa: 'taantira.atelier@upi',
    upiPayeeName: 'Taantira Handloom & Couture Atelier',
    freeShippingThreshold: 2999,
  },
  loading: false,

  fetchCart: async (pincode = null) => {
    if (!getAuthToken()) return null;
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

  addItem: async ({ product_id, variant_id, quantity = 1, custom_options = null }) => {
    const res = await api.post('/cart/items', { product_id, variant_id, quantity, custom_options });
    const data = res.data.data;
    set({ items: data.items || [], summary: data.summary || {} });
    return data;
  },

  updateQty: async (itemId, quantity) => {
    const res = await api.put(`/cart/items/${itemId}`, { quantity });
    const data = res.data.data;
    set({ items: data.items || [], summary: data.summary || {} });
    return data;
  },

  removeItem: async (itemId) => {
    const res = await api.delete(`/cart/items/${itemId}`);
    const data = res.data.data;
    set({ items: data.items || [], summary: data.summary || {} });
    return data;
  },

  moveToWishlist: async (itemId) => {
    const res = await api.post(`/cart/items/${itemId}/move-to-wishlist`);
    const data = res.data.data;
    set({ items: data.items || [], summary: data.summary || {} });
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

  clearLocalCart: () => {
    set({
      items: [],
      summary: { lineItems: [], subtotal: 0, discountAmount: 0, coupon: null, taxAmount: 0, shippingFee: 0, totalAmount: 0 },
    });
  },
}));
