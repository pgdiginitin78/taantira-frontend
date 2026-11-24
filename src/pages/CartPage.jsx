import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Button, TextField, Alert } from "@mui/material";
import { Trash2, Heart, Tag, ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { useAuthStore } from "../store/useAuthStore";
import { couponApplyValidationSchema } from "../validations/schemas";
import { formatINR } from "../utils/formatters";

export default function CartPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const {
    items,
    summary,
    fetchCart,
    updateQty,
    removeItem,
    moveToWishlist,
    applyCoupon,
    removeCoupon,
  } = useCartStore();
  const [couponMsg, setCouponMsg] = useState("");
  const [couponErr, setCouponErr] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(couponApplyValidationSchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated, fetchCart]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-[#641B32]" />
        <h1 className="mt-4 font-serif text-3xl font-bold text-[#3D1023]">
          Your Taantira Shopping Bag
        </h1>
        <p className="mt-2 text-sm text-[#641B32]/80">
          Please sign in to save pieces to your bag and apply privileges.
        </p>
        <Link
          to="/login"
          state={{ from: "/cart" }}
          className="mt-6 inline-block rounded-full bg-[#641B32] px-6 py-3 text-xs font-semibold text-[#FFF9F2]"
        >
          Sign In to View Bag
        </Link>
      </div>
    );
  }

  const onApplyCoupon = async (values) => {
    setCouponErr("");
    setCouponMsg("");
    try {
      await applyCoupon(values.code);
      setCouponMsg(`Coupon ${values.code} applied.`);
      reset();
    } catch (err) {
      setCouponErr(err.response?.data?.message || "Unable to apply coupon.");
    }
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    setCouponMsg("");
    setCouponErr("");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-bold text-[#3D1023]">
        Shopping Bag ({items.length})
      </h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-[#D9A0A9]/40 bg-white p-12 text-center shadow-sm">
          <p className="text-base font-medium text-[#3D1023]">
            Your shopping bag is currently empty.
          </p>
          <Link
            to="/collections/all"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#641B32] px-6 py-2.5 text-xs font-semibold text-[#FFF9F2]"
          >
            Explore Collections <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            {items.map((item) => {
              const product = item.product || {};
              const variant = item.variant || {};
              const line = (summary.lineItems || []).find(
                (l) => l.cart_item_id === item.id,
              );
              const imgUrl =
                product.images?.[0]?.image_url ||
                "/assets/products/saree-burgundy.jpg";
              const custom = item.custom_options_json || {};

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#D9A0A9]/40 bg-white p-4 shadow-sm sm:flex-row"
                >
                  <Link
                    to={`/products/${product.slug}`}
                    className="h-36 w-28 shrink-0 overflow-hidden rounded-xl bg-[#F5E7E8]"
                  >
                    <img
                      src={imgUrl}
                      alt={product.name}
                      className="h-full w-full object-cover object-top"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/products/${product.slug}`}
                          className="text-base font-semibold text-[#3D1023] hover:text-[#641B32]"
                        >
                          {product.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-[#641B32]/75">
                          Size: {variant.size} &bull; Shade:{" "}
                          {variant.color_name} &bull; SKU: {variant.sku}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-[#A83F5E]">
                          {custom.matching_blouse && (
                            <span className="rounded bg-[#F5E7E8] px-2 py-0.5">
                              + Matching Blouse
                            </span>
                          )}
                          {custom.petticoat && (
                            <span className="rounded bg-[#F5E7E8] px-2 py-0.5">
                              + Petticoat
                            </span>
                          )}
                          {custom.gift_wrap && (
                            <span className="rounded bg-[#F5E7E8] px-2 py-0.5">
                              + Gift Wrap
                            </span>
                          )}
                          {custom.gift_box && (
                            <span className="rounded bg-[#F5E7E8] px-2 py-0.5">
                              + Gift Box
                            </span>
                          )}
                          {custom.tote_bag && (
                            <span className="rounded bg-[#F5E7E8] px-2 py-0.5">
                              + Tote Bag
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-base font-bold text-[#641B32]">
                        {formatINR(line?.line_subtotal || 0)}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#F5E7E8] pt-3">
                      <div className="flex items-center rounded-lg border border-[#D9A0A9]/60">
                        <button
                          type="button"
                          onClick={() =>
                            item.quantity > 1 &&
                            updateQty(item.id, item.quantity - 1)
                          }
                          className="px-3 py-1 text-sm font-bold text-[#641B32]"
                        >
                          -
                        </button>
                        <span className="px-2.5 text-xs font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-sm font-bold text-[#641B32]"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <button
                          type="button"
                          onClick={() => moveToWishlist(item.id)}
                          className="inline-flex items-center gap-1 font-medium text-[#641B32] hover:text-[#A83F5E]"
                        >
                          <Heart className="h-3.5 w-3.5" /> Save to Wishlist
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="inline-flex items-center gap-1 font-medium text-red-700 hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bag Summary */}
          <div className="space-y-5 lg:col-span-4">
            <div className="rounded-2xl border border-[#D9A0A9]/40 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#3D1023]">
                <Tag className="h-4 w-4 text-[#C39A52]" /> Apply Privilege Code
              </h2>
              <form
                onSubmit={handleSubmit(onApplyCoupon)}
                className="mt-3 flex gap-2"
              >
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      size="small"
                      fullWidth
                      placeholder="e.g. TAANTIRA10"
                      error={Boolean(errors.code)}
                      helperText={errors.code?.message}
                    />
                  )}
                />
                <Button
                  type="submit"
                  variant="outlined"
                  color="primary"
                  disabled={isSubmitting}
                >
                  Apply
                </Button>
              </form>
              {summary.coupon && (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-[#F5E7E8] px-3 py-2 text-xs text-[#641B32]">
                  <span>
                    Applied: <strong>{summary.coupon.code}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="font-semibold underline"
                  >
                    Remove
                  </button>
                </div>
              )}
              {couponMsg && (
                <Alert severity="success" className="mt-2">
                  {couponMsg}
                </Alert>
              )}
              {couponErr && (
                <Alert severity="error" className="mt-2">
                  {couponErr}
                </Alert>
              )}

              <div className="mt-6 space-y-2.5 border-t border-[#F5E7E8] pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#641B32]/80">Subtotal</span>
                  <span className="font-medium">
                    {formatINR(summary.subtotal)}
                  </span>
                </div>
                {Number(summary.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-{formatINR(summary.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#641B32]/80">Estimated Tax (GST)</span>
                  <span className="font-medium">
                    {formatINR(summary.taxAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#641B32]/80">Delivery Fee</span>
                  <span className="font-medium">
                    {Number(summary.shippingFee) === 0
                      ? "Complimentary"
                      : formatINR(summary.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#D9A0A9]/40 pt-3 text-base font-bold text-[#641B32]">
                  <span>Final Total</span>
                  <span>{formatINR(summary.totalAmount)}</span>
                </div>
              </div>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                onClick={() => navigate("/checkout")}
                className="mt-6 py-3"
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
